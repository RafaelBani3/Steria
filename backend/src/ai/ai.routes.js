import express from 'express';
import {
  processFinanceController,
  generateInsightsController,
  parseVoiceController,
} from './ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All AI routes require authentication
router.use(authenticate);

// ─── Chat / Action routes ─────────────────────────────
// POST /api/ai         — main chat (used by floating modal)
router.post('/', processFinanceController);

// POST /api/ai/chat    — alias (used by AIChat page)
router.post('/chat', processFinanceController);

// ─── Insights route ───────────────────────────────────
// POST /api/ai/insights — read-only AI financial insights
router.post('/insights', generateInsightsController);

// ─── Voice parse route ────────────────────────────────
// POST /api/ai/parse   — lightweight intent extraction only
router.post('/parse', parseVoiceController);

export default router;
