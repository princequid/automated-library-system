// backend/src/modules/acquisitions/acquisitions.service.ts
// Book request -> Administrator approval -> purchase -> catalogued. Previously
// there was no request/approval chain at all (adding to the catalog was a
// direct librarian create) - this is the missing chain the checklist audit
// flagged, with the approval step explicitly reserved for ADMINISTRATOR to match
// the spec's own "Administrator approval" wording.
import { prisma } from '../../config/database';
import { AppError } from '../../shared/appError';
import {
  CreateAcquisitionDto,
  ListAcquisitionsQuery,
  ReceiveAcquisitionDto,
} from './dto/acquisitions.dto';

class AcquisitionsService {
  async list(query: ListAcquisitionsQuery) {
    return prisma.acquisition.findMany({
      where: query.status ? { status: query.status } : {},
      include: { catalogItem: { select: { id: true, title: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async create(dto: CreateAcquisitionDto, requestedBy: string) {
    return prisma.acquisition.create({ data: { ...dto, requested_by: requestedBy } });
  }

  private async getOpen(id: string) {
    const acquisition = await prisma.acquisition.findUnique({ where: { id } });
    if (!acquisition) throw new AppError('Acquisition request not found', 404);
    return acquisition;
  }

  async approve(id: string, approvedBy: string) {
    const acquisition = await this.getOpen(id);
    if (acquisition.status !== 'REQUESTED') throw new AppError('Only a REQUESTED item can be approved', 400);
    return prisma.acquisition.update({ where: { id }, data: { status: 'APPROVED', approved_by: approvedBy } });
  }

  async reject(id: string, approvedBy: string, reason: string) {
    const acquisition = await this.getOpen(id);
    if (acquisition.status !== 'REQUESTED') throw new AppError('Only a REQUESTED item can be rejected', 400);
    return prisma.acquisition.update({
      where: { id },
      data: { status: 'REJECTED', approved_by: approvedBy, notes: `${acquisition.notes ?? ''}\nRejected: ${reason}`.trim() },
    });
  }

  async markOrdered(id: string) {
    const acquisition = await this.getOpen(id);
    if (acquisition.status !== 'APPROVED') throw new AppError('Only an APPROVED item can be marked ordered', 400);
    return prisma.acquisition.update({ where: { id }, data: { status: 'ORDERED' } });
  }

  /** The book has arrived: catalogue it and create its copies, linking back to this request. */
  async receive(id: string, dto: ReceiveAcquisitionDto, createdBy: string) {
    const acquisition = await this.getOpen(id);
    if (acquisition.status !== 'ORDERED' && acquisition.status !== 'APPROVED') {
      throw new AppError('Only an APPROVED or ORDERED item can be received', 400);
    }

    const item = await prisma.catalogItem.create({
      data: {
        title: acquisition.title,
        author: acquisition.author ?? 'Unknown',
        isbn: acquisition.isbn || undefined,
        publisher: dto.publisher,
        year: dto.year,
        shelf_location: dto.shelf_location,
        shelf_id: dto.shelf_id,
        created_by: createdBy,
        total_copies: dto.quantity,
        available_copies: dto.quantity,
        copies: {
          create: Array.from({ length: dto.quantity }, (_, i) => ({
            barcode: `LIB-ACQ-${Date.now()}-${i}`,
            status: 'AVAILABLE',
          })),
        },
      },
    });

    return prisma.acquisition.update({
      where: { id },
      data: { status: 'RECEIVED', catalog_item_id: item.id },
      include: { catalogItem: true },
    });
  }
}

export const acquisitionsService = new AcquisitionsService();
