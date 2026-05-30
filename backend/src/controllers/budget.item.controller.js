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
// If sourceAccountId and accountId are provided, it performs a real transfer.
export const createBudgetItem = async (req, res) => {
  try {
    const { categoryId, sourceAccountId, accountId, itemName, allocatedAmount, color, period } = req.body;

    const allocated = parseFloat(allocatedAmount);

    let createdItem;

    if (sourceAccountId && accountId) {
      // Real money movement
      const sourceAccount = await prisma.account.findUnique({ where: { id: sourceAccountId } });
      if (!sourceAccount || sourceAccount.currentBalance < allocated) {
        return res.status(400).json({ error: 'Saldo sumber tidak mencukupi untuk alokasi ini.' });
      }

      // Perform transaction
      const transactionResults = await prisma.$transaction([
        prisma.account.update({
          where: { id: sourceAccountId },
          data: { currentBalance: { decrement: allocated } },
        }),
        prisma.account.update({
          where: { id: accountId },
          data: { currentBalance: { increment: allocated } },
        }),
        prisma.transfer.create({
          data: {
            userId: req.user.userId,
            fromAccountId: sourceAccountId,
            toAccountId: accountId,
            amount: allocated,
            transferType: 'ADD_FUNDS',
            notes: `Alokasi Budget: ${itemName}`,
          }
        }),
        prisma.budgetItem.create({
          data: {
            userId: req.user.userId,
            categoryId,
            sourceAccountId,
            accountId,
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
        })
      ]);
      createdItem = transactionResults[3];
    } else {
      // Pure planning (no money movement)
      createdItem = await prisma.budgetItem.create({
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
    }

    res.status(201).json(createdItem);
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
    
    // Check if we need to do a delta transfer
    const isMoneyLinked = existing.sourceAccountId && existing.accountId;
    let transactions = [];
    
    if (isMoneyLinked && allocated !== existing.allocatedAmount) {
      const delta = allocated - existing.allocatedAmount;
      
      if (delta > 0) {
        // Need to add more money from source to target
        const sourceAccount = await prisma.account.findUnique({ where: { id: existing.sourceAccountId } });
        if (!sourceAccount || sourceAccount.currentBalance < delta) {
           return res.status(400).json({ error: 'Saldo sumber tidak mencukupi untuk tambahan alokasi ini.' });
        }
        transactions.push(
          prisma.account.update({ where: { id: existing.sourceAccountId }, data: { currentBalance: { decrement: delta } } }),
          prisma.account.update({ where: { id: existing.accountId }, data: { currentBalance: { increment: delta } } }),
          prisma.transfer.create({
            data: {
              userId: req.user.userId,
              fromAccountId: existing.sourceAccountId,
              toAccountId: existing.accountId,
              amount: delta,
              transferType: 'ADD_FUNDS',
              notes: `Penambahan Budget: ${itemName || existing.itemName}`,
            }
          })
        );
      } else if (delta < 0) {
        // Budget decreased, return money from target back to source
        const absDelta = Math.abs(delta);
        transactions.push(
          prisma.account.update({ where: { id: existing.accountId }, data: { currentBalance: { decrement: absDelta } } }),
          prisma.account.update({ where: { id: existing.sourceAccountId }, data: { currentBalance: { increment: absDelta } } }),
          prisma.transfer.create({
            data: {
              userId: req.user.userId,
              fromAccountId: existing.accountId,
              toAccountId: existing.sourceAccountId,
              amount: absDelta,
              transferType: 'WITHDRAW',
              notes: `Pengurangan Budget: ${itemName || existing.itemName}`,
            }
          })
        );
      }
    }

    // Add the update operation to transactions
    transactions.push(
      prisma.budgetItem.update({
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
      })
    );

    const results = await prisma.$transaction(transactions);
    const updatedItem = results[results.length - 1]; // The update result is the last one

    res.json(updatedItem);
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
