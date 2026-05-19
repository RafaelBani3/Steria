import prisma from '../prisma/index.js';

// ─── GET INCOMES ──────────────────────────────────────
export const getIncomes = async (req, res) => {
  try {
    const { month, year } = req.query;

    const where = { userId: req.user.userId };
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.transactionDate = { gte: startDate, lte: endDate };
    }

    const incomes = await prisma.income.findMany({
      where,
      include: { account: { select: { id: true, accountName: true, providerName: true, color: true, icon: true } } },
      orderBy: { transactionDate: 'desc' },
    });

    res.json(incomes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── CREATE INCOME ────────────────────────────────────
export const createIncome = async (req, res) => {
  try {
    const { accountId, amount, incomeType, description, transactionDate } = req.body;

    // Create income record
    const income = await prisma.income.create({
      data: {
        userId: req.user.userId,
        accountId,
        amount: parseFloat(amount),
        incomeType: incomeType || 'OTHER',
        description,
        transactionDate: new Date(transactionDate),
      },
      include: { account: true },
    });

    // Update account balance
    await prisma.account.update({
      where: { id: accountId },
      data: { currentBalance: { increment: parseFloat(amount) } },
    });

    res.status(201).json(income);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── DELETE INCOME ────────────────────────────────────
export const deleteIncome = async (req, res) => {
  try {
    const { incomeId } = req.params;

    const income = await prisma.income.findUnique({
      where: { id: incomeId },
    });

    if (!income || income.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Reverse balance update
    await prisma.account.update({
      where: { id: income.accountId },
      data: { currentBalance: { decrement: income.amount } },
    });

    await prisma.income.delete({ where: { id: incomeId } });

    res.json({ message: 'Income deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── GET INCOME SUMMARY ───────────────────────────────
export const getIncomeSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const summary = await prisma.income.groupBy({
      by: ['accountId'],
      where: {
        userId: req.user.userId,
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
      _count: true,
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
