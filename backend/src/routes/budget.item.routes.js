import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getBudgetItems, createBudgetItem, updateBudgetItem, deleteBudgetItem } from '../controllers/budget.item.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getBudgetItems);
router.post('/', createBudgetItem);
router.patch('/:itemId', updateBudgetItem);
router.delete('/:itemId', deleteBudgetItem);

export default router;
