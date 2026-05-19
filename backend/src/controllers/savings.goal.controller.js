import prisma from '../prisma/index.js';

// ─── GET SAVINGS GOALS ─────────────────────────────────
export const getSavingsGoals = async (req, res) => {
  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId: req.user.userId },
      include: {
        savingsAccount: { select: { id: true, accountName: true, providerName: true, currentBalance: true, color: true, icon: true } },
        transactions: { orderBy: { transactionDate: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── CREATE SAVINGS GOAL ───────────────────────────────
export const createSavingsGoal = async (req, res) => {
  try {
    const { savingsAccountId, goalName, targetAmount, targetDate } = req.body;

    const goal = await prisma.savingsGoal.create({
      data: {
        userId: req.user.userId,
        savingsAccountId,
        goalName,
        targetAmount: parseFloat(targetAmount),
        targetDate: targetDate ? new Date(targetDate) : null,
      },
      include: {
        savingsAccount: { select: { id: true, accountName: true, providerName: true, color: true, icon: true } },
      },
    });

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── UPDATE SAVINGS GOAL ───────────────────────────────
export const updateSavingsGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const { goalName, targetAmount, targetDate } = req.body;

    const goal = await prisma.savingsGoal.update({
      where: { id: goalId, userId: req.user.userId },
      data: {
        goalName,
        targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        updatedAt: new Date(),
      },
      include: {
        savingsAccount: { select: { id: true, accountName: true, providerName: true, color: true, icon: true } },
      },
    });

    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── DELETE SAVINGS GOAL ───────────────────────────────
export const deleteSavingsGoal = async (req, res) => {
  try {
    const { goalId } = req.params;

    const goal = await prisma.savingsGoal.findUnique({ where: { id: goalId } });
    if (!goal || goal.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.savingsGoal.delete({ where: { id: goalId } });
    res.json({ message: 'Savings goal deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
