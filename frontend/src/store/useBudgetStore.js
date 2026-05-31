import { create } from 'zustand';
import api from '../services/api';

import { useAuthStore } from './useAuthStore';

const CACHE_TTL = 30 * 1000; // 30 seconds

const calculatePeriodBasedOnSalaryDate = () => {
  const user = useAuthStore.getState().user;
  const salaryDate = user?.salaryDate || 1;
  const now = new Date();
  
  // If today is >= salaryDate, we are budgeting for the NEXT month.
  // Unless salaryDate is 1, then it's just the current month.
  if (salaryDate > 1 && now.getDate() >= salaryDate) {
    now.setMonth(now.getMonth() + 1);
  }
  
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const useBudgetStore = create((set, get) => ({
  categories: [],
  budgetItems: [],
  isLoading: false,
  selectedPeriod: calculatePeriodBasedOnSalaryDate(),
  lastFetchedItems: null,     // { period: string, at: timestamp }
  lastFetchedCategories: null, // timestamp

  setSelectedPeriod: (period) => set({ selectedPeriod: period }),
  
  // Call this after login or when salaryDate changes
  refreshPeriodBasedOnSalaryDate: () => {
    set({ selectedPeriod: calculatePeriodBasedOnSalaryDate() });
  },

  fetchCategories: async (force = false) => {
    const { lastFetchedCategories, isLoading } = get();
    if (!force && lastFetchedCategories && (Date.now() - lastFetchedCategories) < CACHE_TTL) return;

    set({ isLoading: true });
    try {
      const res = await api.get('/budget-categories');
      set({ categories: res.data, lastFetchedCategories: Date.now() });
    } catch (err) {
      console.error('fetchCategories error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBudgetItems: async (period, force = false) => {
    const { lastFetchedItems, isLoading } = get();
    const p = period || get().selectedPeriod;

    // Skip if already loading or data is still fresh for same period
    if (isLoading) return;
    if (
      !force &&
      lastFetchedItems &&
      lastFetchedItems.period === p &&
      (Date.now() - lastFetchedItems.at) < CACHE_TTL
    ) return;

    set({ isLoading: true });
    try {
      const res = await api.get('/budget-items', { params: { period: p } });
      set({ budgetItems: res.data, lastFetchedItems: { period: p, at: Date.now() } });
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
      set((state) => ({
        budgetItems: [...state.budgetItems, res.data],
        lastFetchedItems: null, // invalidate
      }));
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
        lastFetchedItems: null, // invalidate so next fetch is fresh
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
        lastFetchedItems: null, // invalidate
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
