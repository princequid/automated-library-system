// backend/src/modules/catalog/catalog.service.ts
// Catalog browsing (used by the Student Portal search) and management (Admin
// Portal). Exports updateAvailableCopies, the single source of truth for an
// item's availability count - Module 5 (Circulation) imports and calls it after
// every copy status change so availability never drifts.
import { CopyStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { settingsService } from '../settings/settings.service';
import { AppError } from '../../shared/appError';
import { buildMeta } from '../../shared/responseHelper';
import { parseCsv } from '../../shared/csv';
import { promoteQueue } from '../reservations/reservations.service';
import { AddCopiesDto, CreateCatalogDto, ListCatalogQuery, UpdateCatalogDto, UpdateCopyDto } from './dto/catalog.dto';

/**
 * CRITICAL SHARED HELPER. Recomputes available_copies for an item from the number
 * of copies currently in AVAILABLE status. Call after EVERY copy status change.
 */
export async function updateAvailableCopies(catalogItemId: string): Promise<void> {
  const [available, total] = await Promise.all([
    prisma.copy.count({ where: { catalog_item_id: catalogItemId, status: 'AVAILABLE' } }),
    prisma.copy.count({ where: { catalog_item_id: catalogItemId } }),
  ]);
  await prisma.catalogItem.update({
    where: { id: catalogItemId },
    data: { available_copies: available, total_copies: total },
  });
}

function generateBarcode(index = 0): string {
  return `LIB-${Date.now()}-${index}`;
}

class CatalogService {
  async list(query: ListCatalogQuery) {
    const where: Prisma.CatalogItemWhereInput = { deleted_at: null };
    const and: Prisma.CatalogItemWhereInput[] = [];

    if (query.title) and.push({ title: { contains: query.title, mode: 'insensitive' } });
    if (query.author) and.push({ author: { contains: query.author, mode: 'insensitive' } });
    if (query.isbn) and.push({ isbn: { contains: query.isbn } });
    if (query.subject) and.push({ subject_tags: { has: query.subject } });
    if (query.search) {
      and.push({
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { author: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }
    if (query.available_only) and.push({ available_copies: { gt: 0 } });
    if (and.length) where.AND = and;

    const [items, total, loanPeriodDays] = await Promise.all([
      prisma.catalogItem.findMany({
        where,
        orderBy: { title: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.catalogItem.count({ where }),
      settingsService.getNumber('loan_period_days'),
    ]);

    // Derived field so the frontend never needs a second call to show "14-day loan".
    const enriched = items.map((item) => ({ ...item, loan_period_days: loanPeriodDays }));
    return { items: enriched, meta: buildMeta(query.page, query.limit, total) };
  }

  async getById(id: string) {
    const item = await prisma.catalogItem.findFirst({
      where: { id, deleted_at: null },
      include: { copies: { orderBy: { barcode: 'asc' } } },
    });
    if (!item) throw new AppError('Catalog item not found', 404);
    const loanPeriodDays = await settingsService.getNumber('loan_period_days');
    return { ...item, loan_period_days: loanPeriodDays };
  }

  async create(dto: CreateCatalogDto, createdBy: string) {
    if (dto.isbn) {
      const existing = await prisma.catalogItem.findUnique({ where: { isbn: dto.isbn } });
      if (existing) throw new AppError('A catalog item with this ISBN already exists', 409);
    }
    const { category_ids, ...rest } = dto;
    return prisma.catalogItem.create({
      data: {
        ...rest,
        created_by: createdBy,
        categories: category_ids?.length ? { connect: category_ids.map((id) => ({ id })) } : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateCatalogDto) {
    await this.getById(id);
    const { category_ids, ...rest } = dto;
    return prisma.catalogItem.update({
      where: { id },
      data: {
        ...rest,
        categories: category_ids ? { set: category_ids.map((id) => ({ id })) } : undefined,
      },
    });
  }

  // Librarian delete is "Limited" (blocked while any copy is on loan); an
  // ADMINISTRATOR override (force: true, only reachable via requireLibrarianOrOverride,
  // so an override_reason is already required and audited) bypasses that check -
  // the "Full" tier the role-separation spec gives Administrator.
  async softDelete(id: string, force = false) {
    if (!force) {
      const onLoan = await prisma.copy.count({ where: { catalog_item_id: id, status: 'ON_LOAN' } });
      if (onLoan > 0) {
        throw new AppError('Cannot delete: one or more copies are currently on loan', 400);
      }
    }
    await prisma.catalogItem.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  async isbnLookup(isbn: string) {
    const { lookupIsbn } = await import('./isbn-lookup.service');
    return lookupIsbn(isbn);
  }

  async listCopies(catalogItemId: string) {
    await this.getById(catalogItemId);
    return prisma.copy.findMany({ where: { catalog_item_id: catalogItemId }, orderBy: { barcode: 'asc' } });
  }

  async addCopies(catalogItemId: string, dto: AddCopiesDto) {
    await this.getById(catalogItemId);
    const quantity = dto.quantity ?? 1;
    const data = Array.from({ length: quantity }, (_, i) => {
      const barcode = quantity === 1 && dto.barcode ? dto.barcode : generateBarcode(i);
      return {
        catalog_item_id: catalogItemId,
        barcode,
        condition: dto.condition,
        status: 'AVAILABLE' as CopyStatus,
        qr_payload: barcode,
      };
    });
    await prisma.copy.createMany({ data });
    await updateAvailableCopies(catalogItemId);

    // A newly-added copy goes to whoever's been WAITING longest, not to
    // whoever happens to borrow/search next - otherwise the queue is purely
    // decorative the moment restock happens. One promotion attempt per copy
    // added; promoteQueue no-ops once the queue or the new copies run out.
    for (let i = 0; i < quantity; i += 1) {
      await promoteQueue(catalogItemId);
    }

    return this.listCopies(catalogItemId);
  }

  /**
   * staffId attributes the auto-opened maintenance ticket / auto-created lost-
   * book fine this method creates when status transitions to DAMAGED or LOST -
   * previously these were two disconnected manual actions a librarian had to
   * remember to do separately (the exact gap the checklist audit flagged).
   */
  async updateCopy(copyId: string, dto: UpdateCopyDto, staffId: string) {
    const copy = await prisma.copy.findUnique({ where: { id: copyId } });
    if (!copy) throw new AppError('Copy not found', 404);
    const updated = await prisma.copy.update({ where: { id: copyId }, data: dto });
    await updateAvailableCopies(copy.catalog_item_id);

    if (dto.status === 'DAMAGED' && copy.status !== 'DAMAGED') {
      const alreadyOpen = await prisma.maintenance.findFirst({
        where: { copy_id: copyId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      });
      if (!alreadyOpen) {
        await prisma.maintenance.create({
          data: { copy_id: copyId, severity: 'MINOR', opened_by: staffId, notes: dto.condition },
        });
      }
    }

    // Only auto-link when the item has a replacement_cost set - otherwise
    // there's no correct amount to charge, and a $0 fine with no way to edit
    // it afterward would be worse than leaving this to the existing manual
    // POST /fines flow (a librarian who knows the real cost enters it there).
    if (dto.status === 'LOST' && copy.status !== 'LOST') {
      const item = await prisma.catalogItem.findUnique({ where: { id: copy.catalog_item_id } });
      const activeLoan = await prisma.loan.findFirst({ where: { copy_id: copyId, returned_at: null } });
      if (activeLoan && item?.replacement_cost) {
        await prisma.fine.create({
          data: {
            loan_id: activeLoan.id,
            user_id: activeLoan.user_id,
            amount: new Prisma.Decimal(Number(item.replacement_cost).toFixed(2)),
            reason: `Lost book - replacement cost (${item.title})`,
          },
        });
        await prisma.loan.update({ where: { id: activeLoan.id }, data: { returned_at: new Date() } });
      }
    }

    // A copy manually corrected back to AVAILABLE (e.g. a WITHDRAWN/LOST copy
    // turns up) goes to whoever's waiting longest, same as a newly-added one.
    if (dto.status === 'AVAILABLE' && copy.status !== 'AVAILABLE') {
      await promoteQueue(copy.catalog_item_id);
    }

    return updated;
  }

  /**
   * Bulk import from CSV: title,author,isbn,subject,publisher,year,shelf_location,quantity.
   * Upserts the catalog item by ISBN, then creates `quantity` copies with barcodes.
   */
  async bulkImport(csvText: string) {
    const rows = parseCsv(csvText);
    let created = 0;
    let updated = 0;
    let copiesCreated = 0;
    const failed: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row.title || !row.author) {
        failed.push({ row: i + 2, reason: 'Missing title or author' });
        continue;
      }
      try {
        const quantity = Math.max(1, parseInt(row.quantity ?? '1', 10) || 1);
        const subjectTags = row.subject ? row.subject.split(';').map((s) => s.trim()).filter(Boolean) : [];

        const item = row.isbn
          ? await prisma.catalogItem.upsert({
              where: { isbn: row.isbn.trim() },
              create: {
                isbn: row.isbn.trim(),
                title: row.title.trim(),
                author: row.author.trim(),
                publisher: row.publisher?.trim() || null,
                year: row.year ? parseInt(row.year, 10) || null : null,
                shelf_location: row.shelf_location?.trim() || null,
                subject_tags: subjectTags,
              },
              update: {
                title: row.title.trim(),
                author: row.author.trim(),
                publisher: row.publisher?.trim() || undefined,
              },
            })
          : await prisma.catalogItem.create({
              data: {
                title: row.title.trim(),
                author: row.author.trim(),
                publisher: row.publisher?.trim() || null,
                year: row.year ? parseInt(row.year, 10) || null : null,
                shelf_location: row.shelf_location?.trim() || null,
                subject_tags: subjectTags,
              },
            });

        const existingCount = await prisma.copy.count({ where: { catalog_item_id: item.id } });
        if (existingCount === 0) created += 1;
        else updated += 1;

        const copyData = Array.from({ length: quantity }, (_, n) => ({
          catalog_item_id: item.id,
          barcode: generateBarcode(existingCount + n),
          status: 'AVAILABLE' as CopyStatus,
        }));
        await prisma.copy.createMany({ data: copyData });
        copiesCreated += quantity;
        await updateAvailableCopies(item.id);
        for (let n = 0; n < quantity; n += 1) {
          await promoteQueue(item.id);
        }
      } catch (err) {
        failed.push({ row: i + 2, reason: (err as Error).message });
      }
    }

    return { created, updated, copiesCreated, failed };
  }
}

export const catalogService = new CatalogService();
