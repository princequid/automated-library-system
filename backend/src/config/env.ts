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

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  DATABASE_URL: required('DATABASE_URL'),
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
  JWT_SECRET: required('JWT_SECRET', 'dev-access-secret'),
  REFRESH_TOKEN_SECRET: required('REFRESH_TOKEN_SECRET', 'dev-refresh-secret'),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  get isProd(): boolean {
    return this.NODE_ENV === 'production';
  },
};
