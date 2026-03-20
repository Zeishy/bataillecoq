import express from 'express';
import {
  getLadder,
  getPlayerLadder,
  searchLadder,
  resetLadder,
  syncLadderWithTournaments,
  syncLadderDebug
} from '../controllers/ladderController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateObjectId, validate } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/', getLadder);
router.get('/search', searchLadder);
router.get('/:userId', validateObjectId('userId'), validate, getPlayerLadder);

// Debug route (FOR TESTING ONLY - remove in production)
router.post('/sync-debug', syncLadderDebug);

// Admin routes
router.post('/sync', protect, authorize('admin'), syncLadderWithTournaments);
router.delete('/reset', protect, authorize('admin'), resetLadder);

export default router;
