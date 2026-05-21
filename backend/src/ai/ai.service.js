import { getSystemPrompt } from './ai.prompt.js';
import prisma from '../prisma/index.js';
import { generateAIResponse } from './ai.providers.js';

export const processFinanceTransaction = async (userId, messageText) => {
  try {
    console.log('[AI Service] Fetching user context for v2 schema...');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfHistory = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Fetch all context with new schema
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
          account: { select: { id: true, providerName: true } },
          budgetItem: { select: { id: true, itemName: true } },
        },
        orderBy: { transactionDate: 'desc' },
        take: 500,
      }),
      prisma.income.findMany({
        where: { userId, transactionDate: { gte: startOfHistory, lte: endOfMonth } },
        orderBy: { transactionDate: 'desc' },
        take: 100,
      }),
    ]);

    // Pre-compute analytics for AI context (backend handles all numbers)
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

    // Aggregate 6-month history
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

    // Build budget items context (flat list for AI)
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

    // Build account spending stats
    const accountStats = accounts.map(account => {
      const spent = recentExpenses
        .filter(e => e.accountId === account.id)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        id: account.id,
        name: account.accountName,
        provider: account.providerName,
        type: account.accountType,
        balance: account.currentBalance,
        monthlySpent: spent,
      };
    });

    const context = {
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

    // Call AI with updated context
    const systemInstruction = getSystemPrompt(context);
    console.log('[AI Service] Calling AI provider...');
    const responseText = await generateAIResponse(systemInstruction, messageText, true);
    console.log('[AI Service] AI response received.');

    const cleanedJson = responseText.replace(/```json|```/g, '').trim();
    const aiResponse = JSON.parse(cleanedJson);

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
        case 'INQUIRY':
          break;
        default:
          console.warn('Unknown intent:', task.intent);
      }
      taskResults.push({ intent: task.intent, result: dbResult });
    }

    return {
      success: true,
      message: aiResponse.global_reply || aiResponse.reply || "Oke, sudah saya proses!",
      insights: aiResponse.insights || [],
      tasks: taskResults,
    };
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};

// ─── HANDLERS ─────────────────────────────────────────

async function handleExpense(userId, data, accounts, budgetItems, budgetCategories) {
  // Find matching budget item
  const matchedItem = budgetItems.find(item =>
    item.itemName?.toLowerCase().includes(data.subcategory?.toLowerCase())
  );

  // Find matching account (prefer account mentioned in data, else pick first cashflow)
  const cashflowAccount = accounts.find(a => a.accountType === 'CASHFLOW');
  if (!cashflowAccount) return null;

  // Find category
  const matchedCategory = budgetCategories.find(cat =>
    cat.categoryName?.toLowerCase() === data.category?.toLowerCase()
  );

  const expense = await prisma.expense.create({
    data: {
      userId,
      accountId: cashflowAccount.id,
      budgetItemId: matchedItem?.id || null,
      categoryId: matchedCategory?.id || null,
      amount: data.amount,
      description: data.description || data.subcategory,
      transactionDate: data.date ? new Date(data.date) : new Date(),
    },
  });

  // Update account balance
  await prisma.account.update({
    where: { id: cashflowAccount.id },
    data: { currentBalance: { decrement: data.amount } },
  });

  // Recalculate budget item
  if (matchedItem?.id) {
    const { recalculateBudgetItem } = await import('../controllers/budget.item.controller.js');
    await recalculateBudgetItem(matchedItem.id);
  }

  return expense;
}

async function handleIncome(userId, data, accounts) {
  const cashflowAccount = accounts.find(a => a.accountType === 'CASHFLOW');
  if (!cashflowAccount) return null;

  const income = await prisma.income.create({
    data: {
      userId,
      accountId: cashflowAccount.id,
      amount: data.amount,
      incomeType: 'OTHER',
      description: data.description || data.subcategory || 'Income',
      transactionDate: data.date ? new Date(data.date) : new Date(),
    },
  });

  await prisma.account.update({
    where: { id: cashflowAccount.id },
    data: { currentBalance: { increment: data.amount } },
  });

  return income;
}

async function handleAllocation(userId, data, budgetCategories) {
  const matchedCategory = budgetCategories.find(cat =>
    cat.categoryName?.toLowerCase() === data.category?.toLowerCase()
  ) || budgetCategories[0]; // fallback to first

  if (!matchedCategory) return null;

  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Check if item already exists
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

  // Create savings transaction via Transfer
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

  // Update balances
  await prisma.account.update({
    where: { id: cashflowAccount.id },
    data: { currentBalance: { decrement: data.amount } },
  });
  await prisma.account.update({
    where: { id: savingsAccount.id },
    data: { currentBalance: { increment: data.amount } },
  });

  return transaction;
}
