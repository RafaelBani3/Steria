import prisma from '../prisma/index.js';

// ─── GET NOTIFICATIONS ─────────────────────────────────
export const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── MARK AS READ ──────────────────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await prisma.notification.update({
      where: { id: notificationId, userId: req.user.userId },
      data: { isRead: true },
    });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── MARK ALL AS READ ──────────────────────────────────
export const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── DELETE NOTIFICATION ───────────────────────────────
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await prisma.notification.delete({
      where: { id: notificationId, userId: req.user.userId },
    });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── INTERNAL: Create Budget Alert ────────────────────
export const createBudgetNotification = async (userId, itemName, usagePercent) => {
  const isOverBudget = usagePercent >= 100;
  const emoji = isOverBudget ? '🚨' : '👀';
  const type = 'BUDGET_ALERT';
  
  // Avoid duplicate notifications
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type,
      title: { contains: itemName },
      isRead: false,
    },
  });
  if (existing) return;

  await prisma.notification.create({
    data: {
      userId,
      type,
      title: isOverBudget ? `Budget ${itemName} over limit!` : `Budget ${itemName} 80% used`,
      message: isOverBudget
        ? `Budget ${itemName} lo udah melewati batas! ${emoji}`
        : `Budget ${itemName} lo udah kepake ${Math.round(usagePercent)}% ${emoji}`,
    },
  });
};

// ─── INTERNAL: Create Savings Milestone ───────────────
export const createSavingsMilestoneNotification = async (userId, goalName, percent) => {
  const emoji = percent >= 100 ? '🎉' : '🔥';
  
  await prisma.notification.create({
    data: {
      userId,
      type: 'SAVINGS_MILESTONE',
      title: `Savings goal ${percent}% reached!`,
      message: `Savings goal "${goalName}" lo udah ${percent}% tercapai ${emoji}`,
    },
  });
};
