// backend/src/modules/users/users.routes.ts
import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole, requireAtLeast } from '../../middleware/rbac';
import { validateBody, validateQuery } from '../../middleware/validate';
import { asyncHandler } from '../../shared/asyncHandler';
import { upload } from '../../shared/upload';
import { createUserSchema, listUsersQuery, updateRoleSchema, updateStatusSchema, updateUserSchema } from './dto/user.dto';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Own profile with active loan count and outstanding fine total
 *     responses:
 *       200: { description: Your profile }
 */
router.get('/me', asyncHandler(usersController.me));
router.get('/me/loans', asyncHandler(usersController.myLoans));
router.get('/me/fines', asyncHandler(usersController.myFines));
router.get('/me/eligibility', asyncHandler(usersController.myEligibility));

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List users with filters (LIBRARIAN+)
 *     parameters:
 *       - { in: query, name: role, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string } }
 *       - { in: query, name: department, schema: { type: string } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *     responses:
 *       200: { description: Paginated users }
 *       403: { description: Forbidden }
 *   post:
 *     tags: [Users]
 *     summary: Create a staff or student account (ADMINISTRATOR only). Returns a one-time temp password.
 *     responses:
 *       201: { description: Created; body includes tempPassword shown once }
 *       403: { description: Forbidden }
 *       409: { description: Duplicate email or student ID }
 */
router.get('/', requireAtLeast('LIBRARIAN'), validateQuery(listUsersQuery), asyncHandler(usersController.list));
router.post('/', requireRole('ADMINISTRATOR'), validateBody(createUserSchema), asyncHandler(usersController.create));

/**
 * @swagger
 * /users/bulk-import:
 *   post:
 *     tags: [Users]
 *     summary: Bulk-create STUDENT accounts from CSV (LIBRARIAN+)
 *     description: Multipart CSV (columns name,email,student_id,department,year_of_study). Duplicates are skipped and reported.
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, properties: { file: { type: string, format: binary } } }
 *     responses:
 *       201: { description: Import summary + credentials CSV }
 */
router.post(
  '/bulk-import',
  requireAtLeast('LIBRARIAN'),
  upload.single('file'),
  asyncHandler(usersController.bulkImport)
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update profile fields (LIBRARIAN+)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Updated }
 */
router.put('/:id', requireAtLeast('LIBRARIAN'), validateBody(updateUserSchema), asyncHandler(usersController.update));

/**
 * @swagger
 * /users/{id}/status:
 *   put:
 *     tags: [Users]
 *     summary: Change account status with a required reason (ADMINISTRATOR only)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Status updated }
 *       403: { description: Forbidden }
 */
router.put(
  '/:id/status',
  requireRole('ADMINISTRATOR'),
  validateBody(updateStatusSchema),
  asyncHandler(usersController.updateStatus)
);

/**
 * @swagger
 * /users/{id}/role:
 *   put:
 *     tags: [Users]
 *     summary: Reassign a user's role - Roles & Permissions (ADMINISTRATOR only)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Role updated }
 *       403: { description: Forbidden }
 *       409: { description: Would leave the system with no Administrator }
 */
router.put(
  '/:id/role',
  requireRole('ADMINISTRATOR'),
  validateBody(updateRoleSchema),
  asyncHandler(usersController.updateRole)
);

/**
 * @swagger
 * /users/{id}/eligibility:
 *   get:
 *     tags: [Users]
 *     summary: Borrowing eligibility for a user (LIBRARIAN+ or self)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Eligibility result }
 */
router.get('/:id/eligibility', asyncHandler(usersController.eligibility));
router.get('/:id/loans', asyncHandler(usersController.userLoans));
router.get('/:id/fines', asyncHandler(usersController.userFines));

export const usersRoutes = router;
