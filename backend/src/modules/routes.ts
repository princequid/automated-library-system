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
import { notificationsRoutes } from './notifications/notifications.routes';
import { maintenanceRoutes } from './maintenance/maintenance.routes';
import { inventoryRoutes } from './inventory/inventory.routes';
import { acquisitionsRoutes } from './acquisitions/acquisitions.routes';
import { authorsRoutes, categoriesRoutes, publishersRoutes } from './catalogData/catalogData.routes';
import { locationsRoutes } from './locations/locations.routes';
import { auditLogRoutes } from './auditLogs/auditLog.routes';
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
apiRouter.use('/notifications', notificationsRoutes);
apiRouter.use('/maintenance', maintenanceRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/acquisitions', acquisitionsRoutes);
apiRouter.use('/authors', authorsRoutes);
apiRouter.use('/publishers', publishersRoutes);
apiRouter.use('/categories', categoriesRoutes);
apiRouter.use('/locations', locationsRoutes);
apiRouter.use('/audit-logs', auditLogRoutes);

/**
 * @swagger
 * /users/me/reservations:
 *   get:
 *     tags: [Reservations]
 *     summary: The current student's active reservations
 *     responses: { 200: { description: Your reservations } }
 */
apiRouter.get('/users/me/reservations', authenticate, asyncHandler(myReservationsHandler));
