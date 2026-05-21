import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { createTransfer, getTransfers } from '../controllers/transfer.controller.js';

const router = express.Router();
router.use(authenticate);

router.post('/', createTransfer);
router.get('/', getTransfers);

export default router;
