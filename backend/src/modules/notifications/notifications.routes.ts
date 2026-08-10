// backend/src/modules/notifications/notifications.routes.ts
import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../shared/asyncHandler';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /notifications/me:
 *   get:
 *     tags: [Notifications]
 *     summary: The current user's in-app notifications (newest first, capped at 50)
 *     parameters:
 *       - { in: query, name: unread_only, schema: { type: boolean } }
 *     responses: { 200: { description: Your notifications } }
 */
router.get('/me', asyncHandler(notificationsController.myNotifications));

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark all of the current user's notifications as read
 *     responses: { 200: { description: Count marked read } }
 */
router.put('/read-all', asyncHandler(notificationsController.markAllRead));

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark one notification as read (must belong to the caller)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Marked as read }
 *       404: { description: Not found or not yours }
 */
router.put('/:id/read', asyncHandler(notificationsController.markRead));

export const notificationsRoutes = router;
