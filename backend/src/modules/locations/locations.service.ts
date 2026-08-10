// backend/src/modules/locations/locations.service.ts
// Library -> Floor -> Section -> Shelf. CatalogItem.shelf_id is the additive,
// structured pointer alongside the legacy shelf_location string (see
// schema.prisma's comments on those fields) - this is where a librarian
// manages the hierarchy itself.
import { prisma } from '../../config/database';
import { AppError } from '../../shared/appError';

class LocationsService {
  /** Full nested tree for the admin Locations page. */
  async tree() {
    return prisma.library.findMany({
      include: { floors: { include: { sections: { include: { shelves: true } } } } },
      orderBy: { name: 'asc' },
    });
  }

  createLibrary(name: string) {
    return prisma.library.create({ data: { name } });
  }

  async createFloor(libraryId: string, name: string) {
    const library = await prisma.library.findUnique({ where: { id: libraryId } });
    if (!library) throw new AppError('Library not found', 404);
    return prisma.floor.create({ data: { library_id: libraryId, name } });
  }

  async createSection(floorId: string, name: string) {
    const floor = await prisma.floor.findUnique({ where: { id: floorId } });
    if (!floor) throw new AppError('Floor not found', 404);
    return prisma.section.create({ data: { floor_id: floorId, name } });
  }

  async createShelf(sectionId: string, name: string) {
    const section = await prisma.section.findUnique({ where: { id: sectionId } });
    if (!section) throw new AppError('Section not found', 404);
    return prisma.shelf.create({ data: { section_id: sectionId, name } });
  }

  async deleteShelf(id: string) {
    const inUse = await prisma.catalogItem.count({ where: { shelf_id: id } });
    if (inUse > 0) throw new AppError(`Cannot delete: ${inUse} catalog item(s) are shelved here`, 400);
    await prisma.shelf.delete({ where: { id } });
  }
}

export const locationsService = new LocationsService();
