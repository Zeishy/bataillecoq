import express from 'express';
import {
  getAllGames,
  getAllGamesAdmin,
  getGameBySlug,
  createGame,
  updateGame,
  deleteGame,
  toggleGameStatus
} from '../controllers/gameController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes (anyone can read)
router.get('/', getAllGames);
router.get('/:slug', getGameBySlug);

// Admin only routes (write operations)
router.get('/admin/all', protect, authorize('admin'), getAllGamesAdmin);
router.post('/', protect, authorize('admin'), createGame);
router.put('/:id', protect, authorize('admin'), updateGame);
router.delete('/:id', protect, authorize('admin'), deleteGame);
router.patch('/:id/toggle', protect, authorize('admin'), toggleGameStatus);

export default router;
