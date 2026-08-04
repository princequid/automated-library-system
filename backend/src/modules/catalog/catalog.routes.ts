// backend/src/modules/catalog/catalog.routes.ts
import { Router } from 'express';
import { catalogController } from './catalog.controller';
import { authenticate } from '../../middleware/auth';
import { requireAtLeast } from '../../middleware/rbac';
import { validateBody, validateQuery } from '../../middleware/validate';
import { asyncHandler } from '../../shared/asyncHandler';
import { upload } from '../../shared/upload';
import {
  addCopiesSchema,
  createCatalogSchema,
  listCatalogQuery,
  updateCatalogSchema,
  updateCopySchema,
} from './dto/catalog.dto';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /catalog/items:
 *   get:
 *     tags: [Catalog]
 *     summary: Search the catalog (any authenticated user - students search here)
 *     parameters:
 *       - { in: query, name: title, schema: { type: string } }
 *       - { in: query, name: author, schema: { type: string } }
 *       - { in: query, name: isbn, schema: { type: string } }
 *       - { in: query, name: subject, schema: { type: string } }
 *       - { in: query, name: available_only, schema: { type: boolean } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *     responses:
 *       200: { description: Items include a derived loan_period_days field }
 *   post:
 *     tags: [Catalog]
 *     summary: Create a catalog item (LIBRARIAN+)
 *     responses:
 *       201: { description: Created }
 *       409: { description: ISBN already exists }
 */
router.get('/items', validateQuery(listCatalogQuery), asyncHandler(catalogController.list));
router.post('/items', requireAtLeast('LIBRARIAN'), validateBody(createCatalogSchema), asyncHandler(catalogController.create));

/**
 * @swagger
 * /catalog/isbn-lookup:
 *   get:
 *     tags: [Catalog]
 *     summary: Best-effort metadata lookup via Open Library (LIBRARIAN+)
 *     parameters: [{ in: query, name: isbn, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Metadata, or null if not found }
 */
router.get('/isbn-lookup', requireAtLeast('LIBRARIAN'), asyncHandler(catalogController.isbnLookup));

/**
 * @swagger
 * /catalog/bulk-import:
 *   post:
 *     tags: [Catalog]
 *     summary: Bulk import items + copies from CSV (LIBRARIAN+)
 *     responses:
 *       201: { description: Import summary }
 */
router.post('/bulk-import', requireAtLeast('LIBRARIAN'), upload.single('file'), asyncHandler(catalogController.bulkImport));

/**
 * @swagger
 * /catalog/items/{id}:
 *   get:
 *     tags: [Catalog]
 *     summary: Item detail with copies and loan_period_days (any authenticated)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Item detail }
 *       404: { description: Not found }
 *   put:
 *     tags: [Catalog]
 *     summary: Update an item (LIBRARIAN+)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Updated } }
 *   delete:
 *     tags: [Catalog]
 *     summary: Soft-delete an item (SENIOR_LIBRARIAN+); blocked if any copy is on loan
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Deleted }
 *       400: { description: A copy is on loan }
 */
router.get('/items/:id', asyncHandler(catalogController.getOne));
router.put('/items/:id', requireAtLeast('LIBRARIAN'), validateBody(updateCatalogSchema), asyncHandler(catalogController.update));
router.delete('/items/:id', requireAtLeast('SENIOR_LIBRARIAN'), asyncHandler(catalogController.remove));

/**
 * @swagger
 * /catalog/items/{id}/copies:
 *   get:
 *     tags: [Catalog]
 *     summary: List copies of an item (LIBRARIAN+)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Copies } }
 *   post:
 *     tags: [Catalog]
 *     summary: Add copies (LIBRARIAN+); auto-generates barcodes for quantity > 1
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 201: { description: Copies added } }
 */
router.get('/items/:id/copies', requireAtLeast('LIBRARIAN'), asyncHandler(catalogController.listCopies));
router.post('/items/:id/copies', requireAtLeast('LIBRARIAN'), validateBody(addCopiesSchema), asyncHandler(catalogController.addCopies));

/**
 * @swagger
 * /catalog/copies/{id}:
 *   put:
 *     tags: [Catalog]
 *     summary: Update a copy's status/condition (LIBRARIAN+)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Copy updated } }
 */
router.put('/copies/:id', requireAtLeast('LIBRARIAN'), validateBody(updateCopySchema), asyncHandler(catalogController.updateCopy));

export const catalogRoutes = router;
