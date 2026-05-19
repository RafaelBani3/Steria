import { create } from 'zustand';
import api from '../services/api';

export const useIncomeStore = create((set, get) => ({
  incomes: [],
  isLoading: false,

  fetchIncomes: async (month, year) => {
    set({ isLoading: true });
    try {
      const params = {};
      if (month && year) { params.month = month; params.year = year; }
      const res = await api.get('/income', { params });
      set({ incomes: res.data });
    } catch (err) {
      console.error('fetchIncomes error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  createIncome: async (data) => {
    try {
      const res = await api.post('/income', data);
      set((state) => ({ incomes: [res.data, ...state.incomes] }));
      return res.data;
    } catch (err) {
      console.error('createIncome error:', err);
      throw err;
    }
  },

  deleteIncome: async (incomeId) => {
    try {
      await api.delete(`/income/${incomeId}`);
      set((state) => ({ incomes: state.incomes.filter((i) => i.id !== incomeId) }));
    } catch (err) {
      console.error('deleteIncome error:', err);
      throw err;
    }
  },

  getTotalIncome: () => {
    return get().incomes.reduce((sum, i) => sum + i.amount, 0);
  },
}));
