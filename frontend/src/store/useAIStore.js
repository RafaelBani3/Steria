import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sendChatMessage, generateInsights, confirmPendingAction } from '../services/aiService';

const WELCOME_MESSAGE = {
  id: 'welcome',
  sender: 'ai',
  text: 'Halo! Saya Steria Copilot — asisten finansial AI pribadi kamu 🤖✨\n\nSaya bisa bantu analisa pengeluaran, kasih rekomendasi budget, atau catat transaksi kamu. Ada yang bisa saya bantu hari ini?',
  response_type: 'INFORMATION',
  timestamp: new Date().toISOString(),
};

export const useAIStore = create(
  persist(
    (set, get) => ({
      // ── Chat Page State ───────────────────────────────────────
      chatHistory: [WELCOME_MESSAGE],
      isChatLoading: false,

      // ── Conversation Context Memory ───────────────────────────
      // Tracks last intent/account for follow-up messages
      conversationContext: null,

      // ── Pending Confirmation State ────────────────────────────
      // When AI returns REQUIRES_CONFIRMATION, store here for user to approve
      pendingConfirmation: null, // { tasks, preview_message, context_hint }

      // ── Floating Modal State ──────────────────────────────────
      isOpen: false,
      isListening: false,
      isProcessing: false,
      transcript: '',
      aiResponse: null,
      error: null,
      inputMode: 'voice',

      // ── Insights State ────────────────────────────────────────
      aiInsights: [],
      insightSummary: '',
      healthScore: 0,
      healthLabel: 'Fair',
      isInsightsLoading: false,
      insightsError: null,

      // ── Chat Actions ──────────────────────────────────────────
      sendMessage: async (messageText) => {
        if (!messageText?.trim() || get().isChatLoading) return;

        const userMsg = {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: messageText.trim(),
          response_type: 'USER',
          timestamp: new Date().toISOString(),
        };

        set(state => ({
          chatHistory: [...state.chatHistory, userMsg],
          isChatLoading: true,
          pendingConfirmation: null, // Clear any previous pending
        }));

        // Pass current conversation context for follow-up awareness
        const currentContext = get().conversationContext;
        const result = await sendChatMessage(messageText, currentContext);

        // ── Update conversation context from AI response ───────
        if (result.context_hint) {
          set({ conversationContext: result.context_hint });
        }

        // ── Handle REQUIRES_CONFIRMATION ───────────────────────
        if (result.response_type === 'REQUIRES_CONFIRMATION' && result.pending_tasks?.length > 0) {
          const aiMsg = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: result.message,
            response_type: 'REQUIRES_CONFIRMATION',
            pending_tasks: result.pending_tasks,
            insights: result.insights || [],
            timestamp: new Date().toISOString(),
          };
          set(state => ({
            chatHistory: [...state.chatHistory, aiMsg],
            isChatLoading: false,
            pendingConfirmation: {
              tasks: result.pending_tasks,
              message: result.message,
            },
          }));
          return result;
        }

        // ── Regular response (ACTION, CLARIFICATION, etc.) ─────
        const aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: result.message || 'Maaf, ada gangguan kecil. Coba lagi ya 🙏',
          response_type: result.response_type || 'ERROR',
          insights: result.insights || [],
          tasks: result.tasks || [],
          missing_fields: result.missing_fields || [],
          isError: !result.success,
          timestamp: new Date().toISOString(),
        };

        set(state => ({
          chatHistory: [...state.chatHistory, aiMsg],
          isChatLoading: false,
        }));

        return result;
      },

      // ── Confirm pending action (from REQUIRES_CONFIRMATION) ───
      confirmPending: async () => {
        const { pendingConfirmation } = get();
        if (!pendingConfirmation?.tasks?.length) return;

        set({ isChatLoading: true });

        const result = await confirmPendingAction(pendingConfirmation.tasks);

        const aiMsg = {
          id: `ai-confirm-${Date.now()}`,
          sender: 'ai',
          text: result.message || 'Transaksi berhasil dicatat! ✅',
          response_type: result.success ? 'ACTION' : 'ERROR',
          insights: [],
          tasks: result.tasks || [],
          isError: !result.success,
          timestamp: new Date().toISOString(),
        };

        set(state => ({
          chatHistory: [...state.chatHistory, aiMsg],
          isChatLoading: false,
          pendingConfirmation: null,
        }));

        return result;
      },

      // ── Cancel pending action ─────────────────────────────────
      cancelPending: () => {
        set({ pendingConfirmation: null });
        const cancelMsg = {
          id: `ai-cancel-${Date.now()}`,
          sender: 'ai',
          text: 'Oke, dibatalin ya! 😄 Kalau mau coba lagi tinggal bilang.',
          response_type: 'INFORMATION',
          timestamp: new Date().toISOString(),
        };
        set(state => ({ chatHistory: [...state.chatHistory, cancelMsg] }));
      },

      clearHistory: () => set({
        chatHistory: [{ ...WELCOME_MESSAGE, timestamp: new Date().toISOString() }],
        conversationContext: null,
        pendingConfirmation: null,
      }),

      addMessage: (msg) => set(state => ({ chatHistory: [...state.chatHistory, msg] })),

      // ── Floating Modal Actions ────────────────────────────────
      openModal: () => set({ isOpen: true, error: null, aiResponse: null, transcript: '', isListening: false }),
      closeModal: () => set({ isOpen: false, isListening: false, isProcessing: false }),
      setListening: (status) => set({ isListening: status }),
      setTranscript: (text) => set({ transcript: text }),
      setInputMode: (mode) => set({ inputMode: mode }),
      setError: (errorMessage) => set({ error: errorMessage, isProcessing: false, isListening: false }),
      clearResponse: () => set({ aiResponse: null }),

      processMessage: async (messageText) => {
        if (!messageText?.trim()) return;
        set({ isProcessing: true, isListening: false, error: null, aiResponse: null });

        const currentContext = get().conversationContext;
        const result = await sendChatMessage(messageText, currentContext);

        if (result.context_hint) set({ conversationContext: result.context_hint });

        if (result.success) {
          // For CLARIFICATION — show clarification in modal, don't close
          if (result.response_type === 'CLARIFICATION') {
            set({
              aiResponse: { ...result, isClarification: true },
              isProcessing: false,
              transcript: '',
            });
          } else if (result.response_type === 'REQUIRES_CONFIRMATION') {
            set({
              aiResponse: { ...result, isConfirmation: true },
              isProcessing: false,
              transcript: '',
            });
          } else {
            set({ aiResponse: result, isProcessing: false, transcript: '' });
          }

          // Sync to chat history
          const userMsg = { id: `user-modal-${Date.now() - 1}`, sender: 'user', text: messageText.trim(), response_type: 'USER', timestamp: new Date().toISOString() };
          const aiMsg   = { id: `ai-modal-${Date.now()}`, sender: 'ai', text: result.message, response_type: result.response_type, insights: result.insights || [], tasks: result.tasks || [], timestamp: new Date().toISOString() };
          set(state => ({ chatHistory: [...state.chatHistory, userMsg, aiMsg] }));
        } else {
          set({ error: result.message, isProcessing: false });
        }

        return result;
      },

      // ── Confirm from modal ────────────────────────────────────
      confirmModalAction: async () => {
        const { aiResponse } = get();
        if (!aiResponse?.pending_tasks?.length) return;

        set({ isProcessing: true });
        const result = await confirmPendingAction(aiResponse.pending_tasks);
        set({
          aiResponse: result.success ? { ...result, justConfirmed: true } : { success: false, message: result.message },
          isProcessing: false,
        });
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
      partialize: (state) => ({
        chatHistory: state.chatHistory.slice(-50),
        inputMode: state.inputMode,
        conversationContext: state.conversationContext, // Persist context across refreshes
      }),
    }
  )
);
