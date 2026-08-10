// backend/src/modules/locations/locations.routes.ts
import { Router } from 'express';
import { locationsController } from './locations.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { asyncHandler } from '../../shared/asyncHandler';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /locations:
 *   get:
 *     tags: [Locations]
 *     summary: Full Library -> Floor -> Section -> Shelf tree (any authenticated user)
 *     responses: { 200: { description: Tree } }
 *   post:
 *     tags: [Locations]
 *     summary: Create a library (ADMINISTRATOR - library structure is system configuration)
 *     responses: { 201: { description: Created } }
 */
router.get('/', asyncHandler(locationsController.tree));
router.post('/', requireRole('ADMINISTRATOR'), asyncHandler(locationsController.createLibrary));

// Structure (library/floor/section/shelf) is ADMINISTRATOR-configured; Librarian
// "uses" it when cataloguing by pointing an item's shelf_id at an existing shelf
// (PUT /catalog/items/:id), never by creating new structure themselves.
router.post('/:libraryId/floors', requireRole('ADMINISTRATOR'), asyncHandler(locationsController.createFloor));
router.post('/floors/:floorId/sections', requireRole('ADMINISTRATOR'), asyncHandler(locationsController.createSection));
router.post('/sections/:sectionId/shelves', requireRole('ADMINISTRATOR'), asyncHandler(locationsController.createShelf));
router.delete('/shelves/:id', requireRole('ADMINISTRATOR'), asyncHandler(locationsController.deleteShelf));

export const locationsRoutes = router;
