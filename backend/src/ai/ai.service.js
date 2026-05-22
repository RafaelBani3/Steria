import { orchestrateAI } from './aiOrchestrator.js';
import prisma from '../prisma/index.js';

export const processFinanceTransaction = async (userId, messageText) => {
  try {
    console.log('[AI Service] Building financial context...');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfHistory = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // ─── Parallel DB fetch ───────────────────────────────
    const [user, accounts, budgetCategories, recentExpenses, recentIncomes] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.account.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.budgetCategory.findMany({
        where: { userId },
        include: {
          budgetItems: {
            include: { account: { select: { id: true, accountName: true, providerName: true } } },
          },
        },
      }),
      prisma.expense.findMany({
        where: { userId, transactionDate: { gte: startOfHistory, lte: endOfMonth } },
        include: {
          account: { select: { id: true, providerName: true, accountName: true } },
          budgetItem: { select: { id: true, itemName: true } },
        },
        orderBy: { transactionDate: 'desc' },
        take: 300,
      }),
      prisma.income.findMany({
        where: { userId, transactionDate: { gte: startOfHistory, lte: endOfMonth } },
        orderBy: { transactionDate: 'desc' },
        take: 100,
      }),
    ]);

    // ─── Backend analytics (AI never recalculates these) ─
    const totalCashflow = accounts
      .filter(a => a.accountType === 'CASHFLOW')
      .reduce((sum, a) => sum + a.currentBalance, 0);
    const totalSavings = accounts
      .filter(a => a.accountType === 'SAVINGS')
      .reduce((sum, a) => sum + a.currentBalance, 0);

    const monthlyIncome = recentIncomes.reduce((sum, i) => {
      const d = new Date(i.transactionDate);
      return (d >= startOfMonth && d <= endOfMonth) ? sum + i.amount : sum;
    }, 0);
    const monthlyExpenses = recentExpenses.reduce((sum, e) => {
      const d = new Date(e.transactionDate);
      return (d >= startOfMonth && d <= endOfMonth) ? sum + e.amount : sum;
    }, 0);

    // 6-month aggregated history
    const historyMonths = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      historyMonths[key] = { expense: 0, income: 0 };
    }
    recentExpenses.forEach(e => {
      const d = new Date(e.transactionDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (historyMonths[key]) historyMonths[key].expense += e.amount;
    });
    recentIncomes.forEach(i => {
      const d = new Date(i.transactionDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (historyMonths[key]) historyMonths[key].income += i.amount;
    });

    // Budget items flat list
    const allBudgetItems = budgetCategories.flatMap(cat =>
      cat.budgetItems.map(item => ({
        id: item.id,
        categoryName: cat.categoryName,
        itemName: item.itemName,
        allocatedAmount: item.allocatedAmount,
        usedAmount: item.usedAmount,
        remainingAmount: item.remainingAmount,
        accountName: item.account?.providerName || 'Any',
      }))
    );

    // Account spending stats (only what AI needs)
    const accountStats = accounts.map(account => ({
      id: account.id,
      name: account.accountName,
      provider: account.providerName,
      type: account.accountType,
      balance: account.currentBalance,
      monthlySpent: recentExpenses
        .filter(e => e.accountId === account.id)
        .reduce((sum, e) => sum + e.amount, 0),
    }));

    const financialContext = {
      userName: user?.name || 'User',
      accounts: accountStats,
      budgetItems: allBudgetItems,
      totalCashflow,
      totalSavings,
      monthlyIncome,
      monthlyExpenses,
      historicalSummary: historyMonths,
      currentDate: now.toISOString().split('T')[0],
    };

    // ─── Orchestrate AI ──────────────────────────────────
    console.log('[AI Service] Sending to orchestrator...');
    const responseText = await orchestrateAI(userId, messageText, financialContext, true);
    console.log('[AI Service] AI response received.');

    // ─── Parse & validate AI response ───────────────────
    const cleanedJson = responseText.replace(/```json\s?|```/g, '').trim();
    const aiResponse = JSON.parse(cleanedJson);

    // ─── Execute tasks ───────────────────────────────────
    const taskResults = [];
    const tasks = aiResponse.tasks || [aiResponse];

    for (const task of tasks) {
      let dbResult = null;
      switch (task.intent) {
        case 'EXPENSE':
          dbResult = await handleExpense(userId, task.data, accounts, allBudgetItems, budgetCategories);
          break;
        case 'INCOME':
          dbResult = await handleIncome(userId, task.data, accounts);
          break;
        case 'ALLOCATION':
          dbResult = await handleAllocation(userId, task.data, budgetCategories);
          break;
        case 'SAVING':
          dbResult = await handleSaving(userId, task.data, accounts);
          break;
        case 'TRANSFER':
          dbResult = await handleTransfer(userId, task.data, accounts);
          break;
        case 'INQUIRY':
          // Read-only — no DB action needed
          break;
        default:
          console.warn('[AI Service] Unknown intent:', task.intent);
      }
      taskResults.push({ intent: task.intent, result: dbResult });
    }

    return {
      success: true,
      message: aiResponse.global_reply || aiResponse.reply || 'Oke, sudah saya proses! ✨',
      insights: aiResponse.insights || [],
      tasks: taskResults,
    };
  } catch (error) {
    console.error('[AI Service] Error:', error.message);
    throw error;
  }
};

