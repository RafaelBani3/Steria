import { create } from 'zustand';
import api from '../services/api';

const CACHE_TTL = 30 * 1000; // 30 seconds

export const useExpenseStore = create((set, get) => ({
  expenses: [],
  isLoading: false,
  lastFetched: null, // { period: string, at: timestamp }

  fetchExpenses: async (month, year, force = false) => {
    const { lastFetched, isLoading } = get();
    const period = month && year ? `${year}-${month}` : 'all';

    // Skip if already loading or period + data still fresh
    if (isLoading) return;
    if (
      !force &&
      lastFetched &&
      lastFetched.period === period &&
      (Date.now() - lastFetched.at) < CACHE_TTL
    ) return;

    set({ isLoading: true });
    try {
      const params = {};
      if (month && year) { params.month = month; params.year = year; }
      const res = await api.get('/expenses', { params });
      set({ expenses: res.data, lastFetched: { period, at: Date.now() } });
    } catch (err) {
      console.error('fetchExpenses error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  createExpense: async (data) => {
    try {
      const res = await api.post('/expenses', data);
      set((state) => ({
        expenses: [res.data, ...state.expenses],
        lastFetched: null, // invalidate
      }));
      return res.data;
    } catch (err) {
      console.error('createExpense error:', err);
      throw err;
    }
  },

  deleteExpense: async (expenseId) => {
    try {
      await api.delete(`/expenses/${expenseId}`);
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== expenseId),
        lastFetched: null, // invalidate
      }));
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
