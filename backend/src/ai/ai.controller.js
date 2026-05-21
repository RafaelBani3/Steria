import { processFinanceTransaction } from './ai.service.js';
import { handleAIError } from './ai.errorHandler.js';

export const processFinanceController = async (req, res) => {
  try {
    const { message } = req.body;
    console.log(`[AI Controller] Received action request: "${message}"`);
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message parameter is required' });
    }

    const userId = req.user.userId;
    const result = await processFinanceTransaction(userId, message);

    return res.status(200).json(result);
  } catch (error) {
    console.error('AI Action Process Error:', error.message);
    return handleAIError(error, res);
  }
};
