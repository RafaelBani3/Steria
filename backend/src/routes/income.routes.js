import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getIncomes, createIncome, deleteIncome, getIncomeSummary } from '../controllers/income.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getIncomes);
router.get('/summary', getIncomeSummary);
router.post('/', createIncome);
router.delete('/:incomeId', deleteIncome);

export default router;
