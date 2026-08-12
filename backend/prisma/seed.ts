// backend/prisma/seed.ts
// Realistic seed data covering BOTH portals. Creates settings, staff + student
// accounts, a CS/Engineering catalog with copies, active/overdue loans, holds,
// and unpaid fines. On completion it prints a table of every login so you can
// sign in immediately and exercise both portals. Run with: npm run db:seed
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { addDays, subDays } from 'date-fns';
import { backfillCatalogEntities } from './backfill';

const prisma = new PrismaClient();
const COST = 12;

// Setting defaults - the single source of truth lives here. One flat policy
// for every student - no undergraduate/postgraduate/lecturer tiers.
const SETTINGS: { key: string; value: string; type: string; description: string }[] = [
  { key: 'fine_rate', value: '0.50', type: 'number', description: 'Daily fine (GHS) per overdue loan' },
  { key: 'fine_max_cap_ghs', value: '20.00', type: 'number', description: 'Maximum fine per overdue loan (GHS)' },
  { key: 'fine_grace_period_days', value: '0', type: 'number', description: 'Grace days before fines accrue' },
  { key: 'fine_blocking_threshold_ghs', value: '10.00', type: 'number', description: 'Outstanding fines that block borrowing (GHS)' },
  { key: 'loan_limit', value: '5', type: 'number', description: 'Concurrent loan limit per student' },
  { key: 'loan_period_days', value: '14', type: 'number', description: 'Loan length (days)' },
  { key: 'max_renewals', value: '2', type: 'number', description: 'Maximum renewals per loan' },
  // 1 day = the 24-hour pickup window every borrow request gets once a copy
  // is set aside (status READY) - see reservations.service.ts's create().
  { key: 'hold_pickup_deadline_days', value: '1', type: 'number', description: 'Days a ready hold is held before expiring' },
];

const STAFF = [
  { name: 'System Administrator', email: 'admin@university.edu', role: 'ADMINISTRATOR' as const, password: 'Admin@1234' },
  { name: 'Deputy Administrator', email: 'deputy.admin@university.edu', role: 'ADMINISTRATOR' as const, password: 'Deputy@1234' },
  { name: 'Head Librarian', email: 'librarian@university.edu', role: 'LIBRARIAN' as const, password: 'Library@123' },
  { name: 'Front Desk Librarian', email: 'desk@university.edu', role: 'LIBRARIAN' as const, password: 'Desk@1234' },
  { name: 'Circulation Librarian', email: 'circulation@university.edu', role: 'LIBRARIAN' as const, password: 'Circulate@123' },
  { name: 'Cataloguing Librarian', email: 'catalog@university.edu', role: 'LIBRARIAN' as const, password: 'Catalog@123' },
  { name: 'Acquisitions Librarian', email: 'acquisitions@university.edu', role: 'LIBRARIAN' as const, password: 'Acquire@123' },
];

