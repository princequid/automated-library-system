// backend/src/app.ts
// Express application factory. Wires the full middleware chain in order and mounts
// every module router under /api/v1, plus Swagger UI and an unauthenticated health
// check. Per-route auth/rbac/validate are applied inside each module's routes file.
//
// Chain order:
//   cors -> helmet -> requestLogger -> express.json() -> cookie-parser ->
//   rateLimit -> auditLog -> [per-route: auth -> rbac -> validate -> controller] ->
//   notFound -> errorHandler (last, 4 args)
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { requestLogger } from './middleware/requestLogger';
import { generalRateLimit } from './middleware/rateLimit';
import { auditLog } from './middleware/auditLog';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRouter } from './modules/routes';
import './shared/types'; // load Express request augmentation

export function createApp(): Application {
  const app = express();

  // Behind a reverse proxy in production, trust it so req.ip is accurate.
  app.set('trust proxy', 1);

  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(helmet());
  app.use(requestLogger);
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(generalRateLimit);
  app.use(auditLog);

  /**
   * @swagger
   * /health:
   *   get:
   *     tags: [Health]
   *     summary: Liveness probe (no auth)
   *     security: []
   *     responses:
   *       200:
   *         description: Service is up
   */
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Interactive API documentation.
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'ALMS API Docs' }));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

  // All feature modules.
  app.use('/api/v1', apiRouter);

  // 404 for anything unmatched, then the terminal error handler.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
