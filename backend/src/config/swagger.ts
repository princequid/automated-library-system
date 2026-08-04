// backend/src/config/swagger.ts
// OpenAPI 3 setup. Serves interactive docs at /api/docs, scanning JSDoc @swagger
// blocks across every module's route files.
import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ALMS API',
      version: '3.0.0',
      description:
        'University Automated Library Management System. One Express monolith serving two ' +
        'interfaces (Student Portal + Admin Portal). A single POST /auth/login returns a JWT ' +
        'whose role decides which portal the frontend renders; RBAC enforces access server-side.',
    },
    servers: [{ url: `http://localhost:${env.PORT}/api/v1`, description: 'Local' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' },
            meta: { type: 'object', nullable: true },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Invalid credentials' },
            details: { type: 'object', nullable: true },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Authentication', description: 'Login, refresh, logout, password change' },
      { name: 'Users', description: 'Account management, bulk import, eligibility' },
      { name: 'Settings', description: 'System configuration (fines, loan limits, borrowing rules)' },
      { name: 'Catalog', description: 'Catalog browsing and management, ISBN lookup, copies' },
      { name: 'Circulation', description: 'Desk issue/return/renew and student self-borrow' },
      { name: 'Reservations', description: 'Holds queue and promotion' },
      { name: 'Fines', description: 'Fines, waivers, payments' },
      { name: 'Analytics', description: 'Dashboard metrics and reports' },
    ],
  },
  // Scan compiled or source route/controller files for @swagger blocks.
  apis: ['./src/modules/**/*.routes.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
