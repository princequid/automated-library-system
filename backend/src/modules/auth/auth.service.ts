// backend/src/modules/auth/auth.service.ts
// Authentication business logic: single login endpoint (role decides routing),
// refresh-token rotation, logout, and password change. Uses Redis for brute-force
// lockout and refresh-token tracking.
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  decodeRefreshToken,
} from '../../config/jwt';
import { AppError } from '../../shared/appError';
import { LoginDto } from './dto/login.dto';

const BCRYPT_COST = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TTL_SECONDS = 900; // 15 minutes
const FAILED_WINDOW_SECONDS = 3600; // 1 hour
const REFRESH_TTL_SECONDS = 604_800; // 7 days

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    student_id: string | null;
    department: string | null;
  };
}

class AuthService {
  /**
   * One login endpoint for BOTH students and staff. The returned role is what the
   * frontend uses to choose the portal, and what RBAC enforces server-side.
   */
  async login({ email, password }: LoginDto): Promise<AuthResult> {
    const user = await prisma.user.findUnique({ where: { email } });

    // Same message whether the email is unknown or the account is not active -
    // this prevents account enumeration.
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Invalid credentials', 401);
    }

    // Brute-force lockout check.
    const locked = await redis.get(`account_lock:${user.id}`);
    if (locked) {
      throw new AppError('Account locked. Try again later.', 429);
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      const failKey = `failed_login:${user.id}`;
      const count = await redis.incr(failKey);
      if (count === 1) await redis.expire(failKey, FAILED_WINDOW_SECONDS);
      if (count >= MAX_FAILED_ATTEMPTS) {
        await redis.set(`account_lock:${user.id}`, '1', 'EX', LOCK_TTL_SECONDS);
      }
      throw new AppError('Invalid credentials', 401);
    }

    // Success - clear the failure counter and issue tokens.
    await redis.del(`failed_login:${user.id}`);
    return this.issueTokens(user);
  }

  private async issueTokens(user: {
    id: string;
    name: string;
    email: string;
    role: string;
    student_id: string | null;
    department: string | null;
  }): Promise<AuthResult> {
    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role as never,
      email: user.email,
      name: user.name,
    });

    const jti = randomUUID();
    const refreshToken = signRefreshToken({ sub: user.id, jti });
    await redis.set(`refresh_token:${jti}`, user.id, 'EX', REFRESH_TTL_SECONDS);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        student_id: user.student_id,
        department: user.department,
      },
    };
  }

  /** Verify + rotate a refresh token. Old jti is revoked, a fresh pair is issued. */
  async refresh(refreshToken: string | undefined): Promise<AuthResult> {
    if (!refreshToken) throw new AppError('Session expired', 401);

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Session expired', 401);
    }

    const storedUserId = await redis.get(`refresh_token:${payload.jti}`);
    if (!storedUserId || storedUserId !== payload.sub) {
      throw new AppError('Session expired', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE') throw new AppError('Session expired', 401);

    // Rotate: invalidate the old token, mint a new pair.
    await redis.del(`refresh_token:${payload.jti}`);
    return this.issueTokens(user);
  }

  /** Revoke the current session's refresh token (best-effort, even if expired). */
  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    const decoded = decodeRefreshToken(refreshToken);
    if (decoded?.jti) {
      await redis.del(`refresh_token:${decoded.jti}`);
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) throw new AppError('Current password is incorrect', 401);

    const hash = await bcrypt.hash(newPassword, BCRYPT_COST);
    await prisma.user.update({ where: { id: userId }, data: { password_hash: hash } });

    // Minimum viable session revocation for this action. NOTE: full multi-session
    // revocation would require a per-user token-version field checked at verify
    // time; that is a future iteration. Here we clear this user's tracked refresh
    // tokens so other sessions cannot silently refresh.
    const keys = await redis.keys('refresh_token:*');
    for (const key of keys) {
      const owner = await redis.get(key);
      if (owner === userId) await redis.del(key);
    }
  }
}

export const authService = new AuthService();
