// backend/prisma/backfill.ts
// Creates Author/Publisher/Category/Location entity rows from the existing
// free-text fields on CatalogItem and links each item's new FK back to them.
// Every lookup is find-or-create, so this is safe to run more than once and
// safe to run against a database that already has real data (it never
// deletes or overwrites the existing string fields - those stay as the
// display fallback forever, per schema.prisma's own comments on them).
//
// Called from prisma/seed.ts right after catalog items are created (fresh-seed
// path). Also runnable standalone for an existing, already-populated database
// that should NOT be wiped and reseeded:
//   npx ts-node prisma/backfill.ts
import { PrismaClient } from '@prisma/client';

async function findOrCreateFloor(prisma: PrismaClient, libraryId: string, name: string) {
  const existing = await prisma.floor.findFirst({ where: { library_id: libraryId, name } });
  if (existing) return existing;
  return prisma.floor.create({ data: { library_id: libraryId, name } });
}

async function findOrCreateSection(prisma: PrismaClient, floorId: string, name: string) {
  const existing = await prisma.section.findFirst({ where: { floor_id: floorId, name } });
  if (existing) return existing;
  return prisma.section.create({ data: { floor_id: floorId, name } });
}

async function findOrCreateShelf(prisma: PrismaClient, sectionId: string, name: string) {
  const existing = await prisma.shelf.findFirst({ where: { section_id: sectionId, name } });
  if (existing) return existing;
  return prisma.shelf.create({ data: { section_id: sectionId, name } });
}

/** Very rough "CS-A-01" -> section "A" grouping, good enough for a demo shelf hierarchy. */
function sectionNameFromShelfLocation(shelfLocation: string): string {
  const match = shelfLocation.match(/^([A-Za-z]+)-([A-Za-z0-9]+)/);
  return match ? `${match[1]} ${match[2]}` : 'General';
}

export async function backfillCatalogEntities(prisma: PrismaClient): Promise<void> {
  const items = await prisma.catalogItem.findMany();
  if (items.length === 0) return;

  const library = await (async () => {
    const existing = await prisma.library.findUnique({ where: { name: 'Main Library' } });
    return existing ?? prisma.library.create({ data: { name: 'Main Library' } });
  })();
  const floor = await findOrCreateFloor(prisma, library.id, 'Floor 1');

  let authors = 0;
  let publishers = 0;
  let categories = 0;
  let shelves = 0;

  for (const item of items) {
    const data: { author_id?: string; publisher_id?: string; shelf_id?: string } = {};

    if (item.author && !item.author_id) {
      const author = await prisma.author.upsert({
        where: { name: item.author },
        update: {},
        create: { name: item.author },
      });
      data.author_id = author.id;
      authors += 1;
    }

    if (item.publisher && !item.publisher_id) {
      const publisher = await prisma.publisher.upsert({
        where: { name: item.publisher },
        update: {},
        create: { name: item.publisher },
      });
      data.publisher_id = publisher.id;
      publishers += 1;
    }

    if (item.shelf_location && !item.shelf_id) {
      const sectionName = sectionNameFromShelfLocation(item.shelf_location);
      const section = await findOrCreateSection(prisma, floor.id, sectionName);
      const shelf = await findOrCreateShelf(prisma, section.id, item.shelf_location);
      data.shelf_id = shelf.id;
      shelves += 1;
    }

    if (Object.keys(data).length > 0) {
      await prisma.catalogItem.update({ where: { id: item.id }, data });
    }

    if (item.subject_tags.length > 0) {
      const categoryRows = await Promise.all(
        item.subject_tags.map((tag) =>
          prisma.category.upsert({ where: { name: tag }, update: {}, create: { name: tag } })
        )
      );
      categories += categoryRows.length;
      await prisma.catalogItem.update({
        where: { id: item.id },
        data: { categories: { connect: categoryRows.map((c) => ({ id: c.id })) } },
      });
    }
  }

  console.log(
    `Backfilled entities: ${authors} author link(s), ${publishers} publisher link(s), ${categories} category link(s), ${shelves} shelf link(s).`
  );
}

// Allow standalone execution: `npx ts-node prisma/backfill.ts`.
if (require.main === module) {
  const prisma = new PrismaClient();
  backfillCatalogEntities(prisma)
    .then(() => console.log('Backfill complete.'))
    .catch((err) => {
      console.error('Backfill failed:', err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
