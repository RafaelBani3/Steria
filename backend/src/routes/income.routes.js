import express from 'express';
import { getIncomes, createIncome, deleteIncome } from '../controllers/income.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getIncomes);
router.post('/', createIncome);
router.delete('/:id', deleteIncome);

export default router;
