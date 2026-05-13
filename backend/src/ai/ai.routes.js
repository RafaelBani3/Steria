import express from 'express';
import { processFinanceController } from './ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Secure endpoint with authentication middleware
router.use(authenticate);

// POST /api/ai/process-finance
router.post('/process-finance', processFinanceController);

export default router;
