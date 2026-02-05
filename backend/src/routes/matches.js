import express from 'express';
import {
  getMatch,
  createMatch,
  updateScore,
  completeMatch,
  deleteMatch
} from '../controllers/matchController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateObjectId, validate } from '../middleware/validation.js';

const router = express.Router();

router.get('/:id', validateObjectId('id'), validate, getMatch);
router.post('/', protect, authorize('admin'), createMatch);
router.put('/:id/score', protect, authorize('admin'), validateObjectId('id'), validate, updateScore);
router.put('/:id/complete', protect, authorize('admin'), validateObjectId('id'), validate, completeMatch);
router.delete('/:id', protect, authorize('admin'), validateObjectId('id'), validate, deleteMatch);

export default router;
