import prisma from '../prisma/index.js';
import { recalculateBudgetItem } from './budget.item.controller.js';

// ─── GET EXPENSES ──────────────────────────────────────
export const getExpenses = async (req, res) => {
  try {
    const { month, year } = req.query;

    const where = { userId: req.user.userId };
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.transactionDate = { gte: startDate, lte: endDate };
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        account: { select: { id: true, accountName: true, providerName: true, color: true, icon: true } },
        budgetItem: { select: { id: true, itemName: true, color: true } },
        category: { select: { id: true, categoryName: true } },
      },
      orderBy: { transactionDate: 'desc' },
    });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── CREATE EXPENSE ────────────────────────────────────
export const createExpense = async (req, res) => {
  try {
    const { accountId, budgetItemId, categoryId, amount, description, transactionDate, notes } = req.body;

    const expense = await prisma.expense.create({
      data: {
        userId: req.user.userId,
        accountId,
        budgetItemId: budgetItemId || null,
        categoryId: categoryId || null,
        amount: parseFloat(amount),
        description,
        transactionDate: new Date(transactionDate),
        notes,
      },
      include: {
        account: { select: { id: true, accountName: true, providerName: true, color: true, icon: true } },
        budgetItem: { select: { id: true, itemName: true, color: true } },
        category: { select: { id: true, categoryName: true } },
      },
    });

    // Deduct from account balance
    await prisma.account.update({
      where: { id: accountId },
      data: { currentBalance: { decrement: parseFloat(amount) } },
    });

    // Recalculate budget item used/remaining
    if (budgetItemId) {
      await recalculateBudgetItem(budgetItemId);
    }

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── DELETE EXPENSE ────────────────────────────────────
export const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense || expense.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Restore account balance
    await prisma.account.update({
      where: { id: expense.accountId },
      data: { currentBalance: { increment: expense.amount } },
    });

    await prisma.expense.delete({ where: { id: expenseId } });

    // Recalculate budget item
    if (expense.budgetItemId) {
      await recalculateBudgetItem(expense.budgetItemId);
    }

    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── GET EXPENSE ANALYTICS ─────────────────────────────
export const getExpenseAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const byAccount = await prisma.expense.groupBy({
      by: ['accountId'],
      where: {
        userId: req.user.userId,
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    const byCategory = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        userId: req.user.userId,
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    res.json({ byAccount, byCategory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
