import { processFinanceTransaction } from './ai.service.js';

export const processFinanceController = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Message parameter is required and must be a text string' 
      });
    }

    // req.user is guaranteed by authentication middleware
    const userId = req.user.userId;

    const result = await processFinanceTransaction(userId, message);

    return res.status(200).json(result);
  } catch (error) {
    console.error('AI Controller Process Error:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process AI financial message' 
    });
  }
};
