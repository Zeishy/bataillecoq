import express from 'express';
const router = express.Router();
import { protect } from '../middleware/auth.js';
import {
  getTournamentMessages,
  getTeamMessages,
  getMatchMessages,
  postMessage,
  editMessage,
  deleteMessage
} from '../controllers/messageController.js';

// Get messages
router.get('/tournament/:tournamentId', getTournamentMessages);
router.get('/team/:teamId', protect, getTeamMessages);
router.get('/matches/:matchId/messages', protect, getMatchMessages);

// Post message
router.post('/', protect, postMessage);
router.post('/matches/:matchId/messages', protect, postMessage);

// Edit message
router.put('/:id', protect, editMessage);

// Delete message
router.delete('/:id', protect, deleteMessage);

export default router;
