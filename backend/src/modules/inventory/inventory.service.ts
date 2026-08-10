// backend/src/modules/inventory/inventory.service.ts
// A physical stocktake: start a session (optionally scoped to one shelf),
// scan barcodes as a librarian physically checks the shelf, then complete it -
// the diff between "expected here" (copies whose status implies they SHOULD
// be on the shelf: AVAILABLE or RESERVED, not ON_LOAN) and "actually scanned"
// is the discrepancy report. This is the "does the database match the physical
// library" workflow the checklist audit found completely missing - previously
// there was no reconciliation feature at all, only the (unrelated) AuditLog
// activity trail.
import { prisma } from '../../config/database';
import { AppError } from '../../shared/appError';
import { ScanDto, StartSessionDto } from './dto/inventory.dto';

class InventoryService {
  private async expectedCopies(shelfId?: string) {
    return prisma.copy.findMany({
      where: {
        status: { in: ['AVAILABLE', 'RESERVED'] },
        ...(shelfId ? { catalog_item: { shelf_id: shelfId } } : {}),
      },
      include: { catalog_item: { select: { title: true, shelf_location: true } } },
    });
  }

  async start(dto: StartSessionDto, startedBy: string) {
    const expected = await this.expectedCopies(dto.shelf_id);
    return prisma.inventorySession.create({
      data: { shelf_id: dto.shelf_id, started_by: startedBy, expected_count: expected.length },
    });
  }

  async list() {
    return prisma.inventorySession.findMany({ orderBy: { started_at: 'desc' }, include: { shelf: true } });
  }

  async getById(id: string) {
    const session = await prisma.inventorySession.findUnique({
      where: { id },
      include: { scans: { orderBy: { created_at: 'desc' } }, shelf: true },
    });
    if (!session) throw new AppError('Inventory session not found', 404);

    // Recomputed on every read (not persisted) so it's always current for a
    // completed session, regardless of which browser/session originally
    // called complete() - a copy marked LOST after completion, for instance,
    // should stop showing as still-missing.
    if (session.status === 'COMPLETED') {
      const expected = await this.expectedCopies(session.shelf_id ?? undefined);
      const scannedBarcodes = new Set(session.scans.filter((s) => s.matched).map((s) => s.barcode));
      const missing = expected.filter((copy) => !scannedBarcodes.has(copy.barcode));
      return {
        ...session,
        missing_copies: missing.map((c) => ({
          id: c.id,
          barcode: c.barcode,
          title: c.catalog_item.title,
          shelf_location: c.catalog_item.shelf_location,
        })),
      };
    }

    return { ...session, missing_copies: [] };
  }

  async scan(sessionId: string, dto: ScanDto) {
    const session = await this.getById(sessionId);
    if (session.status === 'COMPLETED') throw new AppError('This session is already complete', 400);

    const copy = await prisma.copy.findUnique({ where: { barcode: dto.barcode } });
    const matched = Boolean(copy);

    await prisma.$transaction([
      prisma.inventoryScan.create({ data: { session_id: sessionId, barcode: dto.barcode, matched } }),
      prisma.inventorySession.update({ where: { id: sessionId }, data: { scanned_count: { increment: 1 } } }),
    ]);

    return { matched, copy };
  }

  /** Completes the session and returns which expected copies were never scanned. */
  async complete(sessionId: string) {
    const session = await this.getById(sessionId);
    if (session.status === 'COMPLETED') throw new AppError('This session is already complete', 400);

    const expected = await this.expectedCopies(session.shelf_id ?? undefined);
    const scannedBarcodes = new Set(session.scans.filter((s) => s.matched).map((s) => s.barcode));
    const missing = expected.filter((copy) => !scannedBarcodes.has(copy.barcode));

    await prisma.inventorySession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED', completed_at: new Date() },
    });

    return {
      expected_count: expected.length,
      scanned_count: scannedBarcodes.size,
      missing_copies: missing.map((c) => ({
        id: c.id,
        barcode: c.barcode,
        title: c.catalog_item.title,
        shelf_location: c.catalog_item.shelf_location,
      })),
    };
  }

  /** Bulk-mark every missing copy from a completed session as LOST. */
  async markMissingAsLost(sessionId: string, copyIds: string[]) {
    const session = await this.getById(sessionId);
    if (session.status !== 'COMPLETED') throw new AppError('Complete the session before marking copies lost', 400);
    await prisma.copy.updateMany({ where: { id: { in: copyIds } }, data: { status: 'LOST' } });
    return { updated: copyIds.length };
  }
}

export const inventoryService = new InventoryService();
