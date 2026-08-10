// frontend/src/App.tsx
// Router setup + session bootstrap. On load we attempt a silent refresh using the
// httpOnly cookie; while that runs we show a full-page branded loader so there is
// never a flash of the login page for an already-signed-in user.
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuthStore, isAdminRole } from '@/store/auth.store';
import { RouteGuard } from '@/components/RouteGuard';
import { BrandLoader } from '@/components/Brand';
import { LoginPage } from '@/pages/auth/LoginPage';
import { StudentLayout } from '@/layouts/StudentLayout';
import { AdminRouteGuard } from '@/admin-portal/components/layout/AdminRouteGuard';
import { AdminIndexRoute } from '@/admin-portal/components/layout/AdminIndexRoute';
import { NAV_ITEMS } from '@/admin-portal/constants/nav';

// Student and Admin pages are route-split - each is its own chunk fetched on
// first visit, instead of every portal's pages shipping in the one main bundle
// (that bundle crossed vite's 500kB warning threshold once tables/forms/charts
// were all added). LoginPage and the two layouts stay eager since they're on
// the critical path for almost every session.

// Student pages
const StudentHomePage = lazy(() => import('@/pages/student/HomePage').then((m) => ({ default: m.StudentHomePage })));
const SearchPage = lazy(() => import('@/pages/student/SearchPage').then((m) => ({ default: m.SearchPage })));
const BookDetailPage = lazy(() => import('@/pages/student/BookDetailPage').then((m) => ({ default: m.BookDetailPage })));
const MyLoansPage = lazy(() => import('@/pages/student/MyLoansPage').then((m) => ({ default: m.MyLoansPage })));
const AccountPage = lazy(() => import('@/pages/student/AccountPage').then((m) => ({ default: m.AccountPage })));