const STUDENTS: {
  name: string;
  email: string;
  student_id: string;
  department: string;
  year_of_study: number;
}[] = [
  { name: 'Ama Mensah', email: 'ama.mensah@st.university.edu', student_id: '20210045', department: 'Computer Science', year_of_study: 2 },
  { name: 'Kofi Boateng', email: 'kofi.boateng@st.university.edu', student_id: '20210046', department: 'Electrical Engineering', year_of_study: 3 },
  { name: 'Efua Owusu', email: 'efua.owusu@st.university.edu', student_id: '20210047', department: 'Computer Science', year_of_study: 6 },
  { name: 'Yaw Darko', email: 'yaw.darko@st.university.edu', student_id: '20210048', department: 'Mechanical Engineering', year_of_study: 1 },
  { name: 'Adjoa Asante', email: 'adjoa.asante@st.university.edu', student_id: '20210049', department: 'Computer Science', year_of_study: 4 },
  { name: 'Kwame Nkrumah', email: 'kwame.nkrumah@st.university.edu', student_id: '20210050', department: 'Computer Science', year_of_study: 3 },
  { name: 'Abena Osei', email: 'abena.osei@st.university.edu', student_id: '20210051', department: 'Computer Science', year_of_study: 1 },
  { name: 'Kojo Appiah', email: 'kojo.appiah@st.university.edu', student_id: '20210052', department: 'Electrical Engineering', year_of_study: 2 },
  { name: 'Akosua Frimpong', email: 'akosua.frimpong@st.university.edu', student_id: '20210053', department: 'Computer Science', year_of_study: 3 },
  { name: 'Kwabena Antwi', email: 'kwabena.antwi@st.university.edu', student_id: '20210054', department: 'Mechanical Engineering', year_of_study: 2 },
  { name: 'Adwoa Sarpong', email: 'adwoa.sarpong@st.university.edu', student_id: '20210055', department: 'Computer Science', year_of_study: 4 },
  { name: 'Yaa Boateng', email: 'yaa.boateng@st.university.edu', student_id: '20210056', department: 'Electrical Engineering', year_of_study: 1 },
  { name: 'Kwesi Amponsah', email: 'kwesi.amponsah@st.university.edu', student_id: '20210057', department: 'Computer Science', year_of_study: 2 },
  { name: 'Abenaa Ofori', email: 'abenaa.ofori@st.university.edu', student_id: '20210058', department: 'Mechanical Engineering', year_of_study: 3 },
  { name: 'Kwaku Mensah', email: 'kwaku.mensah@st.university.edu', student_id: '20210059', department: 'Electrical Engineering', year_of_study: 4 },
  { name: 'Afia Danso', email: 'afia.danso@st.university.edu', student_id: '20210060', department: 'Computer Science', year_of_study: 1 },
  { name: 'Kwame Owusu', email: 'kwame.owusu@st.university.edu', student_id: '20210061', department: 'Mechanical Engineering', year_of_study: 2 },
  { name: 'Akua Asamoah', email: 'akua.asamoah@st.university.edu', student_id: '20210062', department: 'Computer Science', year_of_study: 5 },
  { name: 'Kojo Yeboah', email: 'kojo.yeboah@st.university.edu', student_id: '20210063', department: 'Electrical Engineering', year_of_study: 3 },
  { name: 'Ama Agyeman', email: 'ama.agyeman@st.university.edu', student_id: '20210064', department: 'Computer Science', year_of_study: 2 },
];