// ─── Context builder for insights (read-only) ─────────────────────────────────
export const buildFinancialContext = async (userId) => {
  const now = new Date();
  const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth    = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const startOfHistory = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [user, accounts, recentExpenses, recentIncomes] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.account.findMany({ where: { userId, isActive: true } }),
    prisma.expense.findMany({
      where: { userId, transactionDate: { gte: startOfHistory, lte: endOfMonth } },
      select: { amount: true, transactionDate: true, accountId: true },
      take: 300,
    }),
    prisma.income.findMany({
      where: { userId, transactionDate: { gte: startOfHistory, lte: endOfMonth } },
      select: { amount: true, transactionDate: true },
      take: 100,
    }),
  ]);

  const totalCashflow = accounts.filter(a => a.accountType === 'CASHFLOW').reduce((s, a) => s + a.currentBalance, 0);
  const totalSavings  = accounts.filter(a => a.accountType === 'SAVINGS').reduce((s, a) => s + a.currentBalance, 0);

  const monthlyIncome    = recentIncomes.filter(i => new Date(i.transactionDate) >= startOfMonth).reduce((s, i) => s + i.amount, 0);
  const monthlyExpenses  = recentExpenses.filter(e => new Date(e.transactionDate) >= startOfMonth).reduce((s, e) => s + e.amount, 0);

  const historyMonths = {};
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    historyMonths[key] = { expense: 0, income: 0 };
  }
  recentExpenses.forEach(e => {
    const key = `${new Date(e.transactionDate).getFullYear()}-${String(new Date(e.transactionDate).getMonth() + 1).padStart(2, '0')}`;
    if (historyMonths[key]) historyMonths[key].expense += e.amount;
  });
  recentIncomes.forEach(i => {
    const key = `${new Date(i.transactionDate).getFullYear()}-${String(new Date(i.transactionDate).getMonth() + 1).padStart(2, '0')}`;
    if (historyMonths[key]) historyMonths[key].income += i.amount;
  });

  return {
    userName: user?.name || 'User',
    accounts: accounts.map(a => ({
      id: a.id, name: a.accountName, provider: a.providerName,
      type: a.accountType, balance: a.currentBalance, monthlySpent: 0,
    })),
    totalCashflow, totalSavings, monthlyIncome, monthlyExpenses,
    historicalSummary: historyMonths,
    currentDate: now.toISOString().split('T')[0],
  };
};

// ─── HANDLERS ─────────────────────────────────────────────────────────────────

async function handleExpense(userId, data, accounts, budgetItems, budgetCategories) {
  // Match account by provider name if mentioned, else first cashflow
  let targetAccount = null;
  if (data.source_account) {
    targetAccount = accounts.find(a =>
      a.providerName?.toLowerCase().includes(data.source_account.toLowerCase()) ||
      a.accountName?.toLowerCase().includes(data.source_account.toLowerCase())
    );
  }
  if (!targetAccount) {
    targetAccount = accounts.find(a => a.accountType === 'CASHFLOW');
  }
  if (!targetAccount) return null;

  const matchedItem = budgetItems.find(item =>
    item.itemName?.toLowerCase().includes(data.subcategory?.toLowerCase())
  );
  const matchedCategory = budgetCategories.find(cat =>
    cat.categoryName?.toLowerCase() === data.category?.toLowerCase()
  );

  const expense = await prisma.expense.create({
    data: {
      userId,
      accountId: targetAccount.id,
      budgetItemId: matchedItem?.id || null,
      categoryId: matchedCategory?.id || null,
      amount: data.amount,
      description: data.description || data.subcategory,
      transactionDate: data.date ? new Date(data.date) : new Date(),
    },
  });

  await prisma.account.update({
    where: { id: targetAccount.id },
    data: { currentBalance: { decrement: data.amount } },
  });

  if (matchedItem?.id) {
    const { recalculateBudgetItem } = await import('../controllers/budget.item.controller.js');
    await recalculateBudgetItem(matchedItem.id);
  }

  return expense;
}

