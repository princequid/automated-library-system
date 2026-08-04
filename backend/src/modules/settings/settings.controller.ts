// backend/src/modules/settings/settings.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { settingsService } from './settings.service';
import { sendSuccess } from '../../shared/responseHelper';
import { AppError } from '../../shared/appError';

const setOneSchema = z.object({ value: z.union([z.string(), z.number(), z.boolean()]) });
const setManySchema = z.object({
  updates: z
    .array(z.object({ key: z.string().min(1), value: z.union([z.string(), z.number(), z.boolean()]) }))
    .min(1),
});

const asString = (v: string | number | boolean): string => String(v);

export const settingsController = {
  async list(_req: Request, res: Response): Promise<void> {
    const settings = await settingsService.list();
    sendSuccess(res, settings, 'Settings');
  },

  async getOne(req: Request, res: Response): Promise<void> {
    const value = await settingsService.get(req.params.key);
    sendSuccess(res, { key: req.params.key, value }, 'Setting');
  },

  async setOne(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new AppError('Authentication required', 401);
    const { value } = setOneSchema.parse(req.body);
    await settingsService.set(req.params.key, asString(value), req.user.id);
    res.locals.audit = { entityType: 'Setting', entityId: req.params.key, after: { value } };
    sendSuccess(res, { key: req.params.key, value }, 'Setting updated');
  },

  async setMany(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new AppError('Authentication required', 401);
    const { updates } = setManySchema.parse(req.body);
    const normalised = updates.map((u) => ({ key: u.key, value: asString(u.value) }));
    await settingsService.setMany(normalised, req.user.id);
    res.locals.audit = { entityType: 'Setting', after: normalised };
    sendSuccess(res, normalised, `${normalised.length} setting(s) updated`);
  },
};
