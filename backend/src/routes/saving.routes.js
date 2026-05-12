import express from 'express';
import { getSavings, createSaving, updateSaving, deleteSaving } from '../controllers/saving.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getSavings);
router.post('/', createSaving);
router.patch('/:id', updateSaving);
router.delete('/:id', deleteSaving);

export default router;
