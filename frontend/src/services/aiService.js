/**
 * aiService.js — Centralized frontend AI API layer
 */
import api from './api';

const USER_FRIENDLY_ERRORS = {
  429: 'AI Steria sedang sibuk 😄 Coba beberapa saat lagi ya.',
  503: 'Steria AI sementara tidak tersedia. Coba lagi dalam beberapa menit ✨',
  500: 'Terjadi gangguan kecil. Silakan coba lagi 🙏',
  network: 'Koneksi terputus. Periksa internet kamu dan coba lagi.',
};

const mapError = (err) => {
  if (!err.response) return USER_FRIENDLY_ERRORS.network;
  return USER_FRIENDLY_ERRORS[err.response.status] || USER_FRIENDLY_ERRORS[500];
};

// ─── Chat ──────────────────────────────────────────────────────────────────────
/**
 * @param {string} message
 * @param {object|null} conversationContext - Context from previous turn
 * @returns {Promise<{success, response_type, message, tasks, insights, context_hint, pending_tasks?, missing_fields?}>}
 */
export const sendChatMessage = async (message, conversationContext = null) => {
  try {
    const res = await api.post('/ai/chat', {
      message: message.trim(),
      conversationContext,
    });

    if (res.data?.success) return res.data;

    return {
      success: false,
      response_type: 'ERROR',
      message: res.data?.message || USER_FRIENDLY_ERRORS[500],
      insights: [], tasks: [],
    };
  } catch (err) {
    console.error('[aiService] Chat error:', err.message);
    return {
      success: false,
      response_type: 'ERROR',
      message: mapError(err),
      insights: [], tasks: [],
    };
  }
};

// ─── Confirm pending action ────────────────────────────────────────────────────
/**
 * Execute previously returned REQUIRES_CONFIRMATION tasks
 * @param {Array} pendingTasks - tasks from the pending response
 */
export const confirmPendingAction = async (pendingTasks) => {
  try {
    const res = await api.post('/ai/confirm', { pending_tasks: pendingTasks });
    if (res.data?.success) return res.data;
    return { success: false, response_type: 'ERROR', message: USER_FRIENDLY_ERRORS[500], tasks: [] };
  } catch (err) {
    console.error('[aiService] Confirm error:', err.message);
    return { success: false, response_type: 'ERROR', message: mapError(err), tasks: [] };
  }
};

// ─── Insights ──────────────────────────────────────────────────────────────────
export const generateInsights = async () => {
  try {
    const res = await api.post('/ai/insights');
    if (res.data?.success) return res.data;
    return { success: false, insights: [], summary: '', health_score: 0, health_label: 'Fair' };
  } catch (err) {
    console.error('[aiService] Insights error:', err.message);
    return { success: false, insights: [], summary: '', health_score: 0, health_label: 'Fair' };
  }
};

// ─── Voice Parse ───────────────────────────────────────────────────────────────
export const parseVoiceIntent = async (transcript) => {
  try {
    const res = await api.post('/ai/parse', { transcript: transcript.trim() });
    if (res.data?.success) return res.data;
    return { success: false, parsed: null };
  } catch (err) {
    console.error('[aiService] Voice parse error:', err.message);
    return { success: false, parsed: null };
  }
};
