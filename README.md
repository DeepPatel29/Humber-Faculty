# FacultyHub - Faculty Management Portal

A modern **faculty management portal** built with Next.js 16, React 19, TypeScript, and PostgreSQL (Neon). Manage timetables, availability, requests, and notifications all in one place.

## Team Members

- Deep
- Kiran
- Taslimabanu
- Nidhi
- Jashan

## Project Overview

The Faculty module is the backend slice of a **College Scheduling System**. It stores who faculty are (linked to authenticated users and departments), how they can be reached and what they teach, their **availability** preferences, their **class timetable** data, **scheduling-related requests** (swap, reschedule, leave), and **in-app notifications**.

It solves the problem of giving the college a **single, consistent API** for faculty records and faculty-facing operations, so other parts of the system—admin tools, scheduler views, and future student or reporting modules—can rely on the same data model and permission rules instead of duplicating logic.

## Features Completed So Far

| Area                    | What exists in the codebase                                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Data model**          | Prisma schema with `Faculty`, `FacultyProfile`, `FacultySchedule`, `FacultyAvailability` (+ day rows), `FacultyRequest` (+ timeline), `FacultyNotification`, and supporting models (`User`, `Department`, `Course`, `Room`) aligned with Better Auth tables                                                                                                  |
| **Database access**     | Prisma Client (`lib/db.ts`); optional `neon()` SQL helper from `@neondatabase/serverless` when `DATABASE_URL` is set                                                                                                                                                                                                                                         |
| **Canonical CRUD**      | `GET`/`POST` on `/api/faculty` and `GET`/`PUT`/`DELETE` on `/api/faculty/[id]` with pagination on list, validation, and permission checks                                                                                                                                                                                                                    |
| **Faculty portal APIs** | Dashboard, profile (`GET`/`PUT`), availability (`GET`/`PUT`), timetable (`GET` plus `today` and `upcoming`), requests list and detail (`GET`/`PUT` on detail), typed request creation (`POST` swap / reschedule / leave), notifications list and mark read / read-all / unread count                                                                         |
| **Supporting reads**    | `GET` class and colleague **options** endpoints for faculty UI flows                                                                                                                                                                                                                                                                                         |
| **Admin**               | `GET /api/admin/faculty` — admin-only summarized faculty list for management views                                                                                                                                                                                                                                                                           |
| **Auth**                | Better Auth with Prisma adapter (`lib/auth.ts`), session resolution in API routes via `getSessionUser`                                                                                                                                                                                                                                                       |
| **RBAC**                | Central permission map in `lib/types/roles.ts` and helpers in `lib/auth-helpers.ts` (`requirePermission`, `requireRole`, `requireFacultyPortalAccess`); optional dev-only mock cookie when `ALLOW_MOCK_AUTH=true`                                                                                                                                            |
| **Validation**          | Zod schemas in `lib/validations/faculty.ts` for CRUD bodies, queries, profile, availability, requests, notifications                                                                                                                                                                                                                                         |
| **Typing**              | TypeScript throughout; shared domain types in `lib/types/faculty.ts` and role types in `lib/types/roles.ts`                                                                                                                                                                                                                                                  |
| **API shape**           | Consistent JSON envelope in `lib/api-response.ts` (`success`, `data`, `error` with `code` / `message` / optional `details`)                                                                                                                                                                                                                                  |
| **Testing**             | Playwright in `devDependencies`; `tests/rbac.spec.ts` covers route protection and signup flows involving `/faculty/dashboard` (not a dedicated REST test suite for every Faculty endpoint). Faculty APIs were also checked with **Postman** or **Thunder Client** using valid requests, invalid input, unauthenticated calls, and role-restricted scenarios. |

## Tech Stack

- **Runtime / framework:** Node.js, **Next.js 16** (App Router API routes)
- **Language:** **TypeScript**
- **ORM / DB:** **Prisma 6**, **PostgreSQL** via `DATABASE_URL` (schema and comments target **Neon**; `@neondatabase/serverless` is used for the optional `neon` SQL client)
- **Auth:** **Better Auth** with Prisma adapter
- **Validation:** **Zod**
- **E2E (project-level):** **Playwright**

## Database Design

Important **Faculty-related** models and their roles:

