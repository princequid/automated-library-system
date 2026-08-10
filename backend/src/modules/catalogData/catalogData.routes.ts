// backend/src/modules/catalogData/catalogData.routes.ts
// Three tiny, near-identical CRUD surfaces (Author/Publisher/Category) - one
// router, mounted three times under different prefixes in modules/routes.ts.
import { Router } from 'express';
import { authorsController, categoriesController, publishersController } from './catalogData.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validateBody } from '../../middleware/validate';
import { asyncHandler } from '../../shared/asyncHandler';
import { AnyZodObject } from 'zod';
import { authorSchema, categorySchema, publisherSchema } from './catalogData.dto';

interface CrudController {
  list: (req: import('express').Request, res: import('express').Response) => Promise<void>;
  create: (req: import('express').Request, res: import('express').Response) => Promise<void>;
  update: (req: import('express').Request, res: import('express').Response) => Promise<void>;
  remove: (req: import('express').Request, res: import('express').Response) => Promise<void>;
}

// Author/publisher/category are taxonomy - System Configuration in the role-
// separation spec, so only ADMINISTRATOR defines new entries. Librarian keeps
// read access (GET) to pick from the list while cataloguing a book.
function buildRouter(controller: CrudController, schema: AnyZodObject) {
  const router = Router();
  router.use(authenticate);
  router.get('/', asyncHandler(controller.list));
  router.post('/', requireRole('ADMINISTRATOR'), validateBody(schema), asyncHandler(controller.create));
  router.put('/:id', requireRole('ADMINISTRATOR'), validateBody(schema.partial()), asyncHandler(controller.update));
  router.delete('/:id', requireRole('ADMINISTRATOR'), asyncHandler(controller.remove));
  return router;
}

export const authorsRoutes = buildRouter(authorsController, authorSchema);
export const publishersRoutes = buildRouter(publishersController, publisherSchema);
export const categoriesRoutes = buildRouter(categoriesController, categorySchema);
