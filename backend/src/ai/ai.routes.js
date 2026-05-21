import express from 'express';
import { processFinanceController } from './ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Secure endpoint with authentication middleware
router.use(authenticate);

// POST /api/ai
router.post('/', processFinanceController);

// POST /api/ai/chat
router.post('/chat', processFinanceController);

export default router;
