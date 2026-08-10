// backend/src/modules/settings/settings.routes.ts
import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate } from '../../middleware/auth';
import { requireAtLeast, requireRole } from '../../middleware/rbac';
import { asyncHandler } from '../../shared/asyncHandler';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /settings:
 *   get:
 *     tags: [Settings]
 *     summary: List all system settings (LIBRARIAN+)
 *     responses:
 *       200: { description: All settings }
 *       403: { description: Forbidden }
 *   put:
 *     tags: [Settings]
 *     summary: Bulk-update settings, changed keys only (ADMINISTRATOR)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties: { key: { type: string }, value: {} }
 *     responses:
 *       200: { description: Updated }
 *       403: { description: Forbidden }
 *       422: { description: Type mismatch }
 */
router.get('/', requireAtLeast('LIBRARIAN'), asyncHandler(settingsController.list));
router.put('/', requireRole('ADMINISTRATOR'), asyncHandler(settingsController.setMany));

/**
 * @swagger
 * /settings/{key}:
 *   get:
 *     tags: [Settings]
 *     summary: Read one setting (LIBRARIAN+)
 *     parameters: [{ in: path, name: key, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: The setting value }
 *   put:
 *     tags: [Settings]
 *     summary: Update one setting (ADMINISTRATOR)
 *     parameters: [{ in: path, name: key, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Updated }
 *       403: { description: Forbidden }
 */
router.get('/:key', requireAtLeast('LIBRARIAN'), asyncHandler(settingsController.getOne));
router.put('/:key', requireRole('ADMINISTRATOR'), asyncHandler(settingsController.setOne));

export const settingsRoutes = router;
