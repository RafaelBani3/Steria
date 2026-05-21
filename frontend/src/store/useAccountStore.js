import { create } from 'zustand';
import api from '../services/api';

export const useAccountStore = create((set, get) => ({
  accounts: [],
  cashflowAccounts: [],
  savingsAccounts: [],
  totalCashflow: 0,
  totalSavings: 0,
  totalBalance: 0,
  isLoading: false,

  fetchAccounts: async () => {
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
      });
    } catch (err) {
      console.error('fetchAccounts error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  selectedAccountHistory: [],
  isLoadingHistory: false,

  fetchAccountHistory: async (accountId) => {
    set({ isLoadingHistory: true, selectedAccountHistory: [] });
    try {
      const res = await api.get(`/accounts/${accountId}/history`);
      set({ selectedAccountHistory: res.data });
    } catch (err) {
      console.error('fetchAccountHistory error:', err);
    } finally {
      set({ isLoadingHistory: false });
    }
  },

  createAccount: async (data) => {
    try {
      const res = await api.post('/accounts', data);
      await get().fetchAccounts(); // re-fetch for fresh summary
      return res.data;
    } catch (err) {
      console.error('createAccount error:', err);
      throw err;
    }
  },

  updateAccount: async (accountId, data) => {
    try {
      const res = await api.patch(`/accounts/${accountId}`, data);
      await get().fetchAccounts();
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
      await get().fetchAccounts();
      return res.data;
    } catch (err) {
      console.error('createTransfer error:', err);
      throw err;
    } finally {
      set({ isLoadingAction: false });
    }
  },
}));
