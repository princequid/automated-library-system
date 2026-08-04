// backend/src/config/jwt.ts
// Sign/verify helpers for the two-token model: a short-lived access token that
// carries the role (used by RBAC), and a long-lived refresh token identified by a jti.
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from './env';

export interface AccessTokenPayload {
  sub: string; // user id
  role: UserRole;
  email: string;
  name: string;
}

export interface RefreshTokenPayload {
  sub: string; // user id
  jti: string; // unique token id, tracked in Redis
}

const ACCESS_TTL: SignOptions['expiresIn'] = '15m';
const REFRESH_TTL: SignOptions['expiresIn'] = '7d';

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TTL });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
}

// Decode without verifying expiry - used on logout so an already-expired refresh
// token can still have its Redis entry cleaned up.
export function decodeRefreshToken(token: string): RefreshTokenPayload | null {
  const decoded = jwt.decode(token);
  if (decoded && typeof decoded === 'object' && 'jti' in decoded) {
    return decoded as RefreshTokenPayload;
  }
  return null;
}