const BOOKS = [
  { isbn: '9780262033848', title: 'Introduction to Algorithms', author: 'Cormen, Leiserson, Rivest, Stein', publisher: 'MIT Press', year: 2009, subject_tags: ['Algorithms', 'Computer Science'], shelf_location: 'CS-A-01' },
  { isbn: '9780132126953', title: 'Computer Networking: A Top-Down Approach', author: 'Kurose, Ross', publisher: 'Pearson', year: 2016, subject_tags: ['Networking', 'Computer Science'], shelf_location: 'CS-A-02' },
  { isbn: '9780133594140', title: 'Operating System Concepts', author: 'Silberschatz, Galvin, Gagne', publisher: 'Wiley', year: 2018, subject_tags: ['Operating Systems'], shelf_location: 'CS-A-03' },
  { isbn: '9780134685991', title: 'Effective Java', author: 'Joshua Bloch', publisher: 'Addison-Wesley', year: 2018, subject_tags: ['Java', 'Programming'], shelf_location: 'CS-B-01' },
  { isbn: '9781491950296', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', publisher: "O'Reilly", year: 2017, subject_tags: ['Databases', 'Distributed Systems'], shelf_location: 'CS-B-02' },
  { isbn: '9780136042594', title: 'Artificial Intelligence: A Modern Approach', author: 'Russell, Norvig', publisher: 'Pearson', year: 2020, subject_tags: ['AI', 'Machine Learning'], shelf_location: 'CS-C-01' },
  { isbn: '9780073523323', title: 'Digital Design and Computer Architecture', author: 'Harris, Harris', publisher: 'Morgan Kaufmann', year: 2015, subject_tags: ['Hardware', 'Electrical Engineering'], shelf_location: 'EE-A-01' },
  { isbn: '9780078028151', title: 'Fundamentals of Electric Circuits', author: 'Sadiku, Alexander', publisher: 'McGraw-Hill', year: 2016, subject_tags: ['Circuits', 'Electrical Engineering'], shelf_location: 'EE-A-02' },
  { isbn: '9780073398174', title: 'Shigley\'s Mechanical Engineering Design', author: 'Budynas, Nisbett', publisher: 'McGraw-Hill', year: 2019, subject_tags: ['Mechanical Engineering'], shelf_location: 'ME-A-01' },
  { isbn: '9780134444321', title: 'The C Programming Language', author: 'Kernighan, Ritchie', publisher: 'Prentice Hall', year: 1988, subject_tags: ['C', 'Programming'], shelf_location: 'CS-B-03' },
];

async function reset(): Promise<void> {
  // Order matters because of FKs - children before parents.
  await prisma.notification.deleteMany();
  await prisma.inventoryScan.deleteMany();
  await prisma.inventorySession.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.acquisition.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.copy.deleteMany();
  await prisma.catalogItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.author.deleteMany();
  await prisma.publisher.deleteMany();
  await prisma.shelf.deleteMany();
  await prisma.section.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.library.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();
}

async function main(): Promise<void> {
  console.log('Seeding ALMS database...');
  await reset();

  // ---- Settings -------------------------------------------------------------
  await prisma.setting.createMany({ data: SETTINGS });

  // ---- Users ----------------------------------------------------------------
  const logins: { email: string; role: string; password: string }[] = [];

  for (const s of STAFF) {
    await prisma.user.create({
      data: { name: s.name, email: s.email, role: s.role, password_hash: await bcrypt.hash(s.password, COST) },
    });
    logins.push({ email: s.email, role: s.role, password: s.password });
  }

  const studentRecords = [];
  for (const st of STUDENTS) {
    const user = await prisma.user.create({
      data: {
        name: st.name,
        email: st.email,
        student_id: st.student_id,
        department: st.department,
        year_of_study: st.year_of_study,
        role: 'STUDENT',
        password_hash: await bcrypt.hash('Student@123', COST),
      },
    });
    studentRecords.push(user);
    logins.push({ email: st.email, role: 'STUDENT', password: 'Student@123' });
  }

  // ---- Catalog + copies -----------------------------------------------------
  const items = [];
  for (let i = 0; i < BOOKS.length; i += 1) {
    const book = BOOKS[i];
    const copyCount = 2 + (i % 3); // 2-4 copies
    const item = await prisma.catalogItem.create({
      data: {
        ...book,
        total_copies: copyCount,
        available_copies: copyCount,
        copies: {
          create: Array.from({ length: copyCount }, (_, n) => ({
            barcode: `LIB-${book.isbn}-${n + 1}`,
            status: 'AVAILABLE',
          })),
        },
      },
      include: { copies: true },
    });
    items.push(item);
  }

  // ---- Loans (3 active; 1 of them overdue) ----------------------------------
  const [amaStudent, kofiStudent, efuaStudent] = studentRecords;

  // Active, not overdue.
  const loan1Copy = items[0].copies[0];
  await prisma.loan.create({
    data: { copy_id: loan1Copy.id, user_id: amaStudent.id, due_date: addDays(new Date(), 7), issued_by: 'seed' },
  });
  await prisma.copy.update({ where: { id: loan1Copy.id }, data: { status: 'ON_LOAN' } });

  const loan2Copy = items[1].copies[0];
  await prisma.loan.create({
    data: { copy_id: loan2Copy.id, user_id: kofiStudent.id, due_date: addDays(new Date(), 3), issued_by: 'seed' },
  });
  await prisma.copy.update({ where: { id: loan2Copy.id }, data: { status: 'ON_LOAN' } });

  // Overdue by 8 days - drives the fine job + overdue badge.
  const overdueCopy = items[2].copies[0];
  const overdueLoan = await prisma.loan.create({
    data: { copy_id: overdueCopy.id, user_id: efuaStudent.id, due_date: subDays(new Date(), 8), issued_by: 'seed' },
  });
  await prisma.copy.update({ where: { id: overdueCopy.id }, data: { status: 'ON_LOAN' } });

  // Recompute availability for the three items now holding a loaned copy.
  for (const item of [items[0], items[1], items[2]]) {
    const available = await prisma.copy.count({ where: { catalog_item_id: item.id, status: 'AVAILABLE' } });
    await prisma.catalogItem.update({ where: { id: item.id }, data: { available_copies: available } });
  }

  // ---- Reservations (1 WAITING, 1 READY) ------------------------------------
  // Make item[3] fully unavailable so a WAITING reservation is realistic.
  await prisma.copy.updateMany({ where: { catalog_item_id: items[3].id }, data: { status: 'ON_LOAN' } });
  await prisma.catalogItem.update({ where: { id: items[3].id }, data: { available_copies: 0 } });
  await prisma.reservation.create({
    data: { catalog_item_id: items[3].id, user_id: amaStudent.id, status: 'WAITING', queue_position: 1 },
  });

  // A READY hold on item[4] with one RESERVED copy.
  const readyCopy = items[4].copies[0];
  await prisma.copy.update({ where: { id: readyCopy.id }, data: { status: 'RESERVED' } });
  const availAfter = await prisma.copy.count({ where: { catalog_item_id: items[4].id, status: 'AVAILABLE' } });
  await prisma.catalogItem.update({ where: { id: items[4].id }, data: { available_copies: availAfter } });
  await prisma.reservation.create({
    data: {
      catalog_item_id: items[4].id,
      user_id: kofiStudent.id,
      status: 'READY',
      queue_position: 0, // 0 = went straight to READY, never actually queued
      ready_at: new Date(),
      expires_at: addDays(new Date(), 1),
    },
  });

  // ---- Fines (2 unpaid) -----------------------------------------------------
  await prisma.fine.create({
    data: { loan_id: overdueLoan.id, user_id: efuaStudent.id, amount: new Prisma.Decimal('6.00'), reason: '8 day(s) overdue' },
  });
  await prisma.fine.create({
    data: { user_id: amaStudent.id, amount: new Prisma.Decimal('12.50'), reason: 'Damaged book - water damage' },
  });

  // ---- Entity backfill (authors/publishers/categories/locations) -----------
  await backfillCatalogEntities(prisma);

  // ---- Additional floors (Floor 2, Floor 3) ---------------------------------
  // backfillCatalogEntities only ever creates "Floor 1" (derived from each
  // book's shelf_location string) - these two are pure structural reference
  // data, so the Locations page demos a real multi-floor library even though
  // no catalog item is shelved on them yet (exactly the kind of empty
  // structure a librarian sets up ahead of stocking it, via the same
  // Add-a-floor/section/shelf rows on that page).
  const mainLibrary = await prisma.library.findUniqueOrThrow({ where: { name: 'Main Library' } });

  const floor2 = await prisma.floor.create({ data: { library_id: mainLibrary.id, name: 'Floor 2' } });
  const floor2Math = await prisma.section.create({ data: { floor_id: floor2.id, name: 'MATH A' } });
  await prisma.shelf.createMany({
    data: [
      { section_id: floor2Math.id, name: 'MATH-A-01' },
      { section_id: floor2Math.id, name: 'MATH-A-02' },
    ],
  });
  const floor2Phy = await prisma.section.create({ data: { floor_id: floor2.id, name: 'PHY A' } });
  await prisma.shelf.create({ data: { section_id: floor2Phy.id, name: 'PHY-A-01' } });

  const floor3 = await prisma.floor.create({ data: { library_id: mainLibrary.id, name: 'Floor 3' } });
  const floor3Gen = await prisma.section.create({ data: { floor_id: floor3.id, name: 'GEN A' } });
  await prisma.shelf.createMany({
    data: [
      { section_id: floor3Gen.id, name: 'GEN-A-01' },
      { section_id: floor3Gen.id, name: 'GEN-A-02' },
    ],
  });
  const floor3Ref = await prisma.section.create({ data: { floor_id: floor3.id, name: 'REF A' } });
  await prisma.shelf.create({ data: { section_id: floor3Ref.id, name: 'REF-A-01' } });

  // ---- Login table ----------------------------------------------------------
  console.log('\nSeed complete. Use any of these logins:\n');
  const pad = (s: string, n: number) => s.padEnd(n);
  console.log(pad('EMAIL', 38) + pad('ROLE', 18) + 'PASSWORD');
  console.log('-'.repeat(70));
  for (const l of logins) {
    console.log(pad(l.email, 38) + pad(l.role, 18) + l.password);
  }
  console.log('\nStudents log in to the Student Portal; every other role lands on the Admin Portal.\n');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
