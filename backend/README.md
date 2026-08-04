# ALMS Backend

The backend for the University **Automated Library Management System** — a single
Express.js monolith serving **one** web app with **two** interfaces (a Student
Portal and an Admin Portal). One login endpoint returns a JWT whose role decides
which portal the frontend renders; RBAC enforces access on every route
server-side.

**Stack:** Node.js 20 · Express 4 · TypeScript (strict) · Prisma v5 · PostgreSQL 16 · Redis 7 · Zod · JWT + bcrypt · node-cron · Swagger/OpenAPI 3 · Jest + Supertest · Winston.

---

## 1. Prerequisites

You need these installed **locally**. **No Docker is required or used in this project.**

- **Node.js 20 LTS** — <https://nodejs.org>
- **PostgreSQL 16** (local install)
  - macOS: `brew install postgresql@16 && brew services start postgresql@16`
  - Ubuntu/Debian: `sudo apt install postgresql-16 && sudo systemctl start postgresql`
- **Redis 7** (local install) — *optional*; if it is not reachable the app logs a
  warning and falls back to an in-memory store so development still works.
  - macOS: `brew install redis && brew services start redis`
  - Ubuntu/Debian: `sudo apt install redis-server && sudo systemctl start redis`

Create the database once:

```bash
createdb alms      # or: psql -c "CREATE DATABASE alms;"
```

## 2. Setup

```bash
cp .env.example .env          # then fill in DATABASE_URL and REDIS_URL for your local instances
npm install
npx prisma migrate dev        # creates the schema
npm run db:seed               # loads settings, accounts, catalog, loans, holds, fines
npm run dev                   # starts on http://localhost:3000
```

`npm run db:seed` prints a table of every seeded login (email, role, password) so
you can sign in immediately and test both portals.

## 3. Verifying it works

```bash
curl http://localhost:3000/health
# -> {"status":"ok", ...}
```

- Open the interactive API docs: <http://localhost:3000/api/docs>
- Log in with a seeded admin account:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@university.edu","password":"Admin@1234"}'
```

The response includes `accessToken` and `user`. `user.role === 'STUDENT'` routes to
the Student Portal; any other role routes to the Admin Portal.

### Seeded logins

| Email                         | Role             | Password      |
|-------------------------------|------------------|---------------|
| admin@university.edu          | SUPER_ADMIN      | `Admin@1234`  |
| librarian@university.edu      | LIBRARIAN        | `Library@123` |
| desk@university.edu           | DESK_STAFF       | `Desk@1234`   |
| ama.mensah@st.university.edu  | STUDENT          | `Student@123` |
| *(5 students, IDs 20210045–49)* | STUDENT        | `Student@123` |

## 4. Architecture note (for a developer joining the project)

There is **one** web application and **one** login endpoint. A user — student or
staff — signs in with email + password against the `users` table. Every account
carries a `role`; on success the backend returns a JWT containing it. The frontend
reads that role to render the correct interface (`STUDENT` → Student Portal,
everything else → Admin Portal), but the frontend is only a UX convenience: the
backend independently enforces the boundary with RBAC middleware on every route, so
a student's token can never reach an admin endpoint even by manipulating the client.

## 5. Running tests

```bash
npm test
```

Unit tests mock Prisma and Redis (no live services needed) and cover auth,
eligibility, settings caching, catalog availability, circulation, the reservation
queue, and fines.

---

## Project layout

```
src/
  config/       env, logger, database (Prisma), redis (+fallback), jwt, swagger
  middleware/   errorHandler, requestLogger, rateLimit, auth, rbac, validate, auditLog
  shared/       appError, responseHelper, asyncHandler, csv, password, upload, email, types
  modules/      auth, users, settings, catalog, circulation, reservations, fines, analytics
                (each: controller, service, routes, test, dto/)
  jobs/         fineCalculation (hourly), holdExpiry (30m), dueDateReminder (daily 08:00)
  app.ts        middleware chain + router wiring
  server.ts     boot, DB/Redis connect, cron registration, graceful shutdown
prisma/
  schema.prisma  8 models: User, CatalogItem, Copy, Loan, Reservation, Fine, Setting, AuditLog
  seed.ts        realistic two-portal seed data
```

### Conventions

- One folder per module (`controller.ts` / `service.ts` / `routes.ts` / `*.test.ts` / `dto/`).
- Controllers are thin; all business logic lives in services.
- Cross-module calls go through exported service singletons, never direct table access.
- Standard response shape everywhere:
  `{ success: true, data, message, meta? }` / `{ success: false, error, details? }`.
- Throw `new AppError(message, statusCode)`; the error handler maps it.
- Mutating requests are captured by the audit middleware — no manual audit code in services.
