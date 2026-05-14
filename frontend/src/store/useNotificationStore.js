import { create } from 'zustand';
import api from '../services/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/notifications');
      const notifications = res.data;
      const unreadCount = notifications.filter(n => !n.isRead).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch (err) {
      console.error('Fetch Notifications Error:', err);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set(state => {
        const updated = state.notifications.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        );
        return {
          notifications: updated,
          unreadCount: updated.filter(n => !n.isRead).length
        };
      });
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
    } catch (err) {
      console.error('Mark all as read error:', err);
    }
  },

  deleteNotification: async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      set(state => {
        const updated = state.notifications.filter(n => n.id !== id);
        return {
          notifications: updated,
          unreadCount: updated.filter(n => !n.isRead).length
        };
      });
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  }
}));
