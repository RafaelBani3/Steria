import prisma from '../prisma/index.js';
import { createBudgetNotification } from './notification.controller.js';

// ─── GET BUDGET ITEMS ──────────────────────────────────
export const getBudgetItems = async (req, res) => {
  try {
    const { period } = req.query; // "YYYY-MM"
    const where = { userId: req.user.userId };
    if (period) where.period = period;

    const items = await prisma.budgetItem.findMany({
      where,
      include: {
        category: true,
        sourceAccount: { select: { id: true, accountName: true, providerName: true, color: true, icon: true } },
        account: { select: { id: true, accountName: true, providerName: true, color: true, icon: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── CREATE BUDGET ITEM ────────────────────────────────
// Creating a budget item = pure planning (soft layer, no money movement)
export const createBudgetItem = async (req, res) => {
  try {
    const { categoryId, accountId, itemName, allocatedAmount, color, period } = req.body;

    const allocated = parseFloat(allocatedAmount);

    const item = await prisma.budgetItem.create({
      data: {
        userId: req.user.userId,
        categoryId,
        sourceAccountId: null,
        accountId: accountId || null,
        itemName,
        allocatedAmount: allocated,
        usedAmount: 0,
        remainingAmount: allocated,
        color,
        period,
      },
      include: {
        category: true,
        sourceAccount: { select: { id: true, accountName: true, providerName: true, color: true, icon: true } },
        account: { select: { id: true, accountName: true, providerName: true, color: true, icon: true } },
      },
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── UPDATE BUDGET ITEM ────────────────────────────────
export const updateBudgetItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { itemName, allocatedAmount, accountId, color } = req.body;

    const existing = await prisma.budgetItem.findUnique({ where: { id: itemId } });
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const allocated = allocatedAmount !== undefined ? parseFloat(allocatedAmount) : existing.allocatedAmount;
    const remaining = Math.max(0, allocated - existing.usedAmount);

    const item = await prisma.budgetItem.update({
      where: { id: itemId },
      data: {
        itemName,
        allocatedAmount: allocated,
        remainingAmount: remaining,
        accountId: accountId !== undefined ? accountId : existing.accountId,
        color,
        updatedAt: new Date(),
      },
      include: {
        category: true,
        sourceAccount: { select: { id: true, accountName: true, providerName: true, color: true, icon: true } },
        account: { select: { id: true, accountName: true, providerName: true, color: true, icon: true } },
      },
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── DELETE BUDGET ITEM ────────────────────────────────
export const deleteBudgetItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const existing = await prisma.budgetItem.findUnique({ where: { id: itemId } });
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.budgetItem.delete({ where: { id: itemId } });
    res.json({ message: 'Budget item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── RECALCULATE BUDGET ITEM (called after expense) ───
export const recalculateBudgetItem = async (itemId) => {
  const item = await prisma.budgetItem.findUnique({ where: { id: itemId } });
  if (!item) return null;

  const expenses = await prisma.expense.aggregate({
    where: { budgetItemId: itemId },
    _sum: { amount: true },
  });

  const used = expenses._sum.amount || 0;
  const remaining = Math.max(0, item.allocatedAmount - used);
  const usagePercent = item.allocatedAmount > 0 ? (used / item.allocatedAmount) * 100 : 0;

  const updated = await prisma.budgetItem.update({
    where: { id: itemId },
    data: { usedAmount: used, remainingAmount: remaining },
  });

  // Trigger budget alert notifications at 80% and 100%
  if (usagePercent >= 80) {
    await createBudgetNotification(item.userId, item.itemName, usagePercent);
  }

  return updated;
};
