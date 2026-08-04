/**
 * Populated fixtures for the "populated" API stub mode.
 *
 * This is the point of the test harness, not a nice-to-have: a suite that only
 * ever renders empty tables scans zero table cells, so every badge, avatar and
 * row action passes by absence. Every list here has enough rows, and enough
 * variety in status/severity, to actually exercise a DataTable's sort, the
 * SeverityMeter's full range, and every Badge state at least once.
 */

const DAY = 24 * 60 * 60 * 1000;
const now = () => new Date();
const isoDaysFromNow = (days) => new Date(now().getTime() + days * DAY).toISOString();

export const catalogItems = [
  { id: 'cat-1', isbn: '9780262033848', title: 'Introduction to Algorithms', author: 'Cormen, Leiserson, Rivest, Stein', publisher: 'MIT Press', year: 2009, shelf_location: 'CS-A-01', available_copies: 3, total_copies: 5, subject_tags: ['Algorithms'], abstract: 'A comprehensive introduction to the modern study of computer algorithms.', created_at: isoDaysFromNow(-400) },
  { id: 'cat-2', isbn: '9780132126953', title: 'Computer Networking: A Top-Down Approach', author: 'Kurose, Ross', publisher: 'Pearson', year: 2016, shelf_location: 'CS-A-02', available_copies: 0, total_copies: 4, subject_tags: ['Networking'], abstract: 'Builds understanding of networking from the application layer down.', created_at: isoDaysFromNow(-380) },
  { id: 'cat-3', isbn: '9780133594140', title: 'Operating System Concepts', author: 'Silberschatz, Galvin, Gagne', publisher: 'Wiley', year: 2018, shelf_location: 'CS-A-03', available_copies: 1, total_copies: 3, subject_tags: ['Operating Systems'], abstract: 'Core concepts of modern operating systems, with case studies.', created_at: isoDaysFromNow(-360) },
  { id: 'cat-4', isbn: '9780134685991', title: 'Effective Java', author: 'Joshua Bloch', publisher: 'Addison-Wesley', year: 2018, shelf_location: 'CS-B-01', available_copies: 2, total_copies: 2, subject_tags: ['Java'], abstract: 'Best practices for the Java platform, third edition.', created_at: isoDaysFromNow(-300) },
  { id: 'cat-5', isbn: '9781491950296', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', publisher: "O'Reilly", year: 2017, shelf_location: 'CS-B-02', available_copies: 0, total_copies: 2, subject_tags: ['Databases'], abstract: 'The big ideas behind reliable, scalable, and maintainable systems.', created_at: isoDaysFromNow(-250) },
  { id: 'cat-6', isbn: '9780136042594', title: 'Artificial Intelligence: A Modern Approach', author: 'Russell, Norvig', publisher: 'Pearson', year: 2020, shelf_location: 'CS-C-01', available_copies: 4, total_copies: 4, subject_tags: ['AI'], abstract: 'The leading textbook in artificial intelligence.', created_at: isoDaysFromNow(-200) },
  { id: 'cat-7', isbn: '9780073523323', title: 'Digital Design and Computer Architecture', author: 'Harris, Harris', publisher: 'Morgan Kaufmann', year: 2012, shelf_location: 'EE-A-01', available_copies: 1, total_copies: 3, subject_tags: ['Hardware'], abstract: 'Combines digital logic design with computer architecture.', created_at: isoDaysFromNow(-150) },
  { id: 'cat-8', isbn: '9780134444321', title: 'The C Programming Language', author: 'Kernighan, Ritchie', publisher: 'Prentice Hall', year: 1988, shelf_location: 'CS-B-03', available_copies: 2, total_copies: 3, subject_tags: ['C'], abstract: 'The definitive reference for the C language, by its creators.', created_at: isoDaysFromNow(-100) },
];

export const members = [
  { id: 'mem-1', name: 'Ama Mensah', email: 'ama.mensah@st.university.edu', student_id: '20210045', department: 'Computer Science', year_of_study: 2, role: 'STUDENT', status: 'ACTIVE' },
  { id: 'mem-2', name: 'Kofi Boateng', email: 'kofi.boateng@st.university.edu', student_id: '20210046', department: 'Electrical Engineering', year_of_study: 3, role: 'STUDENT', status: 'ACTIVE' },
  { id: 'mem-3', name: 'Efua Owusu', email: 'efua.owusu@st.university.edu', student_id: '20210047', department: 'Computer Science', year_of_study: 6, role: 'STUDENT', status: 'ACTIVE' },
  { id: 'mem-4', name: 'Yaw Darko', email: 'yaw.darko@st.university.edu', student_id: '20210048', department: 'Mechanical Engineering', year_of_study: 1, role: 'STUDENT', status: 'SUSPENDED' },
  { id: 'mem-5', name: 'Adjoa Asante', email: 'adjoa.asante@st.university.edu', student_id: '20210049', department: 'Computer Science', year_of_study: 4, role: 'STUDENT', status: 'ACTIVE' },
  { id: 'mem-6', name: 'Nana Owusu', email: 'nana.owusu@st.university.edu', student_id: '20210050', department: 'Physics', year_of_study: 2, role: 'STUDENT', status: 'GRADUATED' },
];

export const staff = [
  { id: 'stf-1', name: 'System Administrator', email: 'admin@university.edu', role: 'SUPER_ADMIN', status: 'ACTIVE' },
  { id: 'stf-2', name: 'Head Librarian', email: 'librarian@university.edu', role: 'SENIOR_LIBRARIAN', status: 'ACTIVE' },
  { id: 'stf-3', name: 'Front Desk Staff', email: 'desk@university.edu', role: 'DESK_STAFF', status: 'ACTIVE' },
  { id: 'stf-4', name: 'Assistant Librarian', email: 'assistant@university.edu', role: 'LIBRARIAN', status: 'SUSPENDED' },
];

export const loans = [
  { id: 'loan-1', copy_id: 'copy-1', user_id: 'mem-1', issued_at: isoDaysFromNow(-3), due_date: isoDaysFromNow(4), returned_at: null, renewal_count: 0, copy: { id: 'copy-1', barcode: 'LIB-001', catalog_item: catalogItems[0] }, user: { id: 'mem-1', name: 'Ama Mensah', student_id: '20210045' } },
  { id: 'loan-2', copy_id: 'copy-2', user_id: 'mem-2', issued_at: isoDaysFromNow(-10), due_date: isoDaysFromNow(-2), returned_at: null, renewal_count: 1, copy: { id: 'copy-2', barcode: 'LIB-002', catalog_item: catalogItems[1] }, user: { id: 'mem-2', name: 'Kofi Boateng', student_id: '20210046' } },
  { id: 'loan-3', copy_id: 'copy-3', user_id: 'mem-3', issued_at: isoDaysFromNow(-25), due_date: isoDaysFromNow(-11), returned_at: null, renewal_count: 2, copy: { id: 'copy-3', barcode: 'LIB-003', catalog_item: catalogItems[2] }, user: { id: 'mem-3', name: 'Efua Owusu', student_id: '20210047' } },
  { id: 'loan-4', copy_id: 'copy-4', user_id: 'mem-1', issued_at: isoDaysFromNow(-40), due_date: isoDaysFromNow(-30), returned_at: null, renewal_count: 0, copy: { id: 'copy-4', barcode: 'LIB-004', catalog_item: catalogItems[4] }, user: { id: 'mem-1', name: 'Ama Mensah', student_id: '20210045' } },
  { id: 'loan-5', copy_id: 'copy-5', user_id: 'mem-5', issued_at: isoDaysFromNow(-14), due_date: isoDaysFromNow(0), returned_at: isoDaysFromNow(-1), renewal_count: 0, copy: { id: 'copy-5', barcode: 'LIB-005', catalog_item: catalogItems[3] }, user: { id: 'mem-5', name: 'Adjoa Asante', student_id: '20210049' } },
  { id: 'loan-6', copy_id: 'copy-6', user_id: 'mem-2', issued_at: isoDaysFromNow(-7), due_date: isoDaysFromNow(7), returned_at: null, renewal_count: 0, copy: { id: 'copy-6', barcode: 'LIB-006', catalog_item: catalogItems[5] }, user: { id: 'mem-2', name: 'Kofi Boateng', student_id: '20210046' } },
];

export const overdueLoans = loans.filter((l) => !l.returned_at && new Date(l.due_date) < now());

export const fines = [
  { id: 'fine-1', loan_id: 'loan-2', user_id: 'mem-2', amount: '1.00', reason: '2 day(s) overdue', paid: false, waived: false, created_at: isoDaysFromNow(-2), user: { id: 'mem-2', name: 'Kofi Boateng', student_id: '20210046' } },
  { id: 'fine-2', loan_id: 'loan-3', user_id: 'mem-3', amount: '5.50', reason: '11 day(s) overdue', paid: false, waived: false, created_at: isoDaysFromNow(-11), user: { id: 'mem-3', name: 'Efua Owusu', student_id: '20210047' } },
  { id: 'fine-3', loan_id: 'loan-4', user_id: 'mem-1', amount: '15.00', reason: '30 day(s) overdue - capped', paid: false, waived: false, created_at: isoDaysFromNow(-30), user: { id: 'mem-1', name: 'Ama Mensah', student_id: '20210045' } },
  { id: 'fine-4', loan_id: null, user_id: 'mem-5', amount: '12.50', reason: 'Damaged book - water damage', paid: true, waived: false, created_at: isoDaysFromNow(-20), paid_at: isoDaysFromNow(-15), user: { id: 'mem-5', name: 'Adjoa Asante', student_id: '20210049' } },
];

export const dashboardStats = {
  activeLoans: loans.filter((l) => !l.returned_at).length,
  overdueCount: overdueLoans.length,
  finesCollectedThisMonth: 12.5,
  itemsAddedThisWeek: 2,
};

export const loanVolume = Array.from({ length: 14 }, (_, i) => ({
  day: isoDaysFromNow(-13 + i),
  count: [1, 0, 2, 1, 0, 3, 1, 0, 0, 2, 1, 1, 0, 2][i],
}));

// Matches the real shape from backend/src/modules/analytics/analytics.service.ts's
// overdueRate() exactly - {day, overdue, total, rate} - not just {day, rate}.
// DashboardPage's Overdue KPI sparkline reads the `overdue` field directly off
// this same series, so an incomplete fixture here silently breaks that card
// in the test/screenshot environment even though the real API always includes it.
const OVERDUE_RATE_PCT = [20, 18, 25, 22, 30, 28, 25, 20, 22, 18, 15, 20, 25, 22];
const OVERDUE_RATE_TOTAL = [5, 6, 4, 9, 10, 7, 8, 5, 9, 11, 13, 10, 8, 9];
export const overdueRate = Array.from({ length: 14 }, (_, i) => {
  const total = OVERDUE_RATE_TOTAL[i];
  const rate = OVERDUE_RATE_PCT[i];
  return { day: isoDaysFromNow(-13 + i), overdue: Math.round((rate / 100) * total), total, rate };
});

export const topBorrowed = [
  { title: 'Introduction to Algorithms', author: 'Cormen, Leiserson, Rivest, Stein', count: 4 },
  { title: 'Computer Networking: A Top-Down Approach', author: 'Kurose, Ross', count: 3 },
  { title: 'Operating System Concepts', author: 'Silberschatz, Galvin, Gagne', count: 2 },
];

export const borrowingByDept = [
  { department: 'Computer Science', count: 8 },
  { department: 'Electrical Engineering', count: 3 },
  { department: 'Mechanical Engineering', count: 1 },
];

export const recentActivity = loans.slice(0, 5);

// Generic copies for whichever item CopiesModal/IssuePanel happens to open -
// not keyed per catalog item, same simplification the catalog/items stub
// itself makes (full fixture list regardless of the query's search term).
export const copies = [
  { id: 'copy-a1', barcode: 'LIB-101', status: 'AVAILABLE', condition: 'Good' },
  { id: 'copy-a2', barcode: 'LIB-102', status: 'AVAILABLE', condition: 'Good' },
  { id: 'copy-a3', barcode: 'LIB-103', status: 'ON_LOAN', condition: 'Good' },
  { id: 'copy-a4', barcode: 'LIB-104', status: 'DAMAGED', condition: 'Torn cover' },
  { id: 'copy-a5', barcode: 'LIB-105', status: 'LOST', condition: null },
];

export const reshelfQueue = [
  { loan_id: 'loan-5', barcode: 'LIB-005', title: 'Effective Java', author: 'Joshua Bloch', shelf_location: 'CS-B-01', returned_at: isoDaysFromNow(-1) },
];
