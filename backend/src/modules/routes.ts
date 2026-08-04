// backend/src/modules/routes.ts
// Aggregate router mounting every feature module under /api/v1.
import { Router } from 'express';
import { authRoutes } from './auth/auth.routes';
import { usersRoutes } from './users/users.routes';
import { settingsRoutes } from './settings/settings.routes';
import { catalogRoutes } from './catalog/catalog.routes';
import { circulationRoutes } from './circulation/circulation.routes';
import { reservationsRoutes, myReservationsHandler } from './reservations/reservations.routes';
import { finesRoutes } from './fines/fines.routes';
import { analyticsRoutes } from './analytics/analytics.routes';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../shared/asyncHandler';

export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/catalog', catalogRoutes);
apiRouter.use('/circulation', circulationRoutes);
apiRouter.use('/reservations', reservationsRoutes);
apiRouter.use('/fines', finesRoutes);
apiRouter.use('/analytics', analyticsRoutes);

/**
 * @swagger
 * /users/me/reservations:
 *   get:
 *     tags: [Reservations]
 *     summary: The current student's active reservations
 *     responses: { 200: { description: Your reservations } }
 */
apiRouter.get('/users/me/reservations', authenticate, asyncHandler(myReservationsHandler));
