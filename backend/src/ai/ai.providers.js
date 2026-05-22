import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Model Configuration ──────────────────────────────
const PRIMARY_MODEL   = 'gemini-2.5-flash';
const FALLBACK_MODEL  = 'gemini-2.0-flash';

const GENERATION_CONFIG = {
  temperature: 0.3,
  maxOutputTokens: 1024,
};

let _genAI = null;
const getGenAI = () => {
  if (_genAI) return _genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing from .env');
  _genAI = new GoogleGenerativeAI(apiKey);
  return _genAI;
};

// ─── Timeout helper ───────────────────────────────────
const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`TIMEOUT: ${label} exceeded ${ms}ms`)), ms)
    ),
  ]);

// ─── Core generator ───────────────────────────────────
const callGeminiModel = async (modelId, systemPrompt, userMessage, jsonMode) => {
  const genAI = getGenAI();
  const config = {
    ...GENERATION_CONFIG,
    ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
  };

  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: systemPrompt,
    generationConfig: config,
  });

  const result = await model.generateContent(userMessage);
  const response = result.response;
  const text = response.text();

  if (!text || text.trim() === '') throw new Error('Empty response from model');
  return text;
};

// ─── Public API ───────────────────────────────────────
/**
 * Generate an AI response using Gemini with automatic fallback.
 * 1. Try Gemini 2.5 Flash (primary)
 * 2. On failure → Gemini 2.0 Flash (fallback)
 * 3. On all failures → throw ALL_MODELS_FAILED
 *
 * @param {string} systemPrompt  - System instruction for the AI
 * @param {string} userMessage   - User's message / query
 * @param {boolean} jsonMode     - If true, request JSON output
 * @returns {Promise<string>}    - Raw text response from AI
 */
export const generateAIResponse = async (systemPrompt, userMessage, jsonMode = false) => {
  const models = [
    { id: PRIMARY_MODEL,  name: 'Gemini 2.5 Flash', timeout: 20000 },
    { id: FALLBACK_MODEL, name: 'Gemini 2.0 Flash', timeout: 15000 },
  ];

  let lastError = null;

  for (const model of models) {
    console.log(`[AI Provider] Attempting: ${model.name} (${model.id})`);
    try {
      const text = await withTimeout(
        callGeminiModel(model.id, systemPrompt, userMessage, jsonMode),
        model.timeout,
        model.name
      );
      console.log(`[AI Provider] ✅ Success using ${model.name}`);
      return text;
    } catch (err) {
      console.error(`[AI Provider] ❌ ${model.name} failed: ${err.message}`);
      lastError = err;
    }
  }

  console.error('[AI Provider] ALL models failed. Last error:', lastError?.message);
  throw new Error('ALL_MODELS_FAILED');
};
