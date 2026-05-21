import OpenAI from "openai";

// AI Models definition
const MODELS = [
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B' },
  { id: 'deepseek/deepseek-v4-flash:free', name: 'DeepSeek V4 Flash' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 405B' }
];

const getOpenRouterClient = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing. Please set it in .env");
  }
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
    timeout: 10000, // 10 seconds total timeout for the client
  });
};

export const generateAIResponse = async (systemPrompt, userMessage, jsonMode = false) => {
  const openai = getOpenRouterClient();
  let lastError = null;

  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    console.log(`[AI Provider] Attempting: ${model.name} (${model.id})`);
    
    try {
      const response = await openai.chat.completions.create({
        model: model.id,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        response_format: jsonMode ? { type: "json_object" } : undefined,
      }, {
        timeout: 8000, // 8 seconds timeout for this specific model attempt
      });

      console.log(`[AI Provider] Success using ${model.name}`);
      return response.choices[0].message.content;

    } catch (error) {
      console.error(`[AI Provider] ${model.name} failed:`, error.message);
      lastError = error;
      
      if (i === MODELS.length - 1) break;
      console.log(`[AI Provider] Retrying with next model...`);
    }
  }

  // If all models failed
  console.error('[AI Provider] ALL models failed. Final error:', lastError?.message);
  throw new Error("ALL_MODELS_FAILED");
};
