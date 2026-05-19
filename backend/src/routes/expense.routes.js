import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getExpenses, createExpense, deleteExpense, getExpenseAnalytics } from '../controllers/expense.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getExpenses);
router.get('/analytics', getExpenseAnalytics);
router.post('/', createExpense);
router.delete('/:expenseId', deleteExpense);

export default router;
