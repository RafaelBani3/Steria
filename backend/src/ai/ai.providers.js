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

// ─── Core Google SDK Generator ────────────────────────
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

// ─── Core OpenRouter API Generator ────────────────────
const callOpenRouterModel = async (modelId, systemPrompt, userMessage, jsonMode) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is missing from .env');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': 'https://github.com/RafaelBani3/Steria',
    'X-Title': 'Steria Finance',
  };

  const body = {
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 1024,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
  };

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenRouter HTTP ${response.status}: ${errorText || response.statusText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text || text.trim() === '') throw new Error('Empty response from OpenRouter model');
  return text;
};

// ─── Public API ───────────────────────────────────────
/**
 * Generate an AI response using Gemini with automatic fallback.
 * 1. Try Gemini 2.5 Flash via Google SDK (Direct)
 * 2. Try Gemini 2.0 Flash via Google SDK (Direct)
 * 3. Fallback to Gemini 2.5 Flash via OpenRouter (Alternative route)
 * 4. Fallback to Llama 3.3 70B Free via OpenRouter (Free backup)
 * 5. Fallback to Qwen 2.5 Coder 32B Free via OpenRouter (Free JSON backup)
 * 6. Fallback to DeepSeek Chat via OpenRouter (DeepSeek backup)
 *
 * @param {string} systemPrompt  - System instruction for the AI
 * @param {string} userMessage   - User's message / query
 * @param {boolean} jsonMode     - If true, request JSON output
 * @returns {Promise<string>}    - Raw text response from AI
 */
export const generateAIResponse = async (systemPrompt, userMessage, jsonMode = false) => {
  const models = [
    // ─── Direct Google Gemini SDK ───
    {
      provider: 'google-sdk',
      id: PRIMARY_MODEL,
      name: 'Gemini 2.5 Flash',
      timeout: 20000,
    },
    {
      provider: 'google-sdk',
      id: FALLBACK_MODEL,
      name: 'Gemini 2.0 Flash',
      timeout: 15000,
    },
    // ─── OpenRouter Fallback Models ───
    {
      provider: 'openrouter',
      id: 'google/gemini-2.5-flash',
      name: 'Gemini 2.5 Flash (via OpenRouter)',
      timeout: 20000,
    },
    {
      provider: 'openrouter',
      id: 'meta-llama/llama-3.3-70b-instruct:free',
      name: 'Llama 3.3 70B Free (via OpenRouter)',
      timeout: 20000,
    },
    {
      provider: 'openrouter',
      id: 'qwen/qwen-2.5-coder-32b-instruct:free',
      name: 'Qwen 2.5 Coder 32B Free (via OpenRouter)',
      timeout: 20000,
    },
    {
      provider: 'openrouter',
      id: 'deepseek/deepseek-chat',
      name: 'DeepSeek Chat (via OpenRouter)',
      timeout: 20000,
    },
  ];

  let lastError = null;

  for (const model of models) {
    const isGoogleSdk = model.provider === 'google-sdk';
    const hasKey = isGoogleSdk ? process.env.GEMINI_API_KEY : process.env.OPENROUTER_API_KEY;

    if (!hasKey) {
      console.log(`[AI Provider] Skipping ${model.name} (${model.provider.toUpperCase()} API key missing)`);
      continue;
    }

    console.log(`[AI Provider] Attempting: ${model.name} (${model.id}) via ${model.provider.toUpperCase()}`);
    try {
      let text;
      if (isGoogleSdk) {
        text = await withTimeout(
          callGeminiModel(model.id, systemPrompt, userMessage, jsonMode),
          model.timeout,
          model.name
        );
      } else {
        text = await withTimeout(
          callOpenRouterModel(model.id, systemPrompt, userMessage, jsonMode),
          model.timeout,
          model.name
        );
      }
      console.log(`[AI Provider] ✅ Success using ${model.name} via ${model.provider.toUpperCase()}`);
      return text;
    } catch (err) {
      console.error(`[AI Provider] ❌ ${model.name} via ${model.provider.toUpperCase()} failed: ${err.message}`);
      lastError = err;
    }
  }

  console.error('[AI Provider] ALL models failed. Last error:', lastError?.message);
  throw new Error('ALL_MODELS_FAILED');
};
