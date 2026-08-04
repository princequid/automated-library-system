// backend/src/shared/upload.ts
// Shared multer instance for in-memory CSV uploads (bulk import). Files are kept
// in memory (never written to disk) and capped in size.
import multer from 'multer';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
