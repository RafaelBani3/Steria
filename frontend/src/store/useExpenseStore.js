import { create } from 'zustand';
import api from '../services/api';

export const useExpenseStore = create((set, get) => ({
  expenses: [],
  isLoading: false,

  fetchExpenses: async (month, year) => {
    set({ isLoading: true });
    try {
      const params = {};
      if (month && year) { params.month = month; params.year = year; }
      const res = await api.get('/expenses', { params });
      set({ expenses: res.data });
    } catch (err) {
      console.error('fetchExpenses error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  createExpense: async (data) => {
    try {
      const res = await api.post('/expenses', data);
      set((state) => ({ expenses: [res.data, ...state.expenses] }));
      return res.data;
    } catch (err) {
      console.error('createExpense error:', err);
      throw err;
    }
  },

  deleteExpense: async (expenseId) => {
    try {
      await api.delete(`/expenses/${expenseId}`);
      set((state) => ({ expenses: state.expenses.filter((e) => e.id !== expenseId) }));
    } catch (err) {
      console.error('deleteExpense error:', err);
      throw err;
    }
  },

  getTotalExpenses: () => {
    return get().expenses.reduce((sum, e) => sum + e.amount, 0);
  },

  getExpensesByAccount: () => {
    const byAccount = {};
    get().expenses.forEach((exp) => {
      const key = exp.accountId;
      if (!byAccount[key]) byAccount[key] = { account: exp.account, total: 0, count: 0 };
      byAccount[key].total += exp.amount;
      byAccount[key].count += 1;
    });
    return Object.values(byAccount).sort((a, b) => b.total - a.total);
  },
}));