| Model                     | Purpose                                                                                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`Faculty`**             | Core record: links a `User` to a `Department`, with `employeeId`, `designation`, `joiningDate`; anchor for profile, schedule, availability, requests, and notifications |
| **`FacultyProfile`**      | Extended directory/academic info: bio, contact, office, research, qualifications, publications, `socialLinks` (JSON)                                                    |
| **`FacultySchedule`**     | Scheduled teaching (or similar) items: course, room, day, times, type, section/program, semester, academic year, `isActive`                                             |
| **`FacultyAvailability`** | Preferred slot, optional custom/unavailable time windows, notes; **`FacultyAvailabilityDay`** stores per–day-of-week availability flags                                 |
| **`FacultyRequest`**      | Swap / reschedule / leave requests with status, dates, targets, and reason; **`FacultyRequestTimeline`** records status history                                         |
| **`FacultyNotification`** | In-app messages (type, title, body, read flag, optional link)                                                                                                           |

Shared scheduling context uses **`Department`**, **`Course`**, and **`Room`**, which tie into `FacultySchedule` for integration with broader scheduling data.

Schema changes were applied to the Neon database with **`prisma migrate`** and/or **`prisma db push`** so the live database stays in step with `schema.prisma`.

## API Endpoints

### Main Faculty CRUD (canonical resource)

| Method   | Path                | Description                                                                                                 |
| -------- | ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/faculty`      | Paginated list of faculty (query: `page`, `limit`), with user and department included                       |
| `POST`   | `/api/faculty`      | Create a faculty row for an existing user and department; creates an empty profile                          |
| `GET`    | `/api/faculty/[id]` | Single faculty by id with user, department, and profile                                                     |
| `PUT`    | `/api/faculty/[id]` | Update department, employee id, and/or designation (admin can update any; staff can update own record only) |
| `DELETE` | `/api/faculty/[id]` | Remove a faculty record                                                                                     |

### Additional Faculty-specific endpoints

| Method        | Path                                      | Role / notes (high level)                                                                                                                                                                 |
| ------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`         | `/api/faculty/dashboard`                  | Authenticated faculty-portal users (not students on portal sub-APIs)                                                                                                                      |
| `GET` / `PUT` | `/api/faculty/profile`                    | Own profile read/update (permission-gated)                                                                                                                                                |
| `GET` / `PUT` | `/api/faculty/availability`               | Own availability read/update                                                                                                                                                              |
| `GET`         | `/api/faculty/timetable`                  | Timetable query params validated via Zod                                                                                                                                                  |
| `GET`         | `/api/faculty/timetable/today`            | Today’s items for the logged-in faculty member                                                                                                                                            |
| `GET`         | `/api/faculty/timetable/upcoming`         | Upcoming items                                                                                                                                                                            |
| `GET`         | `/api/faculty/requests`                   | List requests (query filters for status/type/pagination)                                                                                                                                  |
| `GET` / `PUT` | `/api/faculty/requests/[id]`              | Request detail; `PUT` updates status (staff may **withdraw** own **pending** requests; admins may **approve** or **reject**, with timeline entries and optional notification on decision) |
| `POST`        | `/api/faculty/requests/swap`              | Create swap request                                                                                                                                                                       |
| `POST`        | `/api/faculty/requests/reschedule`        | Create reschedule request                                                                                                                                                                 |
| `POST`        | `/api/faculty/requests/leave`             | Create leave request                                                                                                                                                                      |
| `GET`         | `/api/faculty/notifications`              | Paginated notifications                                                                                                                                                                   |
| `PUT`         | `/api/faculty/notifications/read-all`     | Mark all read                                                                                                                                                                             |
| `PUT`         | `/api/faculty/notifications/[id]/read`    | Mark one read                                                                                                                                                                             |
| `GET`         | `/api/faculty/notifications/unread-count` | Unread count                                                                                                                                                                              |
| `GET`         | `/api/faculty/classes/options`            | Options payload for class-related UI                                                                                                                                                      |
| `GET`         | `/api/faculty/colleagues/options`         | Colleague options for requests/UI                                                                                                                                                         |
| `GET`         | `/api/admin/faculty`                      | **Admin only** — compact faculty list for admin screens                                                                                                                                   |

## Authentication and Authorization

