import prisma from '../prisma/index.js';

export const createNotification = async ({ userId, type, title, message, metadata = {} }) => {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata
      }
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

export const checkBudgetThresholds = async (userId, budgetItemId) => {
  try {
    const budgetItem = await prisma.budgetItem.findUnique({
      where: { id: budgetItemId },
      include: { budget: true }
    });

    if (!budgetItem) return;

    // Calculate total spent for this budget item in the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalSpentRes = await prisma.expense.aggregate({
      where: {
        userId,
        budgetItemId,
        date: { gte: startOfMonth }
      },
      _sum: { amount: true }
    });

    const totalSpent = totalSpentRes._sum.amount || 0;
    const allocated = budgetItem.amount;

    if (allocated <= 0) return;

    const percentage = (totalSpent / allocated) * 100;

    // Define thresholds
    const thresholds = [
      { level: 90, icon: '⚠️', message: `Warning ⚠️ Budget ${budgetItem.subCategory || budgetItem.category} hampir habis (${percentage.toFixed(0)}%).` },
      { level: 80, icon: '👀', message: `Sisa budget ${budgetItem.subCategory || budgetItem.category} tinggal dikit, udah kepake ${percentage.toFixed(0)}%.` },
      { level: 50, icon: '👀', message: `Budget ${budgetItem.subCategory || budgetItem.category} lo udah kepake ${percentage.toFixed(0)}% nih 👀` }
    ];

    // Find the highest threshold met
    const thresholdMet = thresholds.find(t => percentage >= t.level);

    if (thresholdMet) {
      // Check if we already sent a notification for this threshold today/this month
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'BUDGET_ALERT',
          metadata: {
            path: ['budgetItemId'],
            equals: budgetItemId
          },
          createdAt: { gte: startOfMonth }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Simple logic: only notify if the level has increased or if it's a new day
      const lastLevel = existing?.metadata?.level || 0;
      if (thresholdMet.level > lastLevel) {
        await createNotification({
          userId,
          type: 'BUDGET_ALERT',
          title: `Budget Update: ${budgetItem.subCategory || budgetItem.category}`,
          message: thresholdMet.message,
          metadata: { budgetItemId, level: thresholdMet.level, percentage }
        });
      }
    }
  } catch (error) {
    console.error('Check Budget Thresholds Error:', error);
  }
};

export const checkSavingsMilestones = async (userId, savingId) => {
  try {
    const saving = await prisma.saving.findUnique({
      where: { id: savingId }
    });

    if (!saving || saving.targetAmount <= 0) return;

    const percentage = (saving.currentAmount / saving.targetAmount) * 100;

    const milestones = [
      { level: 95, message: `Dikit lagi! Savings goal ${saving.name} udah ${percentage.toFixed(0)}%.` },
      { level: 75, message: `Mantap! Tabungan ${saving.name} lo udah tembus ${percentage.toFixed(0)}%.` },
      { level: 50, message: `Nice 🔥 Target tabungan ${saving.name} lo udah ${percentage.toFixed(0)}% tercapai.` },
      { level: 25, message: `Awal yang bagus! Tabungan ${saving.name} udah jalan ${percentage.toFixed(0)}%.` }
    ];

    const milestoneMet = milestones.find(m => percentage >= m.level);

    if (milestoneMet) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'SAVINGS_MILESTONE',
          metadata: {
            path: ['savingId'],
            equals: savingId
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const lastLevel = existing?.metadata?.level || 0;
      if (milestoneMet.level > lastLevel) {
        await createNotification({
          userId,
          type: 'SAVINGS_MILESTONE',
          title: `Savings Goal: ${saving.name}`,
          message: milestoneMet.message,
          metadata: { savingId, level: milestoneMet.level, percentage }
        });
      }
    }
  } catch (error) {
    console.error('Check Savings Milestones Error:', error);
  }
};
