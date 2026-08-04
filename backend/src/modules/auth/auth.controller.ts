// backend/src/modules/auth/auth.controller.ts
// Thin controllers - they only translate HTTP <-> service calls and manage the
// httpOnly refresh cookie. All logic lives in auth.service.ts.
import { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../shared/responseHelper';
import { env } from '../../config/env';
import { AppError } from '../../shared/appError';

const REFRESH_COOKIE = 'refreshToken';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.isProd,
    maxAge: 604_800_000, // 7 days in ms
    path: '/',
  });
}

export const authController = {
  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(
      res,
      { accessToken: result.accessToken, user: result.user },
      'Signed in successfully'
    );
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const token = req.cookies?.[REFRESH_COOKIE];
    const result = await authService.refresh(token);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { accessToken: result.accessToken, user: result.user }, 'Token refreshed');
  },

  async logout(req: Request, res: Response): Promise<void> {
    const token = req.cookies?.[REFRESH_COOKIE];
    await authService.logout(token);
    res.clearCookie(REFRESH_COOKIE, { path: '/', maxAge: 0 });
    sendSuccess(res, null, 'Signed out');
  },

  async me(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new AppError('Authentication required', 401);
    // No DB call needed - the access token payload is authoritative for identity.
    sendSuccess(res, { user: req.user }, 'OK');
  },

  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new AppError('Authentication required', 401);
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    // Clear the cookie so the client re-authenticates cleanly.
    res.clearCookie(REFRESH_COOKIE, { path: '/', maxAge: 0 });
    sendSuccess(res, null, 'Password changed. Please sign in again.');
  },
};
