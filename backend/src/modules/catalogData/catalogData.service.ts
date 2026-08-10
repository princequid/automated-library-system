// backend/src/modules/catalogData/catalogData.service.ts
// Author/Publisher/Category are additive entities alongside CatalogItem's own
// free-text author/publisher/subject_tags fields (see schema.prisma's comments
// on those) - this is where a librarian manages the normalized list. Deletion
// is blocked while anything still references the row, so a catalog item never
// silently loses its link.
import { prisma } from '../../config/database';
import { AppError } from '../../shared/appError';
import { AuthorDto, CategoryDto, PublisherDto } from './catalogData.dto';

export const authorsService = {
  list: () => prisma.author.findMany({ orderBy: { name: 'asc' } }),
  create: (dto: AuthorDto) => prisma.author.create({ data: dto }),
  update: (id: string, dto: Partial<AuthorDto>) => prisma.author.update({ where: { id }, data: dto }),
  async remove(id: string) {
    const inUse = await prisma.catalogItem.count({ where: { author_id: id } });
    if (inUse > 0) throw new AppError(`Cannot delete: ${inUse} catalog item(s) still reference this author`, 400);
    await prisma.author.delete({ where: { id } });
  },
};

export const publishersService = {
  list: () => prisma.publisher.findMany({ orderBy: { name: 'asc' } }),
  create: (dto: PublisherDto) => prisma.publisher.create({ data: dto }),
  update: (id: string, dto: Partial<PublisherDto>) => prisma.publisher.update({ where: { id }, data: dto }),
  async remove(id: string) {
    const inUse = await prisma.catalogItem.count({ where: { publisher_id: id } });
    if (inUse > 0) throw new AppError(`Cannot delete: ${inUse} catalog item(s) still reference this publisher`, 400);
    await prisma.publisher.delete({ where: { id } });
  },
};

export const categoriesService = {
  list: () => prisma.category.findMany({ orderBy: { name: 'asc' } }),
  create: (dto: CategoryDto) => prisma.category.create({ data: dto }),
  update: (id: string, dto: Partial<CategoryDto>) => prisma.category.update({ where: { id }, data: dto }),
  async remove(id: string) {
    const inUse = await prisma.catalogItem.count({ where: { categories: { some: { id } } } });
    if (inUse > 0) throw new AppError(`Cannot delete: ${inUse} catalog item(s) still use this category`, 400);
    await prisma.category.delete({ where: { id } });
  },
};
