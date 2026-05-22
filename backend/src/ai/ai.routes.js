import express from 'express';
import {
  processFinanceController,
  confirmActionController,
  generateInsightsController,
  parseVoiceController,
} from './ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All AI routes require authentication
router.use(authenticate);

// ─── Chat / Action ────────────────────────────────────
router.post('/', processFinanceController);
router.post('/chat', processFinanceController);

// ─── Confirm pending action ───────────────────────────
router.post('/confirm', confirmActionController);

// ─── Insights (read-only) ─────────────────────────────
router.post('/insights', generateInsightsController);

// ─── Voice parse (lightweight) ────────────────────────
router.post('/parse', parseVoiceController);

export default router;
