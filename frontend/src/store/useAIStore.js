import { create } from 'zustand';
import api from '../services/api';
import { useFinanceStore } from './useFinanceStore';

export const useAIStore = create((set, get) => ({
  isOpen: false,
  isListening: false,
  isProcessing: false,
  transcript: '',
  aiResponse: null,
  error: null,
  inputMode: 'voice', // 'voice' | 'text'

  openModal: () => set({ 
    isOpen: true, 
    error: null, 
    aiResponse: null, 
    transcript: '',
    isListening: false 
  }),

  closeModal: () => set({ 
    isOpen: false, 
    isListening: false, 
    isProcessing: false 
  }),

  setListening: (status) => set({ isListening: status }),
  
  setTranscript: (text) => set({ transcript: text }),
  
  setInputMode: (mode) => set({ inputMode: mode }),
  
  setError: (errorMessage) => set({ error: errorMessage, isProcessing: false, isListening: false }),
  
  clearResponse: () => set({ aiResponse: null }),

  processMessage: async (messageText) => {
    if (!messageText || !messageText.trim()) return;

    set({ 
      isProcessing: true, 
      isListening: false, 
      error: null, 
      aiResponse: null 
    });

    try {
      const response = await api.post('/ai/process-finance', { 
        message: messageText.trim() 
      });

      if (response.data?.success) {
        set({ 
          aiResponse: response.data, 
          isProcessing: false,
          transcript: '' 
        });

        // Automatically sync global financial ecosystem states
        const financeStore = useFinanceStore.getState();
        if (financeStore) {
          await financeStore.fetchExpenses();
          await financeStore.fetchBudgets();
          await financeStore.fetchSavings();
        }
      } else {
        throw new Error(response.data?.error || 'Failed to process message');
      }
    } catch (err) {
      console.error('AI Processing API Error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Network error processing AI request';
      set({ 
        error: errorMsg, 
        isProcessing: false 
      });
    }
  }
}));
