import express from 'express';
import * as mapPoolController from '../controllers/mapPoolController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/game/:gameId', mapPoolController.getMapPoolsByGame);
router.get('/:id', mapPoolController.getMapPool);

// Admin routes
router.post('/', protect, authorize('admin'), mapPoolController.createMapPool);
router.put('/:id', protect, authorize('admin'), mapPoolController.updateMapPool);

// Legacy single-mode maps management
router.post('/:id/maps', protect, authorize('admin'), mapPoolController.addMapToPool);
router.delete('/:id/maps/:mapId', protect, authorize('admin'), mapPoolController.removeMapFromPool);

// Multi-mode maps management
router.post('/:id/modes', protect, authorize('admin'), mapPoolController.setModes);
router.post('/:id/modes/:modeId/maps', protect, authorize('admin'), mapPoolController.addMapToMode);
router.delete('/:id/modes/:modeId/maps/:mapId', protect, authorize('admin'), mapPoolController.removeMapFromMode);

// Format and delete
router.put('/:id/formats', protect, authorize('admin'), mapPoolController.updateMapPoolFormats);
router.delete('/:id', protect, authorize('admin'), mapPoolController.deleteMapPool);

export default router;
