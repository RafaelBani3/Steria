import prisma from '../prisma/index.js';

export const getSavings = async (req, res) => {
  try {
    const savings = await prisma.saving.findMany({
      where: { userId: req.user.userId }
    });
    res.json(savings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createSaving = async (req, res) => {
  try {
    const { name, targetAmount, currentAmount } = req.body;
    const saving = await prisma.saving.create({
      data: {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || 0),
        userId: req.user.userId
      }
    });
    res.status(201).json(saving);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSaving = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentAmount, name, targetAmount } = req.body;
    
    const existing = await prisma.saving.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const data = {};
    if (currentAmount !== undefined) data.currentAmount = parseFloat(currentAmount);
    if (name !== undefined) data.name = name;
    if (targetAmount !== undefined) data.targetAmount = parseFloat(targetAmount);

    const saving = await prisma.saving.update({
      where: { id },
      data
    });
    res.json(saving);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteSaving = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.saving.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.saving.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
