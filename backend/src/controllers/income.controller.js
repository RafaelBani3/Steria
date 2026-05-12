import prisma from '../prisma/index.js';

export const getIncomes = async (req, res) => {
  try {
    const incomes = await prisma.income.findMany({
      where: { userId: req.user.userId },
      orderBy: { date: 'desc' }
    });
    res.json(incomes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createIncome = async (req, res) => {
  try {
    const { source, amount, category, date, notes } = req.body;
    const income = await prisma.income.create({
      data: {
        source,
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        notes,
        userId: req.user.userId
      }
    });
    res.status(201).json(income);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.income.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.income.delete({ where: { id } });
    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
