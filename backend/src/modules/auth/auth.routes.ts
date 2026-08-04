// backend/src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { authRateLimit } from '../../middleware/rateLimit';
import { validateBody } from '../../middleware/validate';
import { asyncHandler } from '../../shared/asyncHandler';
import { loginSchema } from './dto/login.dto';
import { changePasswordSchema } from './dto/change-password.dto';

const router = Router();

// Stricter rate limit on the whole auth surface.
router.use(authRateLimit);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Sign in (students AND staff use this one endpoint)
 *     description: >
 *       Verifies email + bcrypt password against the users table and returns a JWT.
 *       The returned `user.role` determines which interface the frontend renders:
 *       `role === STUDENT` routes to the Student Portal; any other role
 *       (DESK_STAFF/LIBRARIAN/SENIOR_LIBRARIAN/SUPER_ADMIN) routes to the Admin
 *       Portal. This decision is also enforced server-side by RBAC on every
 *       subsequent route. A httpOnly refresh cookie is set on success.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Signed in; returns accessToken + user }
 *       401: { description: Invalid credentials }
 *       429: { description: Account locked after too many failed attempts }
 */
router.post('/login', validateBody(loginSchema), asyncHandler(authController.login));

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Rotate the access token using the httpOnly refresh cookie
 *     security: []
 *     responses:
 *       200: { description: New access token issued }
 *       401: { description: Session expired }
 */
router.post('/refresh', asyncHandler(authController.refresh));

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Revoke the current refresh token and clear the cookie
 *     responses:
 *       200: { description: Signed out }
 */
router.post('/logout', authenticate, asyncHandler(authController.logout));

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Current identity decoded from the access token
 *     responses:
 *       200: { description: The authenticated user }
 *       401: { description: Not authenticated }
 */
router.get('/me', authenticate, asyncHandler(authController.me));

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Change the current user's password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password changed }
 *       401: { description: Current password incorrect }
 *       422: { description: Validation failed }
 */
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  asyncHandler(authController.changePassword)
);

export const authRoutes = router;
