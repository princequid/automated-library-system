// backend/src/test-setup.ts
// Runs before the test suite. Forces test env and dummy secrets so config that
// requires env vars does not throw, and so Redis uses the in-memory fallback.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/alms_test';
process.env.JWT_SECRET ||= 'test-access-secret';
process.env.REFRESH_TOKEN_SECRET ||= 'test-refresh-secret';
process.env.CORS_ORIGIN ||= 'http://localhost:5173';
