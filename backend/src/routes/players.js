import express from 'express';
import {
  getPlayers,
  getPlayer,
  getPlayerStats,
  getPlayerHistory,
  syncStats,
  getLeaderboard
} from '../controllers/playerController.js';
import { protect } from '../middleware/auth.js';
import { validateObjectId, validate } from '../middleware/validation.js';

const router = express.Router();

router.get('/', getPlayers);
router.get('/leaderboard/:game', getLeaderboard);
router.get('/:id', validateObjectId('id'), validate, getPlayer);
router.get('/:id/stats/:game', validateObjectId('id'), validate, getPlayerStats);
router.get('/:id/history/:game', validateObjectId('id'), validate, getPlayerHistory);
router.put('/:id/sync/:game', protect, validateObjectId('id'), validate, syncStats);

export default router;
