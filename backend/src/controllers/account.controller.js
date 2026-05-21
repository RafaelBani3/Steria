import prisma from '../prisma/index.js';

// ─── GET ALL ACCOUNTS ──────────────────────────────
export const getAccounts = async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user.userId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── GET ACCOUNT WITH ANALYTICS ──────────────────────
export const getAccountWithAnalytics = async (req, res) => {
  try {
    const { accountId } = req.params;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const account = await prisma.account.findUnique({
      where: { id: accountId, userId: req.user.userId },
    });

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const [monthlyExpenses, monthlyIncome, transactionCount] = await Promise.all([
      prisma.expense.aggregate({
        where: { accountId, transactionDate: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.income.aggregate({
        where: { accountId, transactionDate: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.expense.count({
        where: { accountId, transactionDate: { gte: startOfMonth, lte: endOfMonth } },
      }),
    ]);

    res.json({
      ...account,
      analytics: {
        monthlyExpenses: monthlyExpenses._sum.amount || 0,
        monthlyIncome: monthlyIncome._sum.amount || 0,
        transactionCount,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── GET ACCOUNT SUMMARY ──────────────────────────────
export const getAccountSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const accounts = await prisma.account.findMany({
      where: { userId: req.user.userId, isActive: true },
    });

    const accountsWithStats = await Promise.all(
      accounts.map(async (account) => {
        const [expStats, incStats] = await Promise.all([
          prisma.expense.aggregate({
            where: { accountId: account.id, transactionDate: { gte: startOfMonth, lte: endOfMonth } },
            _sum: { amount: true },
            _count: true,
          }),
          prisma.income.aggregate({
            where: { accountId: account.id, transactionDate: { gte: startOfMonth, lte: endOfMonth } },
            _sum: { amount: true },
          }),
        ]);

        return {
          ...account,
          monthlyExpenses: expStats._sum.amount || 0,
          monthlyIncome: incStats._sum.amount || 0,
          transactionCount: expStats._count || 0,
        };
      })
    );

    const cashflowAccounts = accountsWithStats.filter(a => a.accountType === 'CASHFLOW');
    const savingsAccounts = accountsWithStats.filter(a => a.accountType === 'SAVINGS');

    const totalCashflow = cashflowAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
    const totalSavings = savingsAccounts.reduce((sum, a) => sum + a.currentBalance, 0);

    res.json({
      accounts: accountsWithStats,
      cashflowAccounts,
      savingsAccounts,
      totalCashflow,
      totalSavings,
      totalBalance: totalCashflow + totalSavings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── CREATE ACCOUNT ──────────────────────────────────
export const createAccount = async (req, res) => {
  try {
    const { accountName, accountType, providerName, providerCategory, currentBalance, targetAmount, color, icon } = req.body;

    const account = await prisma.account.create({
      data: {
        userId: req.user.userId,
        accountName,
        accountType,
        providerName,
        providerCategory,
        currentBalance: parseFloat(currentBalance) || 0,
        targetAmount: targetAmount !== undefined && targetAmount !== null ? parseFloat(targetAmount) : null,
        color,
        icon,
      },
    });

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── UPDATE ACCOUNT ──────────────────────────────────
export const updateAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { accountName, color, icon, currentBalance, targetAmount } = req.body;

    const account = await prisma.account.update({
      where: { id: accountId, userId: req.user.userId },
      data: {
        accountName,
        color,
        icon,
        currentBalance: currentBalance !== undefined ? parseFloat(currentBalance) : undefined,
        targetAmount: targetAmount !== undefined ? (targetAmount !== null ? parseFloat(targetAmount) : null) : undefined,
        updatedAt: new Date(),
      },
    });

    res.json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── DELETE ACCOUNT (SOFT DELETE) ────────────────────
export const deleteAccount = async (req, res) => {
  try {
    const { accountId } = req.params;

    await prisma.account.update({
      where: { id: accountId, userId: req.user.userId },
      data: { isActive: false },
    });

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── GET ACCOUNT HISTORY (INCOME, OUTGOING/INCOMING ALLOCATIONS, EXPENSES) ───
export const getAccountHistory = async (req, res) => {
  try {
    const { accountId } = req.params;

    // Check if account exists
    const account = await prisma.account.findUnique({
      where: { id: accountId, userId: req.user.userId },
    });
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const [incomes, expenses, transfers] = await Promise.all([
      // 1. Incomes
      prisma.income.findMany({
        where: { accountId, userId: req.user.userId },
        orderBy: { transactionDate: 'desc' },
      }),
      // 2. Expenses
      prisma.expense.findMany({
        where: { accountId, userId: req.user.userId },
        include: { budgetItem: { select: { itemName: true } } },
        orderBy: { transactionDate: 'desc' },
      }),
      // 3. Transfers
      prisma.transfer.findMany({
        where: {
          userId: req.user.userId,
          OR: [
            { fromAccountId: accountId },
            { toAccountId: accountId }
          ]
        },
        include: {
          fromAccount: { select: { accountName: true, providerName: true } },
          toAccount: { select: { accountName: true, providerName: true } }
        },
        orderBy: { transactionDate: 'desc' },
      })
    ]);

    // Map and combine
    const feed = [];

    // Incomes
    incomes.forEach((inc) => {
      feed.push({
        id: inc.id,
        type: 'INCOME',
        amount: inc.amount,
        title: inc.description || 'Income',
        date: inc.transactionDate,
        details: inc.incomeType,
      });
    });

    // Expenses
    expenses.forEach((exp) => {
      feed.push({
        id: exp.id,
        type: 'EXPENSE',
        amount: exp.amount,
        title: exp.description || 'Pengeluaran',
        date: exp.transactionDate,
        details: exp.budgetItem ? `Budget: ${exp.budgetItem.itemName}` : 'General Expense',
      });
    });

    // Transfers
    transfers.forEach((tx) => {
      if (tx.fromAccountId === accountId) {
        // Outgoing Transfer
        feed.push({
          id: tx.id,
          type: 'TRANSFER_OUT',
          amount: tx.amount,
          title: tx.transferType === 'ADD_FUNDS' 
            ? `Transfer ke ${tx.toAccount?.accountName || 'Tabungan'}` 
            : `Tarik ke ${tx.toAccount?.accountName || 'Cashflow'}`,
          date: tx.transactionDate,
          details: tx.notes || 'Internal Transfer',
        });
      } else if (tx.toAccountId === accountId) {
        // Incoming Transfer
        feed.push({
          id: tx.id,
          type: 'TRANSFER_IN',
          amount: tx.amount,
          title: tx.transferType === 'ADD_FUNDS' 
            ? `Terima Transfer dari ${tx.fromAccount?.accountName || 'Cashflow'}` 
            : `Terima dari ${tx.fromAccount?.accountName || 'Tabungan'}`,
          date: tx.transactionDate,
          details: tx.notes || 'Internal Transfer',
        });
      }
    });

    // Sort combined feed by date descending
    feed.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(feed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
