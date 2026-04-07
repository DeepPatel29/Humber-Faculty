# Faculty API Reference

Backend reference for **implemented** Next.js App Router handlers under `app/api/faculty/`. All responses use the shared envelope in [`lib/api-response.ts`](../lib/api-response.ts). Validation schemas live in [`lib/validations/faculty.ts`](../lib/validations/faculty.ts). Session resolution is in [`lib/auth-helpers.ts`](../lib/auth-helpers.ts).

---

## Base URL

| Environment | Base path |
|-------------|-----------|
| Local dev   | `http://localhost:3000/api/faculty` |
| Production  | `https://<your-host>/api/faculty` |

Replace `<your-host>` with your deployed origin. Individual paths below are relative to `/api/faculty`.

---

## Auth requirements

1. **Better Auth (primary)**  
   Valid session via `auth.api.getSession({ headers: request.headers })`. The client must send the same cookies / session headers your Better Auth setup expects (typically session cookie on same-site requests).

2. **Mock cookie (development only)**  
   If `ALLOW_MOCK_AUTH=true`, the API may accept a `faculty_session` cookie containing JSON: `{ id, name, email, role, facultyId? }`. This path is **not** for production.

3. **Role matrix (high level)**  
   - **STUDENT**: May call only the **canonical directory** endpoints: `GET /api/faculty` and `GET /api/faculty/[id]` (plus permission checks). All other routes under `/api/faculty/*` use `requireFacultyPortalAccess` and return **403** for students.  
   - **STAFF**: Faculty portal (dashboard, profile, timetable, requests, notifications, options, etc.) subject to per-route checks.  
   - **ADMIN**: Broad access; canonical CRUD; may approve/reject requests via `PUT /api/faculty/requests/[id]` when `requests:approve` applies.  
   - **SCHEDULER**: Blocked from `GET/PUT /api/faculty/requests/[id]` with explicit forbidden messages; otherwise follows portal rules where not restricted.

Exact permission keys are defined in [`lib/types/roles.ts`](../lib/types/roles.ts) (`PERMISSIONS`).

---

## Common response envelope

### Success

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

`data` shape varies by endpoint. `POST` creations that use `createdResponse` return **201** with the same envelope.

