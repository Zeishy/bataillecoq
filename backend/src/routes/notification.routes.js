import express from 'express';
const router = express.Router();
import { protect } from '../middleware/auth.js';
import * as notificationController from '../controllers/notificationController.js';

// Get all notifications for current user
router.get('/', protect, notificationController.getNotifications);

// Get unread count
router.get('/unread-count', protect, notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:id/read', protect, notificationController.markAsRead);

// Mark all as read
router.patch('/mark-all-read', protect, notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', protect, notificationController.deleteNotification);

export default router;
