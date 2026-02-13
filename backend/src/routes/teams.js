import express from 'express';
import {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addPlayer,
  joinTeam,
  removePlayer,
  invitePlayer,
  getPendingInvitations,
  acceptInvitation,
  rejectInvitation
} from '../controllers/teamController.js';
import { protect, authorize, isCaptain } from '../middleware/auth.js';
import {
  createTeamValidation,
  validateObjectId,
  validate
} from '../middleware/validation.js';

const router = express.Router();

router.get('/', getTeams);
router.get('/:id', validateObjectId('id'), validate, getTeam);
router.post('/', protect, createTeamValidation, validate, createTeam);
router.put('/:id', protect, validateObjectId('id'), validate, isCaptain, updateTeam);
router.delete('/:id', protect, validateObjectId('id'), validate, isCaptain, deleteTeam);
router.post('/:id/join', protect, validateObjectId('id'), validate, joinTeam);
router.post('/:id/players', protect, validateObjectId('id'), validate, isCaptain, addPlayer);
router.delete('/:id/players/:playerId', protect, validateObjectId('id'), validateObjectId('playerId'), validate, isCaptain, removePlayer);

// Invitation routes
router.post('/:id/invite', protect, validateObjectId('id'), validate, invitePlayer);
router.get('/invitations/pending', protect, getPendingInvitations);
router.post('/invitations/:id/accept', protect, validateObjectId('id'), validate, acceptInvitation);
router.post('/invitations/:id/reject', protect, validateObjectId('id'), validate, rejectInvitation);

export default router;
