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
// Creating a budget item = fund allocation (money moves from source → destination)
export const createBudgetItem = async (req, res) => {
  try {
    const { categoryId, sourceAccountId, accountId, itemName, allocatedAmount, color, period } = req.body;

    const allocated = parseFloat(allocatedAmount);

    // ── Fund Transfer: source → destination ──────────────
    if (sourceAccountId) {
      const sourceAccount = await prisma.account.findUnique({ where: { id: sourceAccountId } });
      if (!sourceAccount) {
        return res.status(404).json({ error: 'Source account not found' });
      }
      if (sourceAccount.currentBalance < allocated) {
        return res.status(400).json({
          error: `Saldo tidak mencukupi di akun ${sourceAccount.accountName}. Saldo saat ini: Rp${sourceAccount.currentBalance.toLocaleString('id-ID')}`
        });
      }

      // Deduct from source account (e.g., BNI income account)
      await prisma.account.update({
        where: { id: sourceAccountId },
        data: { currentBalance: { decrement: allocated } },
      });
    }

    if (accountId && accountId !== sourceAccountId) {
      // Add to destination account (e.g., Superbank Cashflow, SeaBank, Tabungan)
      await prisma.account.update({
        where: { id: accountId },
        data: { currentBalance: { increment: allocated } },
      });
    }
    // ─────────────────────────────────────────────────────

    const item = await prisma.budgetItem.create({
      data: {
        userId: req.user.userId,
        categoryId,
        sourceAccountId: sourceAccountId || null,
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
    const { itemName, allocatedAmount, accountId, sourceAccountId, color } = req.body;

    const existing = await prisma.budgetItem.findUnique({ where: { id: itemId } });
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const allocated = allocatedAmount !== undefined ? parseFloat(allocatedAmount) : existing.allocatedAmount;
    const remaining = Math.max(0, allocated - existing.usedAmount);

    // ── Adjust fund transfer if amount, source, or destination changed ────────────
    const newSourceId = sourceAccountId !== undefined ? sourceAccountId : existing.sourceAccountId;
    const newDestId = accountId !== undefined ? accountId : existing.accountId;

    const amountChanged = allocatedAmount !== undefined && parseFloat(allocatedAmount) !== existing.allocatedAmount;
    const sourceChanged = sourceAccountId !== undefined && sourceAccountId !== existing.sourceAccountId;
    const destChanged = accountId !== undefined && accountId !== existing.accountId;

    if (amountChanged || sourceChanged || destChanged) {
      // Check balance before making modifications
      if (existing.sourceAccountId === newSourceId) {
        // Source account is the same, only amount changed.
        const netDeduction = allocated - existing.allocatedAmount;
        if (netDeduction > 0) {
          const sourceAccount = await prisma.account.findUnique({ where: { id: existing.sourceAccountId } });
          if (!sourceAccount) {
            return res.status(404).json({ error: 'Source account not found' });
          }
          if (sourceAccount.currentBalance < netDeduction) {
            return res.status(400).json({
              error: `Saldo tidak mencukupi di akun ${sourceAccount.accountName} untuk penambahan alokasi ini. Kekurangan: Rp${(netDeduction - sourceAccount.currentBalance).toLocaleString('id-ID')}`
            });
          }
        }
      } else {
        // Source account changed. Old source gets refunded, new source gets full deduction.
        if (newSourceId) {
          const newSourceAccount = await prisma.account.findUnique({ where: { id: newSourceId } });
          if (!newSourceAccount) {
            return res.status(404).json({ error: 'New source account not found' });
          }
          if (newSourceAccount.currentBalance < allocated) {
            return res.status(400).json({
              error: `Saldo tidak mencukupi di akun baru ${newSourceAccount.accountName}. Saldo saat ini: Rp${newSourceAccount.currentBalance.toLocaleString('id-ID')}`
            });
          }
        }
      }

      // 1. Reverse old allocation
      if (existing.sourceAccountId) {
        await prisma.account.update({
          where: { id: existing.sourceAccountId },
          data: { currentBalance: { increment: existing.allocatedAmount } },
        });
      }
      if (existing.accountId && existing.accountId !== existing.sourceAccountId) {
        await prisma.account.update({
          where: { id: existing.accountId },
          data: { currentBalance: { decrement: existing.allocatedAmount } },
        });
      }

      // 2. Apply new allocation
      if (newSourceId) {
        await prisma.account.update({
          where: { id: newSourceId },
          data: { currentBalance: { decrement: allocated } },
        });
      }
      if (newDestId && newDestId !== newSourceId) {
        await prisma.account.update({
          where: { id: newDestId },
          data: { currentBalance: { increment: allocated } },
        });
      }
    }
    // ─────────────────────────────────────────────────────

    const item = await prisma.budgetItem.update({
      where: { id: itemId },
      data: {
        itemName,
        allocatedAmount: allocated,
        remainingAmount: remaining,
        sourceAccountId: sourceAccountId !== undefined ? sourceAccountId : existing.sourceAccountId,
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
// Reverses fund transfer: returns remainingAmount back to source
export const deleteBudgetItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const existing = await prisma.budgetItem.findUnique({ where: { id: itemId } });
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // ── Reverse fund transfer (only remaining, since usedAmount already spent) ──
    if (existing.sourceAccountId) {
      await prisma.account.update({
        where: { id: existing.sourceAccountId },
        data: { currentBalance: { increment: existing.remainingAmount } },
      });
    }

    if (existing.accountId && existing.accountId !== existing.sourceAccountId) {
      await prisma.account.update({
        where: { id: existing.accountId },
        data: { currentBalance: { decrement: existing.remainingAmount } },
      });
    }
    // ─────────────────────────────────────────────────────

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
