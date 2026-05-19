import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getSavingsGoals, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal } from '../controllers/savings.goal.controller.js';
import { getSavingsTransactions, createSavingsTransaction, deleteSavingsTransaction } from '../controllers/savings.transaction.controller.js';

const router = express.Router();
router.use(authenticate);

// Goals
router.get('/goals', getSavingsGoals);
router.post('/goals', createSavingsGoal);
router.patch('/goals/:goalId', updateSavingsGoal);
router.delete('/goals/:goalId', deleteSavingsGoal);

// Transactions
router.get('/transactions', getSavingsTransactions);
router.post('/transactions', createSavingsTransaction);
router.delete('/transactions/:transactionId', deleteSavingsTransaction);

export default router;
