import prisma from '../prisma/index.js';

export const getBudgets = async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany({
      where: { userId: req.user.userId },
      include: {
        budgetItems: true
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBudget = async (req, res) => {
  try {
    const { name, method } = req.body;
    const budget = await prisma.budget.create({
      data: {
        name,
        method,
        userId: req.user.userId
      },
      include: {
        budgetItems: true
      }
    });
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { budgetId } = req.params;
    const { name, method } = req.body;
    
    const budget = await prisma.budget.update({
      where: { id: budgetId, userId: req.user.userId },
      data: { name, method },
      include: { budgetItems: true }
    });
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBudgetItem = async (req, res) => {
  try {
    const { budgetId } = req.params;
    const { category, subCategory, amount, percentage } = req.body;
    
    // Check if budget belongs to user
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId }
    });
    if (!budget || budget.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const item = await prisma.budgetItem.create({
      data: {
        budgetId,
        category,
        subCategory,
        amount: parseFloat(amount),
        percentage: percentage ? parseFloat(percentage) : null
      }
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBudgetItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { amount, category, subCategory } = req.body;
    
    const existing = await prisma.budgetItem.findUnique({
      where: { id: itemId },
      include: { budget: true }
    });

    if (!existing || existing.budget.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await prisma.budgetItem.update({
      where: { id: itemId },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        category,
        subCategory
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBudgetItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const existing = await prisma.budgetItem.findUnique({
      where: { id: itemId },
      include: { budget: true }
    });

    if (!existing || existing.budget.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.budgetItem.delete({ where: { id: itemId } });
    res.json({ message: 'Budget item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
