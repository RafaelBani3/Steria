import prisma from '../prisma/index.js';
import { checkBudgetThresholds } from '../utils/notification.utils.js';

export const getExpenses = async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: req.user.userId },
      orderBy: { date: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    console.error('Get Expenses Error:', error);
    res.status(500).json({ error: 'Terjadi Error pada sistem (ERR-1001)' });
  }
};

export const createExpense = async (req, res) => {
  try {
    const { amount, category, subCategory, date, description, budgetItemId } = req.body;
    const userId = req.user.userId;

    let finalBudgetItemId = budgetItemId;

    // If no budgetItemId provided, try to find a matching one from user's budget
    if (!finalBudgetItemId) {
      const activeBudget = await prisma.budget.findFirst({
        where: { userId },
        include: { budgetItems: true },
        orderBy: { updatedAt: 'desc' }
      });

      if (activeBudget) {
        const matched = activeBudget.budgetItems.find(item => 
          item.category.toLowerCase() === category.toLowerCase() &&
          (subCategory ? item.subCategory?.toLowerCase() === subCategory.toLowerCase() : true)
        );
        if (matched) finalBudgetItemId = matched.id;
      }
    }

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        category,
        subCategory,
        date: new Date(date),
        description,
        userId,
        budgetItemId: finalBudgetItemId
      }
    });

    // Trigger intelligent budget alert check
    if (finalBudgetItemId) {
      checkBudgetThresholds(userId, finalBudgetItemId);
    }

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create Expense Error:', error);
    res.status(500).json({ error: 'Terjadi Error pada sistem (ERR-1002)' });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.expense.delete({ where: { id } });
    res.json({ message: 'Expense successfully deleted.' });
  } catch (error) {
    console.error('Delete Expense Error:', error);
    res.status(500).json({ error: 'Terjadi Error pada sistem (ERR-1003)' });
  }
};
