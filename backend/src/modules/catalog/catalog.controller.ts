// backend/src/modules/catalog/catalog.controller.ts
import { Request, Response } from 'express';
import { catalogService } from './catalog.service';
import { sendSuccess, sendCreated } from '../../shared/responseHelper';
import { AppError } from '../../shared/appError';

function requireUser(req: Request) {
  if (!req.user) throw new AppError('Authentication required', 401);
  return req.user;
}

export const catalogController = {
  async list(req: Request, res: Response): Promise<void> {
    const { items, meta } = await catalogService.list(req.query as never);
    sendSuccess(res, items, 'Catalog', meta);
  },

  async getOne(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await catalogService.getById(req.params.id), 'Catalog item');
  },

  async create(req: Request, res: Response): Promise<void> {
    const item = await catalogService.create(req.body, requireUser(req).id);
    res.locals.audit = { entityType: 'CatalogItem', entityId: item.id, after: item };
    sendCreated(res, item, 'Catalog item created');
  },

  async update(req: Request, res: Response): Promise<void> {
    const item = await catalogService.update(req.params.id, req.body);
    res.locals.audit = { entityType: 'CatalogItem', entityId: req.params.id, after: item };
    sendSuccess(res, item, 'Catalog item updated');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await catalogService.softDelete(req.params.id);
    res.locals.audit = { entityType: 'CatalogItem', entityId: req.params.id };
    sendSuccess(res, null, 'Catalog item deleted');
  },

  async isbnLookup(req: Request, res: Response): Promise<void> {
    const isbn = String(req.query.isbn ?? '');
    if (!isbn) throw new AppError('An isbn query parameter is required', 422);
    sendSuccess(res, await catalogService.isbnLookup(isbn), 'ISBN lookup');
  },

  async listCopies(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await catalogService.listCopies(req.params.id), 'Copies');
  },

  async addCopies(req: Request, res: Response): Promise<void> {
    const copies = await catalogService.addCopies(req.params.id, req.body);
    res.locals.audit = { entityType: 'Copy', entityId: req.params.id, after: { count: copies.length } };
    sendCreated(res, copies, 'Copies added');
  },

  async updateCopy(req: Request, res: Response): Promise<void> {
    const copy = await catalogService.updateCopy(req.params.id, req.body);
    res.locals.audit = { entityType: 'Copy', entityId: req.params.id, after: copy };
    sendSuccess(res, copy, 'Copy updated');
  },

  async bulkImport(req: Request, res: Response): Promise<void> {
    const file = (req as Request & { file?: { buffer: Buffer } }).file;
    if (!file) throw new AppError('A CSV file is required (field name: file)', 422);
    const result = await catalogService.bulkImport(file.buffer.toString('utf-8'));
    res.locals.audit = { entityType: 'CatalogItem', after: result };
    sendCreated(res, result, `Imported ${result.created + result.updated} item(s), ${result.copiesCreated} copies.`);
  },
};
