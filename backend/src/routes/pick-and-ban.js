import express from 'express';
import * as pickAndBanController from '../controllers/pickAndBanController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/:matchId', pickAndBanController.getPickAndBanStatus);

// Protected routes
router.post('/:matchId/start', protect, pickAndBanController.startPickAndBan);
router.post('/:matchId/pick', protect, pickAndBanController.pickMap);
router.post('/:matchId/ban', protect, pickAndBanController.banMap);

// Admin routes
router.put('/:matchId/complete', protect, authorize('admin'), pickAndBanController.completePickAndBan);

export default router;
