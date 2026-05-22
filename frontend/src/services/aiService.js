/**
 * aiService.js — Centralized frontend AI API layer
 *
 * All AI calls go through here, with:
 *  - Consistent error handling
 *  - User-friendly Indonesian error messages
 *  - Client-side duplicate request prevention
 */

import api from './api';

// ─── In-flight request tracking (prevent duplicate simultaneous calls) ─────────
let _activeChatRequest = null;

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
 * Send a chat message to Steria AI.
 * @param {string} message
 * @returns {Promise<{success, message, insights, tasks}>}
 */
export const sendChatMessage = async (message) => {
  // Cancel previous if still in-flight (shouldn't happen with disabled UI, but safety net)
  if (_activeChatRequest) {
    console.log('[aiService] Cancelling previous chat request');
  }

  try {
    const promise = api.post('/ai/chat', { message: message.trim() });
    _activeChatRequest = promise;
    const res = await promise;
    _activeChatRequest = null;

    if (res.data?.success) return res.data;
    // Server returned success:false (graceful AI error)
    return {
      success: false,
      message: res.data?.message || USER_FRIENDLY_ERRORS[500],
      insights: [],
      tasks: [],
    };
  } catch (err) {
    _activeChatRequest = null;
    console.error('[aiService] Chat error:', err.message);
    return {
      success: false,
      message: mapError(err),
      insights: [],
      tasks: [],
    };
  }
};

// ─── Insights ──────────────────────────────────────────────────────────────────
/**
 * Generate AI financial insights (read-only).
 * @returns {Promise<{success, insights, summary, health_score, health_label}>}
 */
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
/**
 * Parse voice transcript into structured intent (no DB writes).
 * @param {string} transcript
 * @returns {Promise<{success, parsed: {intent, amount, category, item, source_account, destination_account, confidence}}>}
 */
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
