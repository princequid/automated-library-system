// backend/src/modules/maintenance/maintenance.service.ts
// A repair ticket's lifecycle for one Copy: OPEN (just flagged DAMAGED) ->
// RESOLVED (repaired, copy goes back to AVAILABLE) or WITHDRAWN (beyond
// repair, copy leaves circulation). openForDamage() is the same call site
// catalog.service.ts's updateCopy uses when a librarian flips a copy's status
// to DAMAGED directly, so a ticket always exists for every damaged copy -
// closing the "no repair lifecycle" gap the checklist audit flagged.
import { prisma } from '../../config/database';
import { updateAvailableCopies } from '../catalog/catalog.service';
import { AppError } from '../../shared/appError';
import { ListMaintenanceQuery, OpenMaintenanceDto, ResolveMaintenanceDto } from './dto/maintenance.dto';

const maintenanceInclude = {
  copy: { include: { catalog_item: { select: { id: true, title: true } } } },
};

class MaintenanceService {
  async list(query: ListMaintenanceQuery) {
    return prisma.maintenance.findMany({
      where: query.status ? { status: query.status } : {},
      include: maintenanceInclude,
      orderBy: { opened_at: 'desc' },
    });
  }

  async open(dto: OpenMaintenanceDto, openedBy: string) {
    const copy = await prisma.copy.findUnique({ where: { id: dto.copy_id } });
    if (!copy) throw new AppError('Copy not found', 404);

    const [ticket] = await prisma.$transaction([
      prisma.maintenance.create({
        data: { copy_id: dto.copy_id, severity: dto.severity, notes: dto.notes, opened_by: openedBy },
        include: maintenanceInclude,
      }),
      prisma.copy.update({ where: { id: dto.copy_id }, data: { status: 'DAMAGED' } }),
    ]);
    await updateAvailableCopies(copy.catalog_item_id);
    return ticket;
  }

  /** Used by catalog.service.ts when a copy's status is flipped to DAMAGED directly via the Copies UI. */
  async openForDamage(copyId: string, openedBy: string, notes?: string) {
    return this.open({ copy_id: copyId, severity: 'MINOR', notes }, openedBy);
  }

  async resolve(id: string, dto: ResolveMaintenanceDto, resolvedBy: string) {
    const ticket = await prisma.maintenance.findUnique({ where: { id } });
    if (!ticket) throw new AppError('Maintenance ticket not found', 404);
    if (ticket.status === 'RESOLVED' || ticket.status === 'WITHDRAWN') {
      throw new AppError('This ticket is already closed', 400);
    }

    const newStatus = dto.outcome === 'repaired' ? 'RESOLVED' : 'WITHDRAWN';
    const copyStatus = dto.outcome === 'repaired' ? 'AVAILABLE' : 'WITHDRAWN';

    const [updated] = await prisma.$transaction([
      prisma.maintenance.update({
        where: { id },
        data: {
          status: newStatus,
          resolved_by: resolvedBy,
          resolved_at: new Date(),
          notes: dto.notes ? `${ticket.notes ?? ''}\n${dto.notes}`.trim() : ticket.notes,
        },
        include: maintenanceInclude,
      }),
      prisma.copy.update({ where: { id: ticket.copy_id }, data: { status: copyStatus } }),
    ]);
    const copy = await prisma.copy.findUnique({ where: { id: ticket.copy_id } });
    if (copy) await updateAvailableCopies(copy.catalog_item_id);
    return updated;
  }
}

export const maintenanceService = new MaintenanceService();
