import { create } from 'zustand';
import api from '../services/api';

const CACHE_TTL = 30 * 1000; // 30 seconds

export const useAccountStore = create((set, get) => ({
  accounts: [],
  cashflowAccounts: [],
  savingsAccounts: [],
  totalCashflow: 0,
  totalSavings: 0,
  totalBalance: 0,
  isLoading: false,
  lastFetched: null, // cache timestamp

  fetchAccounts: async (force = false) => {
    const { lastFetched, isLoading } = get();
    // Skip if already loading or data is fresh (within TTL)
    if (isLoading) return;
    if (!force && lastFetched && (Date.now() - lastFetched) < CACHE_TTL) return;

    set({ isLoading: true });
    try {
      const res = await api.get('/accounts/summary');
      set({
        accounts: res.data.accounts,
        cashflowAccounts: res.data.cashflowAccounts,
        savingsAccounts: res.data.savingsAccounts,
        totalCashflow: res.data.totalCashflow,
        totalSavings: res.data.totalSavings,
        totalBalance: res.data.totalBalance,
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.error('fetchAccounts error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  invalidateCache: () => set({ lastFetched: null }),

  selectedAccountHistory: [],
  isLoadingHistory: false,
  historyCache: {}, // { [accountId]: { data, fetchedAt } }

  fetchAccountHistory: async (accountId, force = false) => {
    const { historyCache, isLoadingHistory } = get();
    if (isLoadingHistory) return;

    // Use cached history if fresh
    const cached = historyCache[accountId];
    if (!force && cached && (Date.now() - cached.fetchedAt) < CACHE_TTL) {
      set({ selectedAccountHistory: cached.data });
      return;
    }

    set({ isLoadingHistory: true, selectedAccountHistory: [] });
    try {
      const res = await api.get(`/accounts/${accountId}/history`);
      const data = res.data;
      set((state) => ({
        selectedAccountHistory: data,
        historyCache: {
          ...state.historyCache,
          [accountId]: { data, fetchedAt: Date.now() },
        },
      }));
    } catch (err) {
      console.error('fetchAccountHistory error:', err);
    } finally {
      set({ isLoadingHistory: false });
    }
  },

  createAccount: async (data) => {
    try {
      const res = await api.post('/accounts', data);
      await get().fetchAccounts(true); // force refresh
      return res.data;
    } catch (err) {
      console.error('createAccount error:', err);
      throw err;
    }
  },

  updateAccount: async (accountId, data) => {
    try {
      const res = await api.patch(`/accounts/${accountId}`, data);
      await get().fetchAccounts(true); // force refresh
      return res.data;
    } catch (err) {
      console.error('updateAccount error:', err);
      throw err;
    }
  },

  deleteAccount: async (accountId) => {
    try {
      await api.delete(`/accounts/${accountId}`);
      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== accountId),
        cashflowAccounts: state.cashflowAccounts.filter((a) => a.id !== accountId),
        savingsAccounts: state.savingsAccounts.filter((a) => a.id !== accountId),
        lastFetched: null, // invalidate
      }));
    } catch (err) {
      console.error('deleteAccount error:', err);
      throw err;
    }
  },

  isLoadingAction: false,
  createTransfer: async (data) => {
    set({ isLoadingAction: true });
    try {
      const res = await api.post('/transfers', data);
      await get().fetchAccounts(true); // force refresh after transfer
      return res.data;
    } catch (err) {
      console.error('createTransfer error:', err);
      throw err;
    } finally {
      set({ isLoadingAction: false });
    }
  },
}));
