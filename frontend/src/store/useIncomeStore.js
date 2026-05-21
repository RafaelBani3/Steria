import { create } from 'zustand';
import api from '../services/api';

const CACHE_TTL = 30 * 1000; // 30 seconds

export const useIncomeStore = create((set, get) => ({
  incomes: [],
  isLoading: false,
  lastFetched: null,   // { period: string, at: timestamp }

  fetchIncomes: async (month, year, force = false) => {
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
      const res = await api.get('/income', { params });
      set({ incomes: res.data, lastFetched: { period, at: Date.now() } });
    } catch (err) {
      console.error('fetchIncomes error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  createIncome: async (data) => {
    try {
      const res = await api.post('/income', data);
      set((state) => ({
        incomes: [res.data, ...state.incomes],
        lastFetched: null, // invalidate so next fetch is fresh
      }));
      return res.data;
    } catch (err) {
      console.error('createIncome error:', err);
      throw err;
    }
  },

  deleteIncome: async (incomeId) => {
    try {
      await api.delete(`/income/${incomeId}`);
      set((state) => ({
        incomes: state.incomes.filter((i) => i.id !== incomeId),
        lastFetched: null, // invalidate
      }));
    } catch (err) {
      console.error('deleteIncome error:', err);
      throw err;
    }
  },

  getTotalIncome: () => {
    return get().incomes.reduce((sum, i) => sum + i.amount, 0);
  },
}));
