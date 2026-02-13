import express from 'express';
import {
  getTournaments,
  getTournament,
  createTournament,
  updateTournament,
  updateStatus,
  registerTeam,
  unregisterTeam,
  approveTeam,
  rejectTeam,
  getStandings,
  getMatches,
  deleteTournament,
  updateAllStatuses,
  generateSchedule,
  startTournament,
  endTournament,
  cancelTournament,
  generateBracket,
  getBracket,
  resetManualOverride
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
router.get('/:id/bracket', validateObjectId('id'), validate, getBracket);

router.post('/', protect, authorize('admin'), createTournamentValidation, validate, createTournament);
router.post('/:id/generate-schedule', protect, authorize('admin'), validateObjectId('id'), validate, generateSchedule);
router.post('/:id/generate-bracket', protect, authorize('admin'), validateObjectId('id'), validate, generateBracket);
router.post('/update-statuses', protect, authorize('admin'), updateAllStatuses);

router.patch('/:id/start', protect, authorize('admin'), validateObjectId('id'), validate, startTournament);
router.patch('/:id/end', protect, authorize('admin'), validateObjectId('id'), validate, endTournament);
router.patch('/:id/cancel', protect, authorize('admin'), validateObjectId('id'), validate, cancelTournament);
router.patch('/:id/reset-manual-override', protect, authorize('admin'), validateObjectId('id'), validate, resetManualOverride);

router.put('/:id', protect, authorize('admin'), validateObjectId('id'), validate, updateTournament);
router.put('/:id/status', protect, authorize('admin'), validateObjectId('id'), validate, updateStatus);
router.delete('/:id', protect, authorize('admin'), validateObjectId('id'), validate, deleteTournament);

router.post('/:id/register', protect, validateObjectId('id'), validate, isCaptain, registerTeam);
router.delete('/:id/register/:teamId', protect, validateObjectId('id'), validateObjectId('teamId'), validate, unregisterTeam);

router.post('/:id/teams/:teamId/approve', protect, authorize('admin'), validateObjectId('id'), validateObjectId('teamId'), validate, approveTeam);
router.post('/:id/teams/:teamId/reject', protect, authorize('admin'), validateObjectId('id'), validateObjectId('teamId'), validate, rejectTeam);

export default router;