- **Better Auth** is configured in `lib/auth.ts` with email/password, session cookies, and the **Prisma adapter** against the same database as the app. API routes call `auth.api.getSession` through **`getSessionUser`** in `lib/auth-helpers.ts`, which also loads the caller’s **`facultyId`** when a `Faculty` row exists for that user.
- **Role-based access** is implemented with the `AppRole` enum in Prisma (`ADMIN`, `STAFF`, `STUDENT`, `SCHEDULER`) and an explicit **`PERMISSIONS`** map in `lib/types/roles.ts`. Handlers use **`requirePermission`**, **`requireRole`**, or **`requireFacultyPortalAccess`** so, for example, students can use directory-style faculty reads but are blocked from faculty-portal mutation APIs, while only **ADMIN** can create or delete canonical faculty resources.
- For local experimentation only, **`ALLOW_MOCK_AUTH=true`** enables a **`faculty_session`** cookie path documented in code—not for production.

## Validation and Error Handling

- **Zod** validates request bodies and query strings (e.g. `parseRequestBody`, `parseQueryParams` in `lib/api-response.ts` wired to schemas in `lib/validations/faculty.ts`). Failed validation returns **400** with a **`details`** map of field messages.
- Success and error responses use the same structure: **`{ success, data, error }`**, with errors carrying **`code`** (e.g. `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`) and a human-readable **`message`**. Route handlers wrap Prisma work in **try/catch**, log with `console.error`, and return **`internalErrorResponse`** on unexpected failures.

## Current Status

**Phase 1** for the Faculty backend is in place: the **Prisma model layer**, **Neon-friendly PostgreSQL connection**, **Better Auth–backed sessions**, **RBAC-aligned Faculty and portal routes**, **Zod validation**, **typed responses**, and **canonical CRUD** under `/api/faculty` and `/api/faculty/[id]` are implemented and wired together.

Remaining polish visible in code includes reliance on a valid **`DATABASE_URL`** (features degrade with clear responses when the DB client is unavailable) and **Better Auth** initialization that can be skipped if setup fails—those are operational constraints rather than missing Faculty features.

## Team Task Distribution

| Member      | Contribution focus                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Deep**    | Database design and Prisma schema for Faculty and related entities; alignment with Better Auth tables and enums                                   |
| **Kiran**   | Canonical Faculty **CRUD** API routes (`/api/faculty`, `/api/faculty/[id]`), Prisma queries, pagination, and conflict checks with user/department |
| **Taslima** | Faculty portal APIs: profile, availability, timetable, dashboard; integration with `ensureFacultyExists` and option endpoints                     |
| **Nidhi**   | Requests and notifications sub-APIs, timeline behavior, and admin faculty listing route                                                           |
| **Jashan**  | Authentication helpers, RBAC permission matrix, Zod schemas and shared API response helpers; Playwright/RBAC documentation support                |

---

## How to Push the Database

This project uses **Prisma** with a **Neon PostgreSQL** database. The database connection is already configured in the `.env` file.

### Prerequisites

1. Ensure you have the Neon database URL in your `.env` file:

   ```
   DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

### Database Commands

```bash
# Generate Prisma Client (run after schema changes)
npm run db:generate

# Push schema to database (creates/updates tables)
npm run db:push

# Seed the database with sample data (optional)
npm run db:seed

# Open Prisma Studio (visual database browser)
npm run db:studio
```

### Recommended Workflow

```bash
# Step 1: Generate the Prisma client
npm run db:generate

# Step 2: Push schema to database
npm run db:push

# Step 3: Seed with sample data (optional)
npm run db:seed
```

### Troubleshooting

If you encounter permission errors with Neon:

- **Option 1**: Create a new branch in Neon dashboard (gives fresh database with full permissions)
- **Option 2**: Request write access to the `public` schema in Neon console settings

---

## How to Test the App

### Running the Development Server

```bash
# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Test Accounts

You can use these test credentials to log in:

| Role      | Email                    | Password    |
| --------- | ------------------------ | ----------- |
| Admin     | admin@university.edu     | password123 |
| Faculty   | faculty@university.edu   | password123 |
| Scheduler | scheduler@university.edu | password123 |

### Running Tests

```bash
# Run Playwright tests
npx playwright test

# Run tests with UI
npx playwright test --ui

# Run a specific test file
npx playwright test tests/rbac.spec.ts
```

### Building for Production

```bash
# Build the production version
npm run build

# Start production server
npm run start
```

### Type Checking

```bash
# Run TypeScript type check
npm run typecheck
```

### Linting

```bash
# Run ESLint
npm run lint
```

---

## Conclusion

The **Faculty module backend** delivers a coherent **Phase 1** foundation: persisted faculty data, secured APIs, and portal operations that other modules and a future frontend can consume through the documented endpoints and response contract.
