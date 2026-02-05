import express from 'express';
import {
  getTournaments,
  getTournament,
  createTournament,
  updateTournament,
  updateStatus,
  registerTeam,
  unregisterTeam,
  getStandings,
  getMatches,
  deleteTournament,
  updateAllStatuses
} from '../controllers/tournamentController.js';
import { protect, authorize, isCaptain } from '../middleware/auth.js';
import {
  createTournamentValidation,
  validateObjectId,
  validate
} from '../middleware/validation.js';

const router = express.Router();

router.get('/', getTournaments);
router.get('/:id', validateObjectId('id'), validate, getTournament);
router.get('/:id/standings', validateObjectId('id'), validate, getStandings);
router.get('/:id/matches', validateObjectId('id'), validate, getMatches);

router.post('/', protect, authorize('admin'), createTournamentValidation, validate, createTournament);
router.post('/update-statuses', protect, authorize('admin'), updateAllStatuses);
router.put('/:id', protect, authorize('admin'), validateObjectId('id'), validate, updateTournament);
router.put('/:id/status', protect, authorize('admin'), validateObjectId('id'), validate, updateStatus);
router.delete('/:id', protect, authorize('admin'), validateObjectId('id'), validate, deleteTournament);

router.post('/:id/register', protect, validateObjectId('id'), validate, isCaptain, registerTeam);
router.delete('/:id/register/:teamId', protect, validateObjectId('id'), validateObjectId('teamId'), validate, unregisterTeam);

export default router;
