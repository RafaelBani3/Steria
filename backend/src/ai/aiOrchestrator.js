/**
 * aiOrchestrator.js
 *
 * Centralized AI orchestration layer for Steria.
 * Responsibilities:
 *  - In-memory response caching (5-min TTL)
 *  - Prompt injection / jailbreak sanitization
 *  - Graceful user-friendly fallback messages
 *  - Routing to ai.providers.js
 */

import { generateAIResponse } from './ai.providers.js';
import { getSystemPrompt } from './ai.prompt.js';

// ─── Cache ─────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const responseCache = new Map();

const getCacheKey = (userId, messageText, context) => {
  const ctxSnippet = `${context.monthlyExpenses}-${context.totalCashflow}-${context.totalSavings}`;
  return `${userId}:${messageText.toLowerCase().trim()}:${ctxSnippet}`;
};

const getCached = (key) => {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  console.log('[Orchestrator] 🎯 Cache HIT');
  return entry.value;
};

const setCache = (key, value) => {
  // Keep cache lean — max 50 entries
  if (responseCache.size >= 50) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
  responseCache.set(key, { value, ts: Date.now() });
};

// ─── Sanitization ──────────────────────────────────────
const INJECTION_PATTERNS = [
  /ignore\s+previous\s+instructions?/i,
  /forget\s+everything/i,
  /<\/?(system|instruction|prompt)>/i,
  /jailbreak/i,
  /act\s+as\s+(an?\s+)?ai\s+without/i,
  /you\s+are\s+now\s+DAN/i,
];

export const sanitizeInput = (text) => {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text.trim();

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(cleaned)) {
      console.warn('[Orchestrator] ⚠️  Potential injection attempt detected — sanitizing');
      cleaned = cleaned.replace(pattern, '[filtered]');
    }
  }

  // Hard truncate at 800 chars to prevent prompt stuffing
  return cleaned.slice(0, 800);
};

// ─── Friendly fallback messages ────────────────────────
const FALLBACK_MESSAGES = [
  'AI Steria sedang sibuk 😄 Coba beberapa saat lagi ya.',
  'Steria AI sedang mencapai batas penggunaan sementara. Coba lagi dalam 1-2 menit ✨',
  'Wah, sepertinya Steria AI lagi istirahat sejenak 😅 Coba lagi nanti ya!',
];

export const getFallbackMessage = () =>
  FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];

// ─── Core orchestration ────────────────────────────────
/**
 * Main orchestration entry point.
 *
 * @param {string} userId          - Authenticated user ID
 * @param {string} rawMessageText  - Raw user input (will be sanitized)
 * @param {object} financialContext - Pre-computed context from ai.service.js
 * @param {boolean} jsonMode        - Whether to request JSON response
 * @returns {Promise<string>}       - AI text response
 */
export const orchestrateAI = async (userId, rawMessageText, financialContext, jsonMode = true) => {
  // 1. Sanitize input
  const messageText = sanitizeInput(rawMessageText);
  if (!messageText) throw new Error('EMPTY_MESSAGE');

  // 2. Check cache (only for inquiry-style messages, not mutations)
  const isLikelyInquiry = /berapa|gimana|analisa|summarize|sehat|boros|terbesar|total|kondisi|sisa/i.test(messageText);
  const cacheKey = isLikelyInquiry ? getCacheKey(userId, messageText, financialContext) : null;

  if (cacheKey) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  // 3. Build system prompt
  const systemPrompt = getSystemPrompt(financialContext);

  // 4. Call AI provider (with automatic fallback inside)
  const response = await generateAIResponse(systemPrompt, messageText, jsonMode);

  // 5. Cache if applicable
  if (cacheKey) {
    setCache(cacheKey, response);
  }

  return response;
};

/**
 * Lightweight intent-only orchestration (for voice quick-parse).
 * Uses a compact prompt to minimize tokens.
 *
 * @param {string} rawText - Voice transcript
 * @param {object} context - Minimal context (accounts list only)
 * @returns {Promise<string>} - JSON string with intent data
 */
export const orchestrateVoiceParse = async (rawText, context) => {
  const { getParserPrompt } = await import('./ai.prompt.js');
  const messageText = sanitizeInput(rawText);
  const systemPrompt = getParserPrompt(context);
  return generateAIResponse(systemPrompt, messageText, true);
};

/**
 * Insight-only orchestration (read-only, no DB mutations).
 *
 * @param {object} financialContext - Backend-computed financial summary
 * @returns {Promise<string>} - JSON string with insights array
 */
export const orchestrateInsights = async (financialContext) => {
  const { getInsightPrompt } = await import('./ai.prompt.js');
  const systemPrompt = getInsightPrompt(financialContext);

  const cacheKey = `insights:${financialContext.totalCashflow}-${financialContext.monthlyExpenses}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await generateAIResponse(systemPrompt, 'Generate financial insights.', true);
  setCache(cacheKey, response);
  return response;
};
