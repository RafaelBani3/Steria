import prisma from '../prisma/index.js';
import { createSavingsMilestoneNotification } from './notification.controller.js';

// ─── GET SAVINGS TRANSACTIONS ──────────────────────────
export const getSavingsTransactions = async (req, res) => {
  try {
    const { goalId } = req.query;

    const where = { userId: req.user.userId };
    if (goalId) where.savingsGoalId = goalId;

    const transactions = await prisma.savingsTransaction.findMany({
      where,
      include: {
        sourceAccount: { select: { id: true, accountName: true, providerName: true, color: true, icon: true } },
        destinationAccount: { select: { id: true, accountName: true, providerName: true, color: true, icon: true } },
        savingsGoal: { select: { id: true, goalName: true, targetAmount: true, currentAmount: true } },
      },
      orderBy: { transactionDate: 'desc' },
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── CREATE SAVINGS TRANSACTION ────────────────────────
export const createSavingsTransaction = async (req, res) => {
  try {
    const { sourceAccountId, destinationSavingsAccountId, savingsGoalId, amount, transactionDate, notes } = req.body;

    const parsedAmount = parseFloat(amount);

    // Verify source account belongs to user
    const sourceAccount = await prisma.account.findUnique({ where: { id: sourceAccountId } });
    if (!sourceAccount || sourceAccount.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Invalid source account' });
    }

    if (sourceAccount.currentBalance < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient balance in source account' });
    }

    // Create transaction
    const transaction = await prisma.savingsTransaction.create({
      data: {
        userId: req.user.userId,
        sourceAccountId,
        destinationSavingsAccountId,
        savingsGoalId: savingsGoalId || null,
        amount: parsedAmount,
        transactionDate: new Date(transactionDate),
        notes,
      },
      include: {
        sourceAccount: { select: { id: true, accountName: true, providerName: true, color: true, icon: true } },
        destinationAccount: { select: { id: true, accountName: true, providerName: true, color: true, icon: true } },
        savingsGoal: true,
      },
    });

    // Update source account balance (decrease)
    await prisma.account.update({
      where: { id: sourceAccountId },
      data: { currentBalance: { decrement: parsedAmount } },
    });

    // Update destination account balance (increase)
    await prisma.account.update({
      where: { id: destinationSavingsAccountId },
      data: { currentBalance: { increment: parsedAmount } },
    });

    // Update savings goal if linked
    if (savingsGoalId) {
      const goal = await prisma.savingsGoal.findUnique({ where: { id: savingsGoalId } });
      if (goal) {
        const newAmount = goal.currentAmount + parsedAmount;
        await prisma.savingsGoal.update({
          where: { id: savingsGoalId },
          data: { currentAmount: newAmount, updatedAt: new Date() },
        });

        // Trigger milestone notifications
        const prevPercent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        const newPercent = goal.targetAmount > 0 ? (newAmount / goal.targetAmount) * 100 : 0;
        const milestones = [25, 50, 75, 100];
        for (const m of milestones) {
          if (prevPercent < m && newPercent >= m) {
            await createSavingsMilestoneNotification(req.user.userId, goal.goalName, m);
          }
        }
      }
    }

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── DELETE SAVINGS TRANSACTION ────────────────────────
export const deleteSavingsTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const tx = await prisma.savingsTransaction.findUnique({ where: { id: transactionId } });
    if (!tx || tx.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Reverse balances
    await prisma.account.update({
      where: { id: tx.sourceAccountId },
      data: { currentBalance: { increment: tx.amount } },
    });
    await prisma.account.update({
      where: { id: tx.destinationSavingsAccountId },
      data: { currentBalance: { decrement: tx.amount } },
    });

    // Reverse goal amount
    if (tx.savingsGoalId) {
      const goal = await prisma.savingsGoal.findUnique({ where: { id: tx.savingsGoalId } });
      if (goal) {
        await prisma.savingsGoal.update({
          where: { id: tx.savingsGoalId },
          data: { currentAmount: Math.max(0, goal.currentAmount - tx.amount) },
        });
      }
    }

    await prisma.savingsTransaction.delete({ where: { id: transactionId } });
    res.json({ message: 'Transaction deleted and balances reversed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
