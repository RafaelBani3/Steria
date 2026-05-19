import { getSystemPrompt } from './ai.prompt.js';
import prisma from '../prisma/index.js';
import { generateAIResponse } from './ai.providers.js';

export const processFinanceTransaction = async (userId, messageText) => {
  try {
    console.log('[AI Service] Fetching user context for v2 schema...');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Fetch all context with new schema
    const [user, accounts, budgetCategories, savingsGoals, recentExpenses, recentIncomes] = await Promise.all([
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
      prisma.savingsGoal.findMany({
        where: { userId },
        include: { savingsAccount: { select: { id: true, accountName: true, providerName: true } } },
      }),
      prisma.expense.findMany({
        where: { userId, transactionDate: { gte: startOfMonth, lte: endOfMonth } },
        include: {
          account: { select: { id: true, providerName: true } },
          budgetItem: { select: { id: true, itemName: true } },
        },
        orderBy: { transactionDate: 'desc' },
        take: 20,
      }),
      prisma.income.findMany({
        where: { userId, transactionDate: { gte: startOfMonth, lte: endOfMonth } },
        orderBy: { transactionDate: 'desc' },
        take: 10,
      }),
    ]);

    // Pre-compute analytics for AI context (backend handles all numbers)
    const totalCashflow = accounts
      .filter(a => a.accountType === 'CASHFLOW')
      .reduce((sum, a) => sum + a.currentBalance, 0);
    const totalSavings = accounts
      .filter(a => a.accountType === 'SAVINGS')
      .reduce((sum, a) => sum + a.currentBalance, 0);
    const monthlyIncome = recentIncomes.reduce((sum, i) => sum + i.amount, 0);
    const monthlyExpenses = recentExpenses.reduce((sum, e) => sum + e.amount, 0);

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
      savingsGoals: savingsGoals.map(g => ({
        id: g.id,
        name: g.goalName,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        progressPercent: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
        accountName: g.savingsAccount?.providerName || 'Savings Account',
      })),
      totalCashflow,
      totalSavings,
      monthlyIncome,
      monthlyExpenses,
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
          dbResult = await handleSaving(userId, task.data, savingsGoals, accounts);
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
      message: aiResponse.global_reply || aiResponse.reply,
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

async function handleSaving(userId, data, savingsGoals, accounts) {
  const goal = savingsGoals.find(g =>
    g.goalName?.toLowerCase().includes(data.subcategory?.toLowerCase())
  );
  if (!goal) return null;

  const cashflowAccount = accounts.find(a => a.accountType === 'CASHFLOW');
  const savingsAccount = accounts.find(a => a.id === goal.savingsAccountId);
  if (!cashflowAccount || !savingsAccount) return null;

  // Create savings transaction
  const transaction = await prisma.savingsTransaction.create({
    data: {
      userId,
      sourceAccountId: cashflowAccount.id,
      destinationSavingsAccountId: savingsAccount.id,
      savingsGoalId: goal.id,
      amount: data.amount,
      transactionDate: data.date ? new Date(data.date) : new Date(),
      notes: data.description,
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
  await prisma.savingsGoal.update({
    where: { id: goal.id },
    data: { currentAmount: { increment: data.amount } },
  });

  return transaction;
}