async function handleIncome(userId, data, accounts) {
  let targetAccount = null;
  if (data.source_account) {
    targetAccount = accounts.find(a =>
      a.providerName?.toLowerCase().includes(data.source_account.toLowerCase())
    );
  }
  if (!targetAccount) targetAccount = accounts.find(a => a.accountType === 'CASHFLOW');
  if (!targetAccount) return null;

  const income = await prisma.income.create({
    data: {
      userId,
      accountId: targetAccount.id,
      amount: data.amount,
      incomeType: 'OTHER',
      description: data.description || data.subcategory || 'Income',
      transactionDate: data.date ? new Date(data.date) : new Date(),
    },
  });

  await prisma.account.update({
    where: { id: targetAccount.id },
    data: { currentBalance: { increment: data.amount } },
  });

  return income;
}

async function handleAllocation(userId, data, budgetCategories) {
  const matchedCategory =
    budgetCategories.find(cat =>
      cat.categoryName?.toLowerCase() === data.category?.toLowerCase()
    ) || budgetCategories[0];

  if (!matchedCategory) return null;

  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const existingItem = await prisma.budgetItem.findFirst({
    where: {
      userId,
      categoryId: matchedCategory.id,
      itemName: { equals: data.subcategory, mode: 'insensitive' },
      period,
    },
  });

  if (existingItem) {
    const newAllocated = existingItem.allocatedAmount + data.amount;
    return await prisma.budgetItem.update({
      where: { id: existingItem.id },
      data: {
        allocatedAmount: newAllocated,
        remainingAmount: Math.max(0, newAllocated - existingItem.usedAmount),
      },
    });
  }

  return await prisma.budgetItem.create({
    data: {
      userId,
      categoryId: matchedCategory.id,
      itemName: data.subcategory || 'Budget Item',
      allocatedAmount: data.amount,
      usedAmount: 0,
      remainingAmount: data.amount,
      period,
    },
  });
}

async function handleSaving(userId, data, accounts) {
  const cashflowAccount = accounts.find(a => a.accountType === 'CASHFLOW');
  const savingsAccount = accounts.find(a => a.accountType === 'SAVINGS');
  if (!cashflowAccount || !savingsAccount) return null;

  const transaction = await prisma.transfer.create({
    data: {
      userId,
      fromAccountId: cashflowAccount.id,
      toAccountId: savingsAccount.id,
      amount: data.amount,
      transferType: 'ADD_FUNDS',
      notes: data.description,
      transactionDate: data.date ? new Date(data.date) : new Date(),
    },
  });

  await prisma.account.update({ where: { id: cashflowAccount.id }, data: { currentBalance: { decrement: data.amount } } });
  await prisma.account.update({ where: { id: savingsAccount.id  }, data: { currentBalance: { increment: data.amount } } });

  return transaction;
}

async function handleTransfer(userId, data, accounts) {
  // Find source account
  let fromAccount = null;
  if (data.source_account) {
    fromAccount = accounts.find(a =>
      a.providerName?.toLowerCase().includes(data.source_account.toLowerCase()) ||
      a.accountName?.toLowerCase().includes(data.source_account.toLowerCase())
    );
  }
  if (!fromAccount) fromAccount = accounts.find(a => a.accountType === 'CASHFLOW');

  // Find destination account
  let toAccount = null;
  if (data.destination_account) {
    toAccount = accounts.find(a =>
      a.providerName?.toLowerCase().includes(data.destination_account.toLowerCase()) ||
      a.accountName?.toLowerCase().includes(data.destination_account.toLowerCase())
    );
  }
  if (!toAccount) toAccount = accounts.find(a => a.accountType === 'SAVINGS');

  if (!fromAccount || !toAccount || fromAccount.id === toAccount.id) return null;

  const transaction = await prisma.transfer.create({
    data: {
      userId,
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      amount: data.amount,
      transferType: 'TRANSFER',
      notes: data.description || `Transfer ke ${toAccount.accountName}`,
      transactionDate: data.date ? new Date(data.date) : new Date(),
    },
  });

  await prisma.account.update({ where: { id: fromAccount.id }, data: { currentBalance: { decrement: data.amount } } });
  await prisma.account.update({ where: { id: toAccount.id   }, data: { currentBalance: { increment: data.amount } } });

  return transaction;
}
