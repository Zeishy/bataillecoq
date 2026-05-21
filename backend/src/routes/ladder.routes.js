import express from 'express';
import {
  getLadder,
  getPlayerLadder,
  searchLadder,
  resetLadder,
  syncLadderWithTournaments,
  syncLadderDebug
} from '../controllers/ladderController.js';
import { PLACEMENT_POINTS, MATCH_WIN_POINTS, WEIGHT_PRESETS } from '../config/pointsSystem.js';
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

// Documentation/Info routes
router.get('/meta/points-system', (req, res) => {
  res.status(200).json({
    success: true,
    pointsSystem: {
      placement: PLACEMENT_POINTS,
      matchWins: MATCH_WIN_POINTS,
      weightPresets: WEIGHT_PRESETS,
      description: 'Ladder points calculation based on tournament placement and weight multiplier'
    },
    explanation: {
      placementPoints: 'Points awarded based on final tournament placement (1st, 2nd, 3rd, etc.)',
      matchWinPoints: 'Points awarded for winning matches during tournament phases',
      weight: 'Tournament weight multiplier (1.0 = normal, 2.0 = double, etc.) applied to all points',
      formula: 'Total Points = (Placement Points × Weight) + (Match Wins × Match Points × Weight)'
    }
  });
});

export default router;
