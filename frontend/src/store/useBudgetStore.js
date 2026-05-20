import { create } from 'zustand';
import api from '../services/api';

export const useBudgetStore = create((set, get) => ({
  categories: [],
  budgetItems: [],
  isLoading: false,
  selectedPeriod: (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })(),

  setSelectedPeriod: (period) => set({ selectedPeriod: period }),

  fetchCategories: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/budget-categories');
      set({ categories: res.data });
    } catch (err) {
      console.error('fetchCategories error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBudgetItems: async (period) => {
    set({ isLoading: true });
    try {
      const p = period || get().selectedPeriod;
      const res = await api.get('/budget-items', { params: { period: p } });
      set({ budgetItems: res.data });
    } catch (err) {
      console.error('fetchBudgetItems error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  createBudgetItem: async (data) => {
    try {
      const res = await api.post('/budget-items', {
        ...data,
        period: get().selectedPeriod,
      });
      set((state) => ({ budgetItems: [...state.budgetItems, res.data] }));
      return res.data;
    } catch (err) {
      console.error('createBudgetItem error:', err);
      throw err;
    }
  },

  updateBudgetItem: async (itemId, data) => {
    try {
      const res = await api.patch(`/budget-items/${itemId}`, data);
      set((state) => ({
        budgetItems: state.budgetItems.map((item) => (item.id === itemId ? res.data : item)),
      }));
      return res.data;
    } catch (err) {
      console.error('updateBudgetItem error:', err);
      throw err;
    }
  },

  deleteBudgetItem: async (itemId) => {
    try {
      await api.delete(`/budget-items/${itemId}`);
      set((state) => ({
        budgetItems: state.budgetItems.filter((item) => item.id !== itemId),
      }));
    } catch (err) {
      console.error('deleteBudgetItem error:', err);
      throw err;
    }
  },

  // Computed: group items by category
  getItemsByCategory: () => {
    const { categories, budgetItems } = get();
    return categories.map((cat) => ({
      ...cat,
      items: budgetItems.filter((item) => item.categoryId === cat.id),
    }));
  },

  // Computed: total allocated and used
  getTotals: () => {
    const { budgetItems } = get();
    return {
      totalAllocated: budgetItems.reduce((sum, i) => sum + i.allocatedAmount, 0),
      totalUsed: budgetItems.reduce((sum, i) => sum + i.usedAmount, 0),
      totalRemaining: budgetItems.reduce((sum, i) => sum + i.remainingAmount, 0),
    };
  },
}));
