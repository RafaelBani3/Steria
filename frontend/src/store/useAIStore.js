import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sendChatMessage, generateInsights } from '../services/aiService';

const WELCOME_MESSAGE = {
  id: 'welcome',
  sender: 'ai',
  text: 'Halo! Saya Steria Copilot — asisten finansial AI pribadi kamu 🤖✨\n\nSaya bisa bantu analisa pengeluaran, kasih rekomendasi budget, atau catat transaksi kamu. Ada yang bisa saya bantu hari ini?',
  timestamp: new Date().toISOString(),
};

export const useAIStore = create(
  persist(
    (set, get) => ({
      // ── Chat Page State ──────────────────────────────────────
      chatHistory: [WELCOME_MESSAGE],
      isChatLoading: false,

      // ── Floating Modal State ─────────────────────────────────
      isOpen: false,
      isListening: false,
      isProcessing: false,
      transcript: '',
      aiResponse: null,
      error: null,
      inputMode: 'voice', // 'voice' | 'text'

      // ── Insights State ───────────────────────────────────────
      aiInsights: [],
      insightSummary: '',
      healthScore: 0,
      healthLabel: 'Fair',
      isInsightsLoading: false,
      insightsError: null,

      // ── Chat Actions ─────────────────────────────────────────
      sendMessage: async (messageText) => {
        if (!messageText?.trim() || get().isChatLoading) return;

        const userMsg = {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: messageText.trim(),
          timestamp: new Date().toISOString(),
        };

        set(state => ({
          chatHistory: [...state.chatHistory, userMsg],
          isChatLoading: true,
        }));

        const result = await sendChatMessage(messageText);

        const aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: result.message || 'Maaf, ada gangguan kecil. Coba lagi ya 🙏',
          insights: result.insights || [],
          tasks: result.tasks || [],
          isError: !result.success,
          timestamp: new Date().toISOString(),
        };

        set(state => ({
          chatHistory: [...state.chatHistory, aiMsg],
          isChatLoading: false,
        }));

        return result;
      },

      clearHistory: () =>
        set({ chatHistory: [{ ...WELCOME_MESSAGE, timestamp: new Date().toISOString() }] }),

      addMessage: (msg) =>
        set(state => ({ chatHistory: [...state.chatHistory, msg] })),

      // ── Floating Modal Actions ────────────────────────────────
      openModal: () =>
        set({ isOpen: true, error: null, aiResponse: null, transcript: '', isListening: false }),

      closeModal: () =>
        set({ isOpen: false, isListening: false, isProcessing: false }),

      setListening: (status) => set({ isListening: status }),
      setTranscript: (text) => set({ transcript: text }),
      setInputMode: (mode) => set({ inputMode: mode }),
      setError: (errorMessage) => set({ error: errorMessage, isProcessing: false, isListening: false }),
      clearResponse: () => set({ aiResponse: null }),

      processMessage: async (messageText) => {
        if (!messageText?.trim()) return;

        set({ isProcessing: true, isListening: false, error: null, aiResponse: null });

        const result = await sendChatMessage(messageText);

        if (result.success) {
          set({ aiResponse: result, isProcessing: false, transcript: '' });

          // Also append to chat history so AIChat page stays in sync
          const aiMsg = {
            id: `ai-modal-${Date.now()}`,
            sender: 'ai',
            text: result.message,
            insights: result.insights || [],
            tasks: result.tasks || [],
            timestamp: new Date().toISOString(),
          };
          const userMsg = {
            id: `user-modal-${Date.now() - 1}`,
            sender: 'user',
            text: messageText.trim(),
            timestamp: new Date().toISOString(),
          };
          set(state => ({ chatHistory: [...state.chatHistory, userMsg, aiMsg] }));
        } else {
          set({ error: result.message, isProcessing: false });
        }

        return result;
      },

      // ── Insights Actions ──────────────────────────────────────
      fetchInsights: async () => {
        if (get().isInsightsLoading) return;
        set({ isInsightsLoading: true, insightsError: null });

        const result = await generateInsights();

        if (result.success) {
          set({
            aiInsights: result.insights || [],
            insightSummary: result.summary || '',
            healthScore: result.health_score || 0,
            healthLabel: result.health_label || 'Fair',
            isInsightsLoading: false,
          });
        } else {
          set({ isInsightsLoading: false, insightsError: 'Gagal memuat insights AI.' });
        }
      },
    }),
    {
      name: 'steria-ai-store',
      // Only persist chat history — don't persist loading states or modal state
      partialize: (state) => ({
        chatHistory: state.chatHistory.slice(-50), // max 50 messages persisted
        inputMode: state.inputMode,
      }),
    }
  )
);
