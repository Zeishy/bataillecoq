import express from 'express';
import {
  getMatch,
  createMatch,
  updateScore,
  confirmMatchReady,
  completeMatch,
  deleteMatch,
  updateScoreAndAdvance,
  selectPlayersForMatch,
  submitScore,
  getPendingSubmissions,
  approveScore,
  rejectScore
} from '../controllers/matchController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateObjectId, validate } from '../middleware/validation.js';

const router = express.Router();

router.get('/:id', validateObjectId('id'), validate, getMatch);
router.post('/', protect, authorize('admin'), createMatch);
router.put('/:id/score', protect, authorize('admin'), validateObjectId('id'), validate, updateScore);
router.put('/:id/score-and-advance', protect, authorize('admin'), validateObjectId('id'), validate, updateScoreAndAdvance);
router.put('/:id/select-players', protect, validateObjectId('id'), validate, selectPlayersForMatch);
router.put('/:id/confirm-ready', protect, validateObjectId('id'), validate, confirmMatchReady);
router.put('/:id/complete', protect, authorize('admin'), validateObjectId('id'), validate, completeMatch);
router.delete('/:id', protect, authorize('admin'), validateObjectId('id'), validate, deleteMatch);

// Score submission and validation routes
router.post('/:id/submit-score', protect, validateObjectId('id'), validate, submitScore);
router.get('/submissions/pending', protect, authorize('admin'), getPendingSubmissions);
router.patch('/:id/approve-score', protect, authorize('admin'), validateObjectId('id'), validate, approveScore);
router.patch('/:id/reject-score', protect, authorize('admin'), validateObjectId('id'), validate, rejectScore);

export default router;