### Error

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Human-readable message",
    "details": {
      "field.path": ["Zod or validation message"]
    }
  }
}
```

`details` is omitted when empty. Validation failures typically use code **`BAD_REQUEST`** with `details` populated.

### Common error codes

| HTTP | `error.code`        | Typical cause |
|------|---------------------|---------------|
| 400  | `BAD_REQUEST`       | Invalid JSON, validation failure, business rule (e.g. withdraw non-pending) |
| 401  | `UNAUTHORIZED`      | No session |
| 403  | `FORBIDDEN`         | Role/permission, student on portal route, not owner |
| 404  | `NOT_FOUND`         | Missing faculty, request, notification, etc. |
| 409  | `CONFLICT`          | e.g. user already has faculty record (`POST /api/faculty`) |
| 500  | `INTERNAL_ERROR`    | Server/DB error |
| 503  | `SERVICE_UNAVAILABLE` | DB not available (`POST` swap/leave/reschedule) |

---

## Endpoint groups

1. **Canonical faculty (CRUD)** — list/create collection; get/update/delete by id  
2. **Dashboard** — aggregated home data  
3. **Profile** — self-service faculty + profile document  
4. **Availability** — preferences and days  
5. **Timetable** — schedules (full list, today, upcoming)  
6. **Requests** — list, detail, withdraw/approve/reject, create swap/leave/reschedule  
7. **Notifications** — list, pagination, unread count, mark read  
8. **Options** — dropdown data for classes and colleagues  

---

## 1. Canonical faculty (CRUD)

### `GET /api/faculty`

**Purpose:** Paginated list of faculty records with user and department.

**Auth:** Session required. Permission `faculty:read:list` (ADMIN, STAFF, STUDENT, SCHEDULER).

**Path params:** None.

**Query params** (validated by `facultyListQuerySchema`):

| Name   | Type    | Default | Description |
|--------|---------|---------|-------------|
| `page` | integer | 1       | Page number (positive) |
| `limit`| integer | 20      | Page size (max 100) |

**Request body:** None.

**Example request:**

```http
GET /api/faculty?page=1&limit=20
Cookie: <session>
```

**Example success (200):**

```json
{
  "success": true,
  "data": {
    "faculty": [
      {
        "id": "uuid",
        "userId": "uuid",
        "departmentId": "uuid",
        "employeeId": "EMP-001",
        "designation": "Professor",
        "joiningDate": "2024-01-15T00:00:00.000Z",
        "user": { "id": "uuid", "name": "...", "email": "...", "role": "STAFF" },
        "department": { "id": "uuid", "name": "...", "code": "...", "description": null }
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 20
  },
  "error": null
}
```

**Example error:** `401` unauthorized, `403` forbidden, `400` invalid query, `500` internal / DB not configured.

---

### `POST /api/faculty`

**Purpose:** Create a faculty row linked to an existing user, with empty profile.

**Auth:** `faculty:create` (ADMIN only).

**Body schema** (`createFacultyResourceSchema`):

| Field           | Type   | Required | Notes |
|-----------------|--------|----------|-------|
| `userId`        | string (uuid) | yes | Must exist in `User` |
| `departmentId`  | string (uuid) | yes | Must exist in `Department` |
| `employeeId`    | string | yes | 1–64 chars |
| `designation`   | string | yes | 1–200 chars |
| `joiningDate`   | string/date | no | Coerced date; defaults server-side to `new Date()` if omitted |

**Example request:**

```json
POST /api/faculty
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "departmentId": "660e8400-e29b-41d4-a716-446655440001",
  "employeeId": "EMP-1001",
  "designation": "Assistant Professor",
  "joiningDate": "2025-09-01"
}
```

**Example success (201):**

```json
{
  "success": true,
  "data": {
    "faculty": {
      "id": "uuid",
      "userId": "uuid",
      "departmentId": "uuid",
      "employeeId": "EMP-1001",
      "designation": "Assistant Professor",
      "joiningDate": "2025-09-01T00:00:00.000Z",
      "user": { "id": "...", "name": "...", "email": "...", "role": "STAFF" },
      "department": { ... },
      "profile": { ... }
    }
  },
  "error": null
}
```

**Example errors:** `400` user/department not found, `409` user already has faculty, `403`, `500`.

---

### `GET /api/faculty/[id]`

**Purpose:** Single faculty record with user, department, profile.

**Auth:** `faculty:read:one`.

**Path params:**

| Name | Description |
|------|-------------|
| `id` | Faculty UUID |

**Query / body:** None.

**Example success (200):** `data.faculty` with `joiningDate` as ISO string, nested `user`, `department`, `profile`.

**Example errors:** `404` faculty not found, `401`, `403`, `500`.

---

### `PUT /api/faculty/[id]`

**Purpose:** Partial update of core faculty fields (`departmentId`, `employeeId`, `designation`).

**Auth:** Must be logged in. **ADMIN** (`faculty:update:any`) may edit any id. **STAFF** with `faculty:update:own` may edit only when `session.facultyId === id`.

**Path params:** `id` — faculty UUID.

**Body schema** (`updateFacultyResourceSchema`) — all optional; send only fields to change:

| Field          | Type (uuid / string) |
|----------------|----------------------|
| `departmentId` | uuid |
| `employeeId`   | 1–64 chars |
| `designation`  | 1–200 chars |

**Example success (200):** Same shape as `GET` (`data.faculty`).

**Example errors:** `403` cannot update or wrong owner, `404`, `400` validation, `500`.

---

### `DELETE /api/faculty/[id]`

**Purpose:** Delete faculty row by id.

**Auth:** `faculty:delete` (ADMIN).

**Path params:** `id`.

**Example success (200):**

```json
{
  "success": true,
  "data": { "deleted": true, "id": "uuid" },
  "error": null
}
```

**Example errors:** `404`, `403`, `500`.

---

## 2. Dashboard

### `GET /api/faculty/dashboard`

**Purpose:** Dashboard payload: faculty summary, cards, today/upcoming schedule snippets, recent notifications, pending request count.

**Auth:** Logged in + `requireFacultyPortalAccess` (blocks STUDENT).

**Path / query / body:** None.

**Behavior:** Uses `ensureFacultyExists`; if DB missing or faculty cannot be resolved, returns a **200** fallback with empty schedules and placeholder-style summary (see implementation).

**Example success (200)** — abbreviated; real `todaySchedule` / `upcomingSchedule` items include `id`, `facultyId`, `courseId`, `roomId`, `courseName`, `courseCode`, `dayOfWeek`, `startTime`, `endTime`, `roomName`, `building`, `type`, `section`, `program`, `semester`, `academicYear`, `isActive`:

```json
{
  "success": true,
  "data": {
    "faculty": {
      "id": "uuid",
      "designation": "Professor",
      "user": { "name": "...", "email": "...", "avatarUrl": null },
      "department": { "name": "General" }
    },
    "summaryCards": [
      { "label": "Classes This Week", "value": 0, "change": 0, "changeLabel": "vs last week", "icon": "calendar" }
    ],
    "todaySchedule": [],
    "upcomingSchedule": [],
    "recentNotifications": [
      {
        "id": "uuid",
        "type": "REQUEST_UPDATE",
        "title": "...",
        "message": "...",
        "isRead": false,
        "link": "/faculty/requests",
        "createdAt": "2025-01-01T12:00:00.000Z"
      }
    ],
    "pendingRequests": 0
  },
  "error": null
}
```

**Example errors:** `401`, `403`, `500` on DB errors when DB is configured.

---

## 3. Profile

### `GET /api/faculty/profile`

**Purpose:** Current user’s faculty row (synthetic shape) + profile fields.

**Auth:** Logged in + faculty portal (not STUDENT).

**Requires DB:** Returns **`500`** `Database not configured` if `db` is null (no empty fallback).

**Example success (200):** `data.faculty` and `data.profile` with string/arrays for profile fields; `joiningDate` ISO string.

**Example errors:** `401`, `403`, `500`.

---

### `PUT /api/faculty/profile`

**Purpose:** Upsert `FacultyProfile` and optionally update `Faculty.designation`.

**Auth:** `profile:edit:own` + faculty portal.

**Body schema** (`updateProfileSchema`) — all optional:

| Field | Notes |
|-------|--------|
| `bio` | string, max 1000, or `null` |
| `phone` | regex `^[+]?[\d\s-()]+$`, or `null` |
| `officeLocation` | max 200, or `null` |
| `officeHours` | max 500, or `null` |
| `researchInterests` | string array, max 20 items, each max 100 chars |
| `qualifications` | max 10 items, each max 200 chars |
| `publications` | max 50 items, each max 500 chars |
| `socialLinks` | record of string → URL strings |
| `designation` | 1–200 chars; updates `Faculty` when present |

**Example request:**

```json
{
  "bio": "Teaching databases.",
  "officeHours": "Mon 2-4pm",
  "researchInterests": ["Databases", "Distributed systems"]
}
```

**Example success (200):** Same structure as `GET /api/faculty/profile`.

**Example errors:** `400` could not resolve faculty, `403`, `500`.

---

## 4. Availability

### `GET /api/faculty/availability`

**Purpose:** Load or create default `FacultyAvailability` + days; includes static `allCourses` and `eligibleCourseIds` from handler.

**Auth:** Logged in + faculty portal.

**Note:** When DB is unavailable, response is still **200** with a default day list and `facultyId` set to the **user id** (not faculty id)—see [Gaps / inconsistencies](#gaps-and-inconsistencies).

**Example success (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "facultyId": "uuid",
    "preferredSlot": "ANY",
    "customStartTime": "09:00",
    "customEndTime": "17:00",
    "unavailableStart": null,
    "unavailableEnd": null,
    "notes": "",
    "days": [
      {
        "id": "uuid",
        "availabilityId": "uuid",
        "dayOfWeek": "MONDAY",
        "isAvailable": true
      }
    ],
    "allCourses": [{ "id": "c1", "name": "Machine Learning", "code": "CS501" }],
    "eligibleCourseIds": []
  },
  "error": null
}
```

`preferredSlot` values: `MORNING` | `AFTERNOON` | `EVENING` | `ANY`.  
`dayOfWeek`: `MONDAY` … `SUNDAY` (Prisma `DayOfWeek`).

---

### `PUT /api/faculty/availability`

**Purpose:** Upsert availability; optionally upsert per-day flags; optionally create a pending `RESCHEDULE` faculty request when `submitAsRequest` is true.

**Auth:** `availability:edit:own` + faculty portal.

**Body schema** (`updateAvailabilityBodySchema`) — all optional:

| Field | Notes |
|-------|--------|
| `preferredSlot` | enum as above |
| `customStartTime`, `customEndTime` | `HH:MM`; start must be before end if both set |
| `unavailableStart`, `unavailableEnd` | same |
| `notes` | max 500, nullable |
| `days` | `{ dayOfWeek, isAvailable }[]` — upserted per day when non-empty |
| `submitAsRequest` | boolean — creates `FacultyRequest` with type `RESCHEDULE` |

**Example success (200):** Same fields as GET plus optional `message`: `"Availability saved"` or `"Availability update request submitted for admin approval"`.

**Example errors:** `500` DB not configured, could not resolve faculty, `400` validation.

---

## 5. Timetable

### `GET /api/faculty/timetable`

**Purpose:** All active schedule rows for the logged-in faculty, optional filter by course code.

**Auth:** Logged in + faculty portal.

**Query params** (ad hoc, **not** the full `timetableQuerySchema` from validations):

| Name         | Description |
|--------------|-------------|
| `courseCode` | If set, filters `course.code` exact match |

**Example success (200):** `data` is an **array** of schedule DTOs (same flattened shape as dashboard schedule items). Empty array if no DB or no faculty.

**Example errors:** `401`, `403`, `500` on DB failure.

---

### `GET /api/faculty/timetable/today`

**Purpose:** Today’s active classes (server local weekday → Prisma `DayOfWeek`).

**Auth:** Logged in + faculty portal.

**Example success (200):** `data` is an array of schedule DTOs.

---

### `GET /api/faculty/timetable/upcoming`

**Purpose:** Upcoming schedule rows, ordered by day then time, capped by `limit`.

**Query params:**

| Name   | Default | Max |
|--------|---------|-----|
| `limit` | 10 | 50 |

**Auth:** Logged in + faculty portal.

**Example success (200):** `data` is array of objects with `id`, `courseCode`, `courseName`, `dayOfWeek`, `startTime`, `endTime`, `roomName`, `building`, `type`, `section`, `program`, `semester` (nullable fields as stored).

---

## 6. Requests

### `GET /api/faculty/requests`

**Purpose:** List current faculty’s requests with timeline, newest first.

**Auth:** Logged in + faculty portal.

**Query params** (`requestsQuerySchema` — validated, but see [gaps](#gaps-and-inconsistencies)):

| Name     | Type | Default | Notes |
|----------|------|---------|--------|
| `status` | `PENDING` \| `APPROVED` \| `REJECTED` \| `WITHDRAWN` | optional | **Applied** in DB query |
| `type`   | `SWAP` \| `RESCHEDULE` \| `LEAVE` | optional | Validated only; **not** applied in code |
| `page`   | int  | 1       | Validated only; **not** applied (no skip/take) |
| `limit`  | int  | 20      | Validated only; **not** applied |

**Example success (200):**

```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "uuid",
        "facultyId": "uuid",
        "type": "LEAVE",
        "status": "PENDING",
        "title": "...",
        "description": "...",
        "requestDate": "2025-01-01T12:00:00.000Z",
        "effectiveDate": "2025-01-10T00:00:00.000Z",
        "endDate": "2025-01-12T00:00:00.000Z",
        "reason": "...",
        "targetFacultyId": null,
        "targetScheduleId": null,
        "newDate": null,
        "newStartTime": null,
        "newEndTime": null,
        "timeline": [
          {
            "id": "uuid",
            "requestId": "uuid",
            "status": "PENDING",
            "comment": "...",
            "createdAt": "2025-01-01T12:00:00.000Z",
            "createdBy": "Name"
          }
        ]
      }
    ],
    "total": 1,
    "userRole": "STAFF"
  },
  "error": null
}
```

---

### `GET /api/faculty/requests/[id]`

**Purpose:** Single request with timeline.

**Auth:** Logged in. **STUDENT** → 403. **SCHEDULER** → 403. **STAFF** only if `existing.facultyId === session.facultyId`. **ADMIN** allowed.

**Path params:** `id` — request UUID.

**Example success (200):** `data` is the **serialized request object itself** (same fields as list item), **not** wrapped as `{ request: ... }`.

**Example errors:** `404`, `403`, `401`, `500`.

---

### `PUT /api/faculty/requests/[id]`

**Purpose:** Update status (withdraw, approve, reject) and append timeline row.

**Auth:** Logged in. STUDENT/SCHEDULER cannot modify.

**Body schema** (`patchFacultyRequestByIdSchema`):

| Field    | Required | Notes |
|----------|----------|-------|
| `status` | yes | `PENDING` \| `APPROVED` \| `REJECTED` \| `WITHDRAWN` |
| `comment`| no | max 1000 |

**Rules:**

- **STAFF** (owner): may set only **`WITHDRAWN`**, and only if current status is **`PENDING`**.
- **APPROVED** / **REJECTED**: requires `requests:approve` (**ADMIN**). Creates a faculty notification on success.

**Example request:**

```json
{
  "status": "WITHDRAWN",
  "comment": "No longer needed"
}
```

**Example success (200):** Same shape as GET detail (`data` = serialized request).

**Example errors:** `400` invalid transition, `403`, `404`, `500`.

---

### `POST /api/faculty/requests/swap`

**Purpose:** Create `SWAP` request + timeline + notification.

**Auth:** `requests:create` (STAFF) + faculty portal.

**Body** (`createSwapRequestSchema`):

| Field | Type |
|-------|------|
| `targetFacultyId` | uuid |
| `targetScheduleId` | uuid |
| `myScheduleId` | uuid (stored in description text, not a separate column) |
| `effectiveDate` | `YYYY-MM-DD` |
| `reason` | 10–1000 chars |

**Example success (201):** `data` is the Prisma `FacultyRequest` create result including `timeline` (Date fields JSON-serialized to ISO strings).

**Example errors:** `404` faculty record, `503` DB unavailable, `400`, `403`, `500`.

---

### `POST /api/faculty/requests/leave`

**Purpose:** Create `LEAVE` request.

**Body** (`createLeaveRequestSchema`):

| Field | Type |
|-------|------|
| `effectiveDate` | `YYYY-MM-DD` |
| `endDate` | `YYYY-MM-DD` (≥ effectiveDate) |
| `reason` | 10–1000 chars |

**Example success (201):** Full created request + timeline.

---

### `POST /api/faculty/requests/reschedule`

**Purpose:** Create `RESCHEDULE` request; `scheduleId` maps to `targetScheduleId`.

**Body** (`createRescheduleRequestSchema`):

| Field | Type |
|-------|------|
| `scheduleId` | uuid |
| `newDate` | `YYYY-MM-DD` |
| `newStartTime` | `HH:MM` |
| `newEndTime` | `HH:MM` (after start) |
| `reason` | 10–1000 chars |

**Example success (201):** Full created request + timeline.

---

## 7. Notifications

### `GET /api/faculty/notifications`

**Purpose:** Paginated notifications + total + global unread count for faculty.

**Auth:** Logged in + faculty portal.

**Query** (`notificationsQuerySchema`):

| Name         | Type    | Default | Description |
|--------------|---------|---------|-------------|
| `unreadOnly` | boolean | false   | Filter list + total count |
| `page`       | int     | 1       | |
| `limit`      | int     | 20      | max 100 |

**Example success (200):**

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "REQUEST_UPDATE",
        "title": "...",
        "message": "...",
        "isRead": false,
        "link": "/faculty/requests",
        "createdAt": "2025-01-01T12:00:00.000Z"
      }
    ],
    "total": 10,
    "unreadCount": 3
  },
  "error": null
}
```

`unreadCount` is always unread across all notifications, not only the current page.

---

### `PUT /api/faculty/notifications/read-all`

**Purpose:** Mark all notifications for the faculty as read.

**Auth:** Logged in + faculty portal.

**Body:** None.

**Example success (200):**

```json
{
  "success": true,
  "data": { "message": "All marked as read" },
  "error": null
}
```

---

### `GET /api/faculty/notifications/unread-count`

**Purpose:** Unread notification count.

**Auth:** Logged in + faculty portal.

**Example success (200):** `{ "count": 3 }` inside `data`.

---

### `PUT /api/faculty/notifications/[id]/read`

**Purpose:** Mark one notification read.

**Auth:** Logged in + faculty portal.

**Path params:** `id` — notification UUID.

**Example success (200):** `{ "message": "Marked as read" }`.

**Example errors:** `404` notification not found for this faculty, `500` DB not configured.

---

## 8. Options

### `GET /api/faculty/classes/options`

**Purpose:** Active schedule slots for swap/reschedule UIs.

**Auth:** Logged in + faculty portal.

**Example success (200):**

```json
{
  "success": true,
  "data": {
    "classes": [
      {
        "id": "schedule-uuid",
        "courseId": "uuid",
        "courseName": "...",
        "courseCode": "...",
        "dayOfWeek": "MONDAY",
        "startTime": "09:00",
        "endTime": "10:30",
        "room": "Building RoomName"
      }
    ]
  },
  "error": null
}
```

---

### `GET /api/faculty/colleagues/options`

**Purpose:** Other faculty (STAFF/ADMIN users) for swap target picker.

**Auth:** Logged in + faculty portal.

**Example success (200):**

```json
{
  "success": true,
  "data": {
    "colleagues": [
      {
        "id": "faculty-uuid",
        "name": "...",
        "email": "...",
        "designation": "...",
        "department": "...",
        "avatarUrl": null
      }
    ]
  },
  "error": null
}
```

`avatarUrl` comes from `user.image`.

---

## Postman testing

1. Create an environment with `baseUrl` = `http://localhost:3000` (or your deployed URL).
2. **Better Auth:** Log in through your app or auth flow, then use Postman’s cookie jar or Chrome interceptor so requests send the session cookie to `{{baseUrl}}`.
3. **Mock (local only):** Set `ALLOW_MOCK_AUTH=true`, add Cookie header `faculty_session={"id":"...","name":"...","email":"...","role":"STAFF","facultyId":"<faculty-uuid>"}` (JSON minified, URL-encoded as needed).
4. For `POST`/`PUT`, set `Content-Type: application/json`.
5. Use **Tests** tab to assert `pm.response.json().success === true` and status codes listed per route.

