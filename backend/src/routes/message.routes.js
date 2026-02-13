import express from 'express';
const router = express.Router();
import { protect } from '../middleware/auth.js';
import {
  getTournamentMessages,
  getTeamMessages,
  postMessage,
  editMessage,
  deleteMessage
} from '../controllers/messageController.js';

// Get messages
router.get('/tournament/:tournamentId', getTournamentMessages);
router.get('/team/:teamId', protect, getTeamMessages);

// Post message
router.post('/', protect, postMessage);

// Edit message
router.put('/:id', protect, editMessage);

// Delete message
router.delete('/:id', protect, deleteMessage);

export default router;
