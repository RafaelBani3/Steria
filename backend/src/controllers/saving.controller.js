import prisma from '../prisma/index.js';
import { checkSavingsMilestones } from '../utils/notification.utils.js';

export const getSavings = async (req, res) => {
  try {
    const savings = await prisma.saving.findMany({
      where: { userId: req.user.userId }
    });
    res.json(savings);
  } catch (error) {
    console.error('Get Savings Error:', error);
    res.status(500).json({ error: 'Terjadi Error pada sistem (ERR-2001)' });
  }
};

export const createSaving = async (req, res) => {
  try {
    const { name, targetAmount, currentAmount } = req.body;
    const userId = req.user.userId;

    const saving = await prisma.saving.create({
      data: {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || 0),
        userId
      }
    });

    // Initial check for milestones if currentAmount > 0
    if (saving.currentAmount > 0) {
      checkSavingsMilestones(userId, saving.id);
    }

    res.status(201).json(saving);
  } catch (error) {
    console.error('Create Saving Error:', error);
    res.status(500).json({ error: 'Terjadi Error pada sistem (ERR-2002)' });
  }
};

export const updateSaving = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentAmount, name, targetAmount } = req.body;
    const userId = req.user.userId;
    
    const existing = await prisma.saving.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
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

    // Check milestones if amount was updated
    if (currentAmount !== undefined) {
      checkSavingsMilestones(userId, saving.id);
    }

    res.json(saving);
  } catch (error) {
    console.error('Update Saving Error:', error);
    res.status(500).json({ error: 'Terjadi Error pada sistem (ERR-2003)' });
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
    res.json({ message: 'Savings goal successfully deleted.' });
  } catch (error) {
    console.error('Delete Saving Error:', error);
    res.status(500).json({ error: 'Terjadi Error pada sistem (ERR-2004)' });
  }
};
