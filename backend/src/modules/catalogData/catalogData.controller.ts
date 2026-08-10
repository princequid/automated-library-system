// backend/src/modules/catalogData/catalogData.controller.ts
import { Request, Response } from 'express';
import { authorsService, categoriesService, publishersService } from './catalogData.service';
import { sendCreated, sendSuccess } from '../../shared/responseHelper';

interface CrudService<TRow extends { id: string }, TDto> {
  list(): Promise<TRow[]>;
  create(dto: TDto): Promise<TRow>;
  update(id: string, dto: Partial<TDto>): Promise<TRow>;
  remove(id: string): Promise<void>;
}

function makeController<TRow extends { id: string }, TDto>(service: CrudService<TRow, TDto>, entityType: string, label: string) {
  return {
    async list(_req: Request, res: Response): Promise<void> {
      sendSuccess(res, await service.list(), label);
    },
    async create(req: Request, res: Response): Promise<void> {
      const row = await service.create(req.body);
      res.locals.audit = { entityType, entityId: row.id, after: row };
      sendCreated(res, row, `${entityType} created`);
    },
    async update(req: Request, res: Response): Promise<void> {
      const row = await service.update(req.params.id, req.body);
      res.locals.audit = { entityType, entityId: req.params.id, after: row };
      sendSuccess(res, row, `${entityType} updated`);
    },
    async remove(req: Request, res: Response): Promise<void> {
      await service.remove(req.params.id);
      res.locals.audit = { entityType, entityId: req.params.id };
      sendSuccess(res, null, `${entityType} deleted`);
    },
  };
}

export const authorsController = makeController(authorsService, 'Author', 'Authors');
export const publishersController = makeController(publishersService, 'Publisher', 'Publishers');
export const categoriesController = makeController(categoriesService, 'Category', 'Categories');
