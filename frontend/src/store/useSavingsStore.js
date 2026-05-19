import { create } from 'zustand';
import api from '../services/api';

export const useSavingsStore = create((set, get) => ({
  goals: [],
  transactions: [],
  isLoading: false,

  fetchGoals: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/savings/goals');
      set({ goals: res.data });
    } catch (err) {
      console.error('fetchGoals error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  createGoal: async (data) => {
    try {
      const res = await api.post('/savings/goals', data);
      set((state) => ({ goals: [res.data, ...state.goals] }));
      return res.data;
    } catch (err) {
      console.error('createGoal error:', err);
      throw err;
    }
  },

  updateGoal: async (goalId, data) => {
    try {
      const res = await api.patch(`/savings/goals/${goalId}`, data);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === goalId ? res.data : g)),
      }));
      return res.data;
    } catch (err) {
      console.error('updateGoal error:', err);
      throw err;
    }
  },

  deleteGoal: async (goalId) => {
    try {
      await api.delete(`/savings/goals/${goalId}`);
      set((state) => ({ goals: state.goals.filter((g) => g.id !== goalId) }));
    } catch (err) {
      console.error('deleteGoal error:', err);
      throw err;
    }
  },

  fetchTransactions: async (goalId) => {
    try {
      const params = goalId ? { goalId } : {};
      const res = await api.get('/savings/transactions', { params });
      set({ transactions: res.data });
    } catch (err) {
      console.error('fetchTransactions error:', err);
    }
  },

  createTransaction: async (data) => {
    try {
      const res = await api.post('/savings/transactions', data);
      set((state) => ({ transactions: [res.data, ...state.transactions] }));
      // Update the goal's currentAmount in local state
      if (data.savingsGoalId) {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === data.savingsGoalId
              ? { ...g, currentAmount: g.currentAmount + parseFloat(data.amount) }
              : g
          ),
        }));
      }
      return res.data;
    } catch (err) {
      console.error('createTransaction error:', err);
      throw err;
    }
  },

  deleteTransaction: async (transactionId) => {
    try {
      await api.delete(`/savings/transactions/${transactionId}`);
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== transactionId),
      }));
    } catch (err) {
      console.error('deleteTransaction error:', err);
      throw err;
    }
  },

  getTotalSavings: () => {
    return get().goals.reduce((sum, g) => sum + g.currentAmount, 0);
  },
}));
