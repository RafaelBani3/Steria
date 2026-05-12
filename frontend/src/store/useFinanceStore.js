import { create } from 'zustand';
import api from '../services/api';

export const useFinanceStore = create((set, get) => ({
  incomes: [],
  expenses: [],
  savings: [],
  budgets: [],
  isLoading: false,
  selectedMonth: new Date().getMonth(), // 0 - 11
  selectedYear: new Date().getFullYear(),
  setSelectedPeriod: (month, year) => set({ selectedMonth: Number(month), selectedYear: Number(year) }),

  fetchBudgets: async () => {
    try {
      const res = await api.get('/budgets');
      if (res.data.length === 0) {
        const createRes = await api.post('/budgets', { name: 'My Custom Budget', method: 'Custom' });
        set({ budgets: [createRes.data] });
      } else {
        set({ budgets: res.data });
      }
    } catch (err) {
      console.error(err);
    }
  },

  createBudget: async (name, method) => {
    try {
      const res = await api.post('/budgets', { name, method });
      set((state) => ({ budgets: [res.data, ...state.budgets] }));
      return res.data;
    } catch (err) {
      console.error(err);
    }
  },

  updateBudget: async (id, name, method) => {
    try {
      const res = await api.patch(`/budgets/${id}`, { name, method });
      set((state) => ({
        budgets: state.budgets.map(b => b.id === id ? res.data : b)
      }));
    } catch (err) {
      console.error(err);
    }
  },

  addBudgetItem: async (budgetId, item) => {
    try {
      const res = await api.post(`/budgets/${budgetId}/items`, item);
      set((state) => ({
        budgets: state.budgets.map(b => b.id === budgetId ? { ...b, budgetItems: [...(b.budgetItems || []), res.data] } : b)
      }));
    } catch (err) {
      console.error(err);
    }
  },
  
  deleteBudgetItem: async (budgetId, itemId) => {
    try {
      // Ensure we have the latest data before filtering for reversals
      await get().fetchExpenses();
      await get().fetchSavings();
      
      const state = get();
      const budget = state.budgets.find(b => b.id === budgetId);
      const itemToDelete = budget?.budgetItems?.find(i => i.id === itemId);

      if (itemToDelete && itemToDelete.category === 'Savings') {
        // Find expenses (deposits) from this subCategory in the current month
        const currentMonthExpenses = state.expenses.filter(exp => {
          const d = new Date(exp.date);
          return d.getMonth() === state.selectedMonth && 
                 d.getFullYear() === state.selectedYear &&
                 exp.category === 'Savings' &&
                 exp.subCategory?.trim().toLowerCase() === itemToDelete.subCategory?.trim().toLowerCase();
        });

        // For each deposit found, we need to reverse it from the savings goal
        for (const exp of currentMonthExpenses) {
          // Identify the goal by ID in notes, fallback to name in description (Case-Insensitive)
          let goal;
          if (exp.notes?.includes('goal_id:')) {
            const goalId = exp.notes.split('goal_id:')[1];
            goal = state.savings.find(s => s.id === goalId);
          } else {
            const cleanDesc = exp.description.toLowerCase().replace('deposit to ', '').trim();
            goal = state.savings.find(s => s.name.toLowerCase().trim() === cleanDesc);
          }
          
          if (goal) {
            const newAmount = Math.max(0, goal.currentAmount - exp.amount);
            await get().updateSaving(goal.id, { currentAmount: newAmount });
          }
          
          // Delete the expense record
          await api.delete(`/expenses/${exp.id}`);
        }
        
        // Refresh local expenses state after deletion
        await get().fetchExpenses();
      }

      await api.delete(`/budgets/items/${itemId}`);
      
      // Final sync to ensure UI is perfectly up to date
      await get().fetchSavings();
      await get().fetchExpenses();

      set((state) => ({
        budgets: state.budgets.map(b => b.id === budgetId ? { ...b, budgetItems: b.budgetItems.filter(i => i.id !== itemId) } : b)
      }));
    } catch (err) {
      console.error(err);
    }
  },

  updateBudgetItem: async (budgetId, itemId, updates) => {
    try {
      const res = await api.patch(`/budgets/items/${itemId}`, updates);
      set((state) => ({
        budgets: state.budgets.map(b => b.id === budgetId ? {
          ...b,
          budgetItems: b.budgetItems.map(i => i.id === itemId ? res.data : i)
        } : b)
      }));
    } catch (err) {
      console.error(err);
    }
  },

  fetchIncomes: async () => {
    try {
      const res = await api.get('/income');
      set({ incomes: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  addIncome: async (income) => {
    try {
      const res = await api.post('/income', income);
      set((state) => ({ incomes: [res.data, ...state.incomes] }));
    } catch (err) {
      console.error(err);
    }
  },

  deleteIncome: async (id) => {
    try {
      await api.delete(`/income/${id}`);
      set((state) => ({ incomes: state.incomes.filter(i => i.id !== id) }));
    } catch (err) {
      console.error(err);
    }
  },

  fetchExpenses: async () => {
    try {
      const res = await api.get('/expenses');
      set({ expenses: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  addExpense: async (expense) => {
    try {
      const res = await api.post('/expenses', expense);
      set((state) => ({ expenses: [res.data, ...state.expenses] }));
    } catch (err) {
      console.error(err);
    }
  },

  deleteExpense: async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      set((state) => ({ expenses: state.expenses.filter(e => e.id !== id) }));
    } catch (err) {
      console.error(err);
    }
  },

  fetchSavings: async () => {
    try {
      const res = await api.get('/savings');
      set({ savings: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  addSaving: async (saving) => {
    try {
      const res = await api.post('/savings', saving);
      set((state) => ({ savings: [...state.savings, res.data] }));
    } catch (err) {
      console.error(err);
    }
  },

  updateSaving: async (id, updates) => {
    try {
      const res = await api.patch(`/savings/${id}`, updates);
      set((state) => ({
        savings: state.savings.map(s => s.id === id ? res.data : s)
      }));
    } catch (err) {
      console.error(err);
    }
  },

  deleteSaving: async (id) => {
    try {
      const state = get();
      const goalToDelete = state.savings.find(s => s.id === id);
      
      if (goalToDelete) {
        // Find and delete current month's deposits to this goal
        const currentMonthExpenses = state.expenses.filter(exp => {
          const d = new Date(exp.date);
          const isSameMonth = d.getMonth() === state.selectedMonth && d.getFullYear() === state.selectedYear;
          const isTargetGoal = exp.notes?.includes(`goal_id:${goalToDelete.id}`) || 
                               exp.description === `Deposit to ${goalToDelete.name}`;
          
          return isSameMonth && exp.category === 'Savings' && isTargetGoal;
        });

        for (const exp of currentMonthExpenses) {
          try {
            await api.delete(`/expenses/${exp.id}`);
          } catch (e) {
            console.error('Failed to reverse expense:', e);
          }
        }
        
        // Refresh expenses to update Budget Spent indicators
        await get().fetchExpenses();
      }

      // Perform the actual goal deletion
      await api.delete(`/savings/${id}`);
      
      // Update local state to remove the card immediately
      set((state) => ({
        savings: state.savings.filter(s => s.id !== id)
      }));
    } catch (err) {
      console.error('Goal deletion failed:', err);
    }
  }
}));
