import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getBudgetCategories, seedDefaultCategories } from '../controllers/budget.category.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getBudgetCategories);
router.post('/seed', seedDefaultCategories);

export default router;
