import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getAccounts,
  getAccountWithAnalytics,
  getAccountSummary,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountHistory,
} from '../controllers/account.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAccounts);
router.get('/summary', getAccountSummary);
router.get('/:accountId/analytics', getAccountWithAnalytics);
router.get('/:accountId/history', getAccountHistory);
router.post('/', createAccount);
router.patch('/:accountId', updateAccount);
router.delete('/:accountId', deleteAccount);

export default router;
