import express from 'express';
import { getBudgets, createBudget, updateBudget, createBudgetItem, updateBudgetItem, deleteBudgetItem } from '../controllers/budget.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getBudgets);
router.post('/', createBudget);
router.patch('/:budgetId', updateBudget);
router.post('/:budgetId/items', createBudgetItem);
router.patch('/items/:itemId', updateBudgetItem);
router.delete('/items/:itemId', deleteBudgetItem);

export default router;
