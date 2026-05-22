import { processFinanceTransaction, buildFinancialContext, executeConfirmedTask } from './ai.service.js';
import { orchestrateInsights, orchestrateVoiceParse, sanitizeInput } from './aiOrchestrator.js';
import { handleAIError } from './ai.errorHandler.js';

// ─── POST /api/ai  &  POST /api/ai/chat ───────────────────────────────────────
export const processFinanceController = async (req, res) => {
  try {
    const { message, conversationContext = null } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message parameter is required' });
    }

    const userId = req.user.userId;
    console.log(`[AI Controller] Chat from user ${userId}: "${message.slice(0, 80)}"`);
    console.log(`[AI Controller] Context:`, conversationContext ? JSON.stringify(conversationContext) : 'none');

    const result = await processFinanceTransaction(userId, message, conversationContext);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[AI Controller] Chat error:', error.message);
    return handleAIError(error, res);
  }
};

// ─── POST /api/ai/confirm ─────────────────────────────────────────────────────
// Execute a previously-returned REQUIRES_CONFIRMATION action
export const confirmActionController = async (req, res) => {
  try {
    const { pending_tasks } = req.body;
    if (!pending_tasks || !Array.isArray(pending_tasks) || pending_tasks.length === 0) {
      return res.status(400).json({ success: false, error: 'pending_tasks is required' });
    }

    const userId = req.user.userId;
    console.log(`[AI Controller] Confirming ${pending_tasks.length} task(s) for user ${userId}`);

    const result = await executeConfirmedTask(userId, pending_tasks);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[AI Controller] Confirm error:', error.message);
    return handleAIError(error, res);
  }
};

// ─── POST /api/ai/insights ────────────────────────────────────────────────────
export const generateInsightsController = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(`[AI Controller] Insights request from user ${userId}`);

    const financialContext = await buildFinancialContext(userId);
    const responseText = await orchestrateInsights(financialContext);
    const cleanedJson  = responseText.replace(/```json\s?|```/g, '').trim();
    const parsed       = JSON.parse(cleanedJson);

    return res.status(200).json({
      success: true,
      insights: parsed.insights || [],
      summary: parsed.summary || '',
      health_score: parsed.health_score || 0,
      health_label: parsed.health_label || 'Fair',
    });
  } catch (error) {
    console.error('[AI Controller] Insights error:', error.message);
    return handleAIError(error, res);
  }
};

// ─── POST /api/ai/parse ───────────────────────────────────────────────────────
export const parseVoiceController = async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ success: false, error: 'Transcript is required' });
    }

    const userId = req.user.userId;
    console.log(`[AI Controller] Voice parse: "${transcript.slice(0, 80)}"`);

    const ctx = await buildFinancialContext(userId);
    const responseText = await orchestrateVoiceParse(transcript, ctx);
    const cleanedJson  = responseText.replace(/```json\s?|```/g, '').trim();
    const parsed       = JSON.parse(cleanedJson);

    return res.status(200).json({ success: true, parsed });
  } catch (error) {
    console.error('[AI Controller] Parse error:', error.message);
    return handleAIError(error, res);
  }
};
