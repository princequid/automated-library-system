# Automated Library Management System (ALMS)

A university library system built as **one web application with two role-driven
interfaces** — a **Student Portal** and an **Admin Portal** — served by a single
Express backend. Students and staff sign in through the *same* login endpoint; the
role inside the returned JWT decides which interface renders, and RBAC enforces that
boundary on every route server-side.

> No mobile app · No SSO/OIDC · No Docker. Everything is web, running on the host.

## Repository layout

```
automated-library-system/
├── backend/     Node 20 · Express 4 · TypeScript · Prisma v5 · PostgreSQL 16 · Redis 7
└── frontend/    React 18 · Vite 5 · TypeScript · Tailwind · Radix/shadcn · Framer Motion
```

Each has its own README with full setup instructions:

- **[backend/README.md](backend/README.md)** — prerequisites, DB/Redis setup, seed, API docs at `/api/docs`.
- **[frontend/README.md](frontend/README.md)** — setup, the two-terminal dev workflow, walkthrough checklist.

## Quick start

Run in two terminals (no Docker to orchestrate them):

```bash
# Terminal 1 — backend (port 3000)
cd backend
cp .env.example .env         # fill DATABASE_URL / REDIS_URL for local Postgres/Redis
npm install
npx prisma migrate dev
npm run db:seed              # prints every seeded login
npm run dev

# Terminal 2 — frontend (port 5173)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Then open <http://localhost:5173> and sign in:

| Portal  | Email                          | Password      |
|---------|--------------------------------|---------------|
| Admin   | `admin@university.edu`         | `Admin@1234`  |
| Admin   | `librarian@university.edu`     | `Library@123` |
| Admin   | `desk@university.edu`          | `Desk@1234`   |
| Student | `ama.mensah@st.university.edu` | `Student@123` |

## The architecture in one paragraph

One login endpoint (`POST /api/v1/auth/login`) verifies an email + bcrypt password
against the `users` table and returns a JWT carrying the account's role. The frontend
reads that role to render the Student Portal (`STUDENT`) or the Admin Portal (every
other role), and a `RouteGuard` keeps each population on its own side — but this is
only a UX convenience. The backend independently enforces access with RBAC middleware
on every route, so the security boundary never depends on the client. Availability,
fines, and holds stay consistent because circulation, catalog, reservations, and
settings all flow through shared service singletons (`updateAvailableCopies`,
`promoteQueue`, `checkEligibility`, `settingsService`) rather than duplicating logic.

## Feature map

- **Auth** — single login, refresh-token rotation, lockout after 5 failed attempts, password change.
- **Users** — provisioning with one-time temp passwords, CSV bulk student import, eligibility.
- **Settings** — cached singleton for fine rates, loan limits, and the `self_service_borrowing_enabled` master switch.
- **Catalog** — search, ISBN lookup (Open Library), copies, CSV import.
- **Circulation** — desk issue/return/renew **and** student self-borrow; overdue fines on return.
- **Reservations** — holds queue with automatic promotion when a copy frees up.
- **Fines** — manual entry, waivers (with reason), student payment.
- **Analytics** — dashboard stats plus loan-volume, overdue-rate, and department charts.
- **Jobs** — hourly fine accrual, 30-minute hold expiry, daily due-date reminders.

## Tests

```bash
cd backend  && npm test     # 41 tests (auth, eligibility, settings, catalog, circulation, reservations, fines)
cd frontend && npm test     # 15 tests (RouteGuard, Login, BookDetail, Circulation, Settings, formatting)
```
