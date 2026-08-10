// backend/src/modules/locations/locations.controller.ts
import { Request, Response } from 'express';
import { locationsService } from './locations.service';
import { sendCreated, sendSuccess } from '../../shared/responseHelper';
import { AppError } from '../../shared/appError';

function requireName(req: Request): string {
  const name = req.body?.name;
  if (!name || typeof name !== 'string') throw new AppError('A name is required', 422);
  return name;
}

export const locationsController = {
  async tree(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await locationsService.tree(), 'Location tree');
  },
  async createLibrary(req: Request, res: Response): Promise<void> {
    const library = await locationsService.createLibrary(requireName(req));
    res.locals.audit = { entityType: 'Library', entityId: library.id, after: library };
    sendCreated(res, library, 'Library created');
  },
  async createFloor(req: Request, res: Response): Promise<void> {
    const floor = await locationsService.createFloor(req.params.libraryId, requireName(req));
    res.locals.audit = { entityType: 'Floor', entityId: floor.id, after: floor };
    sendCreated(res, floor, 'Floor created');
  },
  async createSection(req: Request, res: Response): Promise<void> {
    const section = await locationsService.createSection(req.params.floorId, requireName(req));
    res.locals.audit = { entityType: 'Section', entityId: section.id, after: section };
    sendCreated(res, section, 'Section created');
  },
  async createShelf(req: Request, res: Response): Promise<void> {
    const shelf = await locationsService.createShelf(req.params.sectionId, requireName(req));
    res.locals.audit = { entityType: 'Shelf', entityId: shelf.id, after: shelf };
    sendCreated(res, shelf, 'Shelf created');
  },
  async deleteShelf(req: Request, res: Response): Promise<void> {
    await locationsService.deleteShelf(req.params.id);
    res.locals.audit = { entityType: 'Shelf', entityId: req.params.id };
    sendSuccess(res, null, 'Shelf deleted');
  },
};
