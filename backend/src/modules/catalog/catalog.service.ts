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
    return prisma.catalogItem.create({ data: { ...dto, created_by: createdBy } });
  }

  async update(id: string, dto: UpdateCatalogDto) {
    await this.getById(id);
    return prisma.catalogItem.update({ where: { id }, data: dto });
  }

  async softDelete(id: string) {
    const onLoan = await prisma.copy.count({ where: { catalog_item_id: id, status: 'ON_LOAN' } });
    if (onLoan > 0) {
      throw new AppError('Cannot delete: one or more copies are currently on loan', 400);
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
    const data = Array.from({ length: quantity }, (_, i) => ({
      catalog_item_id: catalogItemId,
      barcode: quantity === 1 && dto.barcode ? dto.barcode : generateBarcode(i),
      condition: dto.condition,
      status: 'AVAILABLE' as CopyStatus,
    }));
    await prisma.copy.createMany({ data });
    await updateAvailableCopies(catalogItemId);
    return this.listCopies(catalogItemId);
  }

  async updateCopy(copyId: string, dto: UpdateCopyDto) {
    const copy = await prisma.copy.findUnique({ where: { id: copyId } });
    if (!copy) throw new AppError('Copy not found', 404);
    const updated = await prisma.copy.update({ where: { id: copyId }, data: dto });
    await updateAvailableCopies(copy.catalog_item_id);
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
      } catch (err) {
        failed.push({ row: i + 2, reason: (err as Error).message });
      }
    }

    return { created, updated, copiesCreated, failed };
  }
}

export const catalogService = new CatalogService();
