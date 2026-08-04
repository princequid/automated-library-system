# ALMS Frontend

The single React web application for the University **Automated Library Management
System**. One codebase renders **two** interfaces — a Student Portal and an Admin
Portal — chosen at runtime from the signed-in user's role. There is no mobile app.

**Stack:** React 18 · Vite 5 · TypeScript (strict) · React Router v6 · Tailwind CSS v3 · shadcn-style components on Radix · Zustand · TanStack Query v5 · Axios · React Hook Form + Zod · Recharts · Framer Motion · lucide-react.

---

## Prerequisites

- **Node.js 20 LTS**
- The **backend must already be running and seeded** — see the [backend README](../backend/README.md).
  Start it first (`npm run dev` in `../backend`, on port 3000).

## Setup

```bash
cp .env.example .env      # VITE_API_BASE_URL=http://localhost:3000/api/v1
npm install
npm run dev               # http://localhost:5173
```

### Two-terminal workflow

There is no Docker to orchestrate both processes, so run them in two terminals:

| Terminal | Directory   | Command       | Port |
|----------|-------------|---------------|------|
| 1        | `../backend`| `npm run dev` | 3000 |
| 2        | `./`        | `npm run dev` | 5173 |

The Vite dev server proxies `/api` to `http://localhost:3000` (see `vite.config.ts`),
so the httpOnly refresh cookie flows on a single origin during development.

Sign in with any seeded account (printed by the backend's `npm run db:seed`), e.g.
`admin@university.edu / Admin@1234` (Admin Portal) or `ama.mensah@st.university.edu
/ Student@123` (Student Portal).

## How the two interfaces work

There is one login page. `POST /api/v1/auth/login` returns `{ accessToken, user }`.
After login the app reads `user.role`:

- `role === 'STUDENT'` → redirect to `/student/*` (the Student Portal)
- any other role → redirect to `/admin/*` (the Admin Portal)

`RouteGuard` enforces this on every protected route client-side — but that is only a
UX safeguard. The backend's RBAC middleware is the real security boundary: a
student's token is rejected by admin endpoints regardless of what the client does.
The access token lives in Zustand **memory only** (never localStorage); the refresh
token is an httpOnly cookie the browser manages, used for silent 401 refresh.

## Scripts

```bash
npm run dev         # dev server
npm run build       # typecheck + production build
npm run typecheck   # tsc --noEmit
npm test            # Vitest (RouteGuard, Login, BookDetail, Circulation, Settings)
```

## Final walkthrough checklist

- [ ] Logging in as a seeded **student** lands on `/student` (top-nav shell), never the admin sidebar.
- [ ] Logging in as the seeded **admin** lands on `/admin` (sidebar shell), never the student top-nav.
- [ ] A student can search the catalog, open a book, and borrow it if eligible; the loan appears on **My loans** immediately.
- [ ] A student over their loan limit sees the exact backend reason text and cannot click **Borrow now**.
- [ ] Desk staff can complete the full 3-step **Issue** flow end-to-end.
- [ ] Every page's loading, empty, and error states have been checked (throttle the network or force an error).
- [ ] No page contains a hardcoded hex colour outside `globals.css`.
- [ ] No React Native / Expo / Reanimated imports anywhere.

## Project layout

```
src/
  components/ui/   button, card, badge, skeleton, input, select, switch, tabs, dialog,
                   dropdown-menu, tooltip, avatar, toast, data-table, field, states,
                   count-up, progress-ring, stat-card, page-transition
  components/      Brand, RouteGuard, shared (book cover / badges / page header)
  layouts/         StudentLayout (top nav), AdminLayout (grouped sidebar)
  pages/auth/      LoginPage
  pages/student/   Home, Search, BookDetail, MyLoans, Account
  pages/admin/     Dashboard, Circulation, Catalog, Users, Reservations, Fines, Analytics, Settings
  hooks/           api (all TanStack Query hooks), useAuth
  lib/             api (axios + interceptors), types, format, roles, utils, queryClient
  store/           auth.store (Zustand, in-memory token)
  styles/          globals.css (every design token; the only place hex values live)
```
