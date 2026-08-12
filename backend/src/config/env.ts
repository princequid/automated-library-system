// backend/src/config/env.ts
// Centralised, validated environment configuration. Loaded once at startup.
import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Dev-only fallback secrets - NEVER applied in production. Without this
// isProdEnv gate, a forgotten JWT_SECRET/REFRESH_TOKEN_SECRET on a real host
// would silently fall through to these fixed, publicly-known strings (they're
// sitting in this file's own git history) and sign real tokens with them
// instead of failing to boot. Also enforces a minimum length in production,
// since a short-but-present secret is still weak.
const isProdEnv = (process.env.NODE_ENV ?? 'development') === 'production';
const MIN_PROD_SECRET_LENGTH = 32;

function requiredSecret(name: string, devFallback: string): string {
  const value = required(name, isProdEnv ? undefined : devFallback);
  if (isProdEnv && value.length < MIN_PROD_SECRET_LENGTH) {
    throw new Error(`${name} must be at least ${MIN_PROD_SECRET_LENGTH} characters in production`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  DATABASE_URL: required('DATABASE_URL'),
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
  JWT_SECRET: requiredSecret('JWT_SECRET', 'dev-access-secret'),
  REFRESH_TOKEN_SECRET: requiredSecret('REFRESH_TOKEN_SECRET', 'dev-refresh-secret'),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  get isProd(): boolean {
    return this.NODE_ENV === 'production';
  },
};
