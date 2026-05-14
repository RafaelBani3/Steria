import prisma from '../prisma/index.js';

export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.user;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50
    });
    res.json(notifications);
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ error: 'Terjadi Error pada sistem (ERR-5001)' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const notification = await prisma.notification.update({
      where: { id, userId },
      data: { isRead: true }
    });

    res.json(notification);
  } catch (error) {
    console.error('Mark Notification Read Error:', error);
    res.status(500).json({ error: 'Terjadi Error pada sistem (ERR-5002)' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.user;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark All Read Error:', error);
    res.status(500).json({ error: 'Terjadi Error pada sistem (ERR-5003)' });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    await prisma.notification.delete({
      where: { id, userId }
    });

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete Notification Error:', error);
    res.status(500).json({ error: 'Terjadi Error pada sistem (ERR-5004)' });
  }
};