---

## Quick examples (cURL)

Replace cookies and IDs.

```bash
# List faculty (directory)
curl -s "{{baseUrl}}/api/faculty?page=1&limit=10" -b "cookies.txt"

# Dashboard
curl -s "{{baseUrl}}/api/faculty/dashboard" -b "cookies.txt"

# Withdraw request
curl -s -X PUT "{{baseUrl}}/api/faculty/requests/<requestId>" \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{"status":"WITHDRAWN","comment":"Withdrawing"}'
```

---

## Route inventory summary

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/faculty` | List faculty (paginated) |
| POST | `/api/faculty` | Create faculty |
| GET | `/api/faculty/[id]` | Get faculty by id |
| PUT | `/api/faculty/[id]` | Update faculty by id |
| DELETE | `/api/faculty/[id]` | Delete faculty by id |
| GET | `/api/faculty/dashboard` | Dashboard aggregate |
| GET | `/api/faculty/profile` | Current profile |
| PUT | `/api/faculty/profile` | Update profile |
| GET | `/api/faculty/availability` | Get availability |
| PUT | `/api/faculty/availability` | Update availability |
| GET | `/api/faculty/timetable` | Timetable (optional `courseCode`) |
| GET | `/api/faculty/timetable/today` | Today’s classes |
| GET | `/api/faculty/timetable/upcoming` | Upcoming classes (`limit`) |
| GET | `/api/faculty/requests` | List my requests |
| GET | `/api/faculty/requests/[id]` | Request detail |
| PUT | `/api/faculty/requests/[id]` | Update request status |
| POST | `/api/faculty/requests/swap` | Create swap request |
| POST | `/api/faculty/requests/leave` | Create leave request |
| POST | `/api/faculty/requests/reschedule` | Create reschedule request |
| GET | `/api/faculty/notifications` | List notifications |
| PUT | `/api/faculty/notifications/read-all` | Mark all read |
| GET | `/api/faculty/notifications/unread-count` | Unread count |
| PUT | `/api/faculty/notifications/[id]/read` | Mark one read |
| GET | `/api/faculty/classes/options` | Class dropdown options |
| GET | `/api/faculty/colleagues/options` | Colleague dropdown options |

**Total implemented operations documented: 27**

---

## Gaps and inconsistencies

1. **`GET /api/faculty/requests`:** `type`, `page`, and `limit` are validated but **not** used in the Prisma query; only `status` filters. `total` is the length of the returned array, not a separate count query.
2. **`GET /api/faculty/timetable`:** `timetableQuerySchema` in validations (`weekStart`, `program`, `view`, etc.) is **not** wired to this route; only `courseCode` is read manually.
3. **Request detail shape:** `GET`/`PUT /api/faculty/requests/[id]` return the request DTO as **`data` root**, unlike list responses that use `data.requests[]`.
4. **`GET /api/faculty/availability` (no DB):** `facultyId` in the fallback uses **`user.id`**, not the faculty primary key—differs from DB-backed responses.
5. **Dashboard:** Some summary card values are derived heuristically (e.g. student count from schedule count); treat as UI-oriented, not authoritative reporting.
6. **Availability `allCourses`:** Populated from a **static in-file list** in the route handler, not Prisma.

---

## Planned / not implemented (under `/api/faculty`)

The following are **not** present as working routes in this codebase (do not call them expecting 200):

- Dedicated **PATCH** handler for `/api/faculty/requests/[id]` (only **PUT** exists).
- Timetable filtering by **`weekStart`**, **`program`**, **`view`** as defined in `timetableQuerySchema` (schema exists; route does not use it).
- Server-side **pagination** for `GET /api/faculty/requests` matching the validated `page`/`limit`.
- **`GET /api/faculty/requests` filtered by `type`** despite query validation accepting `type`.

Admin-only listing at **`GET /api/admin/faculty`** is outside this document’s scope (not under `/api/faculty`).

---

*Generated from repository route handlers and shared helpers. Re-run an audit after adding or changing `app/api/faculty/**`.*