// Admin portal - rebuilt on src/admin-portal/* (plain JS/JSX, own token/CSS
// scope). AppShell is the scoping root (applies .admin-portal + data-theme).
const AdminAppShell = lazy(() =>
  import('@/admin-portal/components/layout/AppShell').then((m) => ({ default: m.AppShell }))
);
const AdminLibrarianDashboardPage = lazy(() =>
  import('@/admin-portal/pages/LibrarianDashboardPage').then((m) => ({ default: m.LibrarianDashboardPage }))
);
const AdminAdministratorDashboardPage = lazy(() =>
  import('@/admin-portal/pages/AdministratorDashboardPage').then((m) => ({ default: m.AdministratorDashboardPage }))
);
const AdminCataloguePage = lazy(() => import('@/admin-portal/pages/CataloguePage').then((m) => ({ default: m.CataloguePage })));
const AdminMembersPage = lazy(() => import('@/admin-portal/pages/MembersPage').then((m) => ({ default: m.MembersPage })));
const AdminLoansPage = lazy(() => import('@/admin-portal/pages/LoansPage').then((m) => ({ default: m.LoansPage })));
const AdminCirculationPage = lazy(() =>
  import('@/admin-portal/pages/CirculationPage').then((m) => ({ default: m.CirculationPage }))
);
const AdminOverduesPage = lazy(() => import('@/admin-portal/pages/OverduesPage').then((m) => ({ default: m.OverduesPage })));
const AdminReportsPage = lazy(() => import('@/admin-portal/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const AdminStaffPage = lazy(() => import('@/admin-portal/pages/StaffPage').then((m) => ({ default: m.StaffPage })));
const AdminReservationsPage = lazy(() =>
  import('@/admin-portal/pages/reservations/ReservationsPage').then((m) => ({ default: m.ReservationsPage }))
);
const AdminMaintenancePage = lazy(() =>
  import('@/admin-portal/pages/maintenance/MaintenancePage').then((m) => ({ default: m.MaintenancePage }))
);
const AdminInventoryPage = lazy(() =>
  import('@/admin-portal/pages/inventory/InventoryPage').then((m) => ({ default: m.InventoryPage }))
);
const AdminInventorySessionDetailPage = lazy(() =>
  import('@/admin-portal/pages/inventory/InventorySessionDetailPage').then((m) => ({ default: m.InventorySessionDetailPage }))
);
const AdminAcquisitionsPage = lazy(() =>
  import('@/admin-portal/pages/acquisitions/AcquisitionsPage').then((m) => ({ default: m.AcquisitionsPage }))
);
const AdminCatalogDataPage = lazy(() =>
  import('@/admin-portal/pages/catalogData/CatalogDataPage').then((m) => ({ default: m.CatalogDataPage }))
);
const AdminSettingsPage = lazy(() =>
  import('@/admin-portal/pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const AdminAuditLogPage = lazy(() =>
  import('@/admin-portal/pages/auditLog/AuditLogPage').then((m) => ({ default: m.AuditLogPage }))
);

// Row-detail pages - one per domain, reached by clicking a table row instead
// of cramming every field into the list's columns (see DetailSection.jsx).
const AdminCatalogueDetailPage = lazy(() =>
  import('@/admin-portal/pages/catalogue/CatalogueDetailPage').then((m) => ({ default: m.CatalogueDetailPage }))
);
const AdminMemberDetailPage = lazy(() =>
  import('@/admin-portal/pages/members/MemberDetailPage').then((m) => ({ default: m.MemberDetailPage }))
);
const AdminLoanDetailPage = lazy(() =>
  import('@/admin-portal/pages/loans/LoanDetailPage').then((m) => ({ default: m.LoanDetailPage }))
);
const AdminFineDetailPage = lazy(() =>
  import('@/admin-portal/pages/overdues/FineDetailPage').then((m) => ({ default: m.FineDetailPage }))
);
const AdminStaffDetailPage = lazy(() =>
  import('@/admin-portal/pages/staff/StaffDetailPage').then((m) => ({ default: m.StaffDetailPage }))
);

// minRole for each admin route, read from the same NAV_ITEMS list the
// Sidebar filters against - one source of truth for "who can see this link"
// and "who can load this route" so the two can never drift apart.
const minRoleFor = (key: string): string => NAV_ITEMS.find((item) => item.key === key)!.minRole;

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export default function App() {
  const { isAuthenticated, user, login } = useAuthStore();
  const [booting, setBooting] = useState(true);
  const location = useLocation();
  // Guards against React StrictMode's dev-mode double-invocation of this effect,
  // which would otherwise fire two concurrent /auth/refresh requests on every page
  // load. The refresh token is single-use (rotated on each call), so a genuine
  // duplicate call is wasted at best and a source of unnecessary races at worst.
  //
  // `attempted` ensures the network call itself only ever fires once. `mounted` is
  // reset to true at the top of every effect invocation (including StrictMode's
  // second, "real" one) and only flipped false by a cleanup - so by the time the
  // one-and-only request resolves, it reflects the latest mount state rather than
  // the first (StrictMode-cancelled) invocation's, which would otherwise wrongly
  // block login()/setBooting(false) from ever running and hang on the loader.
  const attempted = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    if (!attempted.current) {
      attempted.current = true;
      (async () => {
        try {
          const res = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
          const token = res.data?.data?.accessToken as string | undefined;
          const sessionUser = res.data?.data?.user;
          if (mounted.current && token && sessionUser) login(sessionUser, token);
        } catch {
          // No valid session cookie - stay logged out.
        } finally {
          if (mounted.current) setBooting(false);
        }
      })();
    }

    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (booting) return <BrandLoader />;

  const homeRedirect = !isAuthenticated ? '/login' : isAdminRole(user?.role) ? '/admin' : '/student';

  return (
    <Suspense fallback={<RouteFallback />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname.split('/')[1] || 'root'}>
          <Route path="/login" element={<LoginPage />} />

          {/* Student Portal */}
          <Route
            path="/student"
            element={
              <RouteGuard requires="student">
                <StudentLayout />
              </RouteGuard>
            }
          >
            <Route index element={<StudentHomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="book/:id" element={<BookDetailPage />} />
            <Route path="loans" element={<MyLoansPage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>

          {/* Admin Portal */}
          <Route
            path="/admin"
            element={
              <RouteGuard requires="admin">
                <AdminAppShell />
              </RouteGuard>
            }
          >
            <Route
              index
              element={
                <AdminIndexRoute
                  librarianDashboard={<AdminLibrarianDashboardPage />}
                  administratorDashboard={<AdminAdministratorDashboardPage />}
                />
              }
            />
            <Route
              path="catalogue"
              element={
                <AdminRouteGuard minRole={minRoleFor('catalogue')}>
                  <AdminCataloguePage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="catalogue/:id"
              element={
                <AdminRouteGuard minRole={minRoleFor('catalogue')}>
                  <AdminCatalogueDetailPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="members"
              element={
                <AdminRouteGuard minRole={minRoleFor('members')}>
                  <AdminMembersPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="members/:id"
              element={
                <AdminRouteGuard minRole={minRoleFor('members')}>
                  <AdminMemberDetailPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="loans"
              element={
                <AdminRouteGuard minRole={minRoleFor('loans')}>
                  <AdminLoansPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="loans/:id"
              element={
                <AdminRouteGuard minRole={minRoleFor('loans')}>
                  <AdminLoanDetailPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="circulation"
              element={
                <AdminRouteGuard minRole={minRoleFor('circulation')}>
                  <AdminCirculationPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="overdues"
              element={
                <AdminRouteGuard minRole={minRoleFor('overdues')}>
                  <AdminOverduesPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="overdues/fines/:id"
              element={
                <AdminRouteGuard minRole={minRoleFor('overdues')}>
                  <AdminFineDetailPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="reservations"
              element={
                <AdminRouteGuard minRole={minRoleFor('reservations')}>
                  <AdminReservationsPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="maintenance"
              element={
                <AdminRouteGuard minRole={minRoleFor('maintenance')}>
                  <AdminMaintenancePage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="inventory"
              element={
                <AdminRouteGuard minRole={minRoleFor('inventory')}>
                  <AdminInventoryPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="inventory/:id"
              element={
                <AdminRouteGuard minRole={minRoleFor('inventory')}>
                  <AdminInventorySessionDetailPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="acquisitions"
              element={
                <AdminRouteGuard minRole={minRoleFor('acquisitions')}>
                  <AdminAcquisitionsPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="catalog-data"
              element={
                <AdminRouteGuard minRole={minRoleFor('catalog-data')}>
                  <AdminCatalogDataPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="reports"
              element={
                <AdminRouteGuard minRole={minRoleFor('reports')}>
                  <AdminReportsPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="staff"
              element={
                <AdminRouteGuard minRole={minRoleFor('staff')}>
                  <AdminStaffPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="staff/:id"
              element={
                <AdminRouteGuard minRole={minRoleFor('staff')}>
                  <AdminStaffDetailPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="settings"
              element={
                <AdminRouteGuard minRole={minRoleFor('settings')}>
                  <AdminSettingsPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="audit-log"
              element={
                <AdminRouteGuard minRole={minRoleFor('audit-log')}>
                  <AdminAuditLogPage />
                </AdminRouteGuard>
              }
            />
          </Route>

          <Route path="/" element={<Navigate to={homeRedirect} replace />} />
          <Route path="*" element={<Navigate to={homeRedirect} replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
