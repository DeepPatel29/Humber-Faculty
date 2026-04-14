# Programs API — quick reference

**Base URL:** use your deployed server (example: `https://your-host.example.com`). All paths below are relative to that base.

**Auth:** Sign in with `POST /api/auth/login` or `POST /api/auth/register`. The server sets an HTTP-only cookie named **`programs_session`**. Send that cookie on later requests (typical browser behavior). There is no API-key header in this app.

**Format:** Use `Content-Type: application/json` for bodies. Responses are JSON unless noted.

**Roles:** Users are **`ADMIN`** or **`STAFF`**.

- **Read** most data (`GET`), and **update** departments/programs/semesters/terms (`PUT`): any signed-in user.
- **Create** or **delete** departments, programs, calendar semesters, or term links: **`ADMIN` only**.
- **Courses:** **`GET` / `POST` / `PUT`**: any signed-in user. **`DELETE` course**: **`ADMIN` only**.
- **Permission requests:** **`STAFF`** can submit; **`ADMIN`** reviews.

If you are not logged in → **401**. If your role is not allowed → **403**.

More detail on bodies and errors: **[docs/API_SPECIFICATION.md](docs/API_SPECIFICATION.md)** (if included with the project).

---

## Authentication

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/auth/register` | Sign up. First user in the database becomes admin. Sets session cookie. |
| POST | `/api/auth/login` | Email + password. Sets session cookie. |
| POST | `/api/auth/logout` | Clears session. |
| GET | `/api/auth/me` | Current user (needs cookie). |

**Google / GitHub (browser only):** redirect users to `GET /api/auth/oauth/google` or `GET /api/auth/oauth/github`. Optional query: `?returnTo=/some-path`. Callback URLs are `/api/auth/oauth/google/callback` and `/api/auth/oauth/github/callback` — these must match what is configured in Google/GitHub.

### JSON examples

**POST `/api/auth/register`**
```json
{
  "name": "Alex Tan",
  "email": "alex@example.com",
  "password": "StrongPass123!"
}
```
```json
{
  "user": {
    "id": 1,
    "name": "Alex Tan",
    "email": "alex@example.com",
    "role": "ADMIN"
  }
}
```

**POST `/api/auth/login`**
```json
{
  "email": "alex@example.com",
  "password": "StrongPass123!"
}
```
```json
{
  "user": {
    "id": 1,
    "name": "Alex Tan",
    "email": "alex@example.com",
    "role": "ADMIN"
  }
}
```

**POST `/api/auth/logout`**
```json
{}
```
```json
{
  "message": "Logged out successfully"
}
```

**GET `/api/auth/me`**
```json
{
  "user": {
    "id": 1,
    "name": "Alex Tan",
    "email": "alex@example.com",
    "role": "ADMIN"
  }
}
```

---

## Departments

| Method | Path |
|--------|------|
| GET | `/api/departments` — list |
| POST | `/api/departments` — create (admin) |
| GET | `/api/departments/:id` |
| PUT | `/api/departments/:id` |
| DELETE | `/api/departments/:id` — admin; blocked if programs still use it |

### JSON examples

**POST `/api/departments`**
```json
{
  "name": "School of Computing"
}
```
```json
{
  "id": 1,
  "name": "School of Computing",
  "created_at": "2026-04-09T10:00:00.000Z",
  "updated_at": "2026-04-09T10:00:00.000Z"
}
```

**PUT `/api/departments/:id`**
```json
{
  "name": "Faculty of Computing"
}
```
```json
{
  "id": 1,
  "name": "Faculty of Computing",
  "updated_at": "2026-04-09T10:05:00.000Z"
}
```

**GET `/api/departments`**
```json
[
  {
    "id": 1,
    "name": "Faculty of Computing"
  }
]
```

---

## Programs

| Method | Path |
|--------|------|
| GET | `/api/programs` — list; optional `?department_id=` |
| POST | `/api/programs` — create (admin) |
| GET | `/api/programs/:id` |
| PUT | `/api/programs/:id` |
| DELETE | `/api/programs/:id` — admin; blocked if program still has courses |
| GET | `/api/programs/:id/curriculum` — full curriculum (semesters, courses, elective groups) |

### JSON examples

**POST `/api/programs`**
```json
{
  "department_id": 1,
  "name": "Diploma in IT",
  "code": "DIT",
  "total_semesters": 6
}
```
```json
{
  "id": 1,
  "department_id": 1,
  "name": "Diploma in IT",
  "code": "DIT",
  "total_semesters": 6
}
```

**PUT `/api/programs/:id`**
```json
{
  "name": "Diploma in Information Technology",
  "total_semesters": 6
}
```
```json
{
  "id": 1,
  "department_id": 1,
  "name": "Diploma in Information Technology",
  "code": "DIT",
  "total_semesters": 6
}
```

**GET `/api/programs/:id/curriculum`**
```json
{
  "program": {
    "id": 1,
    "name": "Diploma in Information Technology",
    "code": "DIT"
  },
  "semesters": [
    {
      "id": 10,
      "semester_number": 1,
      "courses": [
        {
          "id": 100,
          "course_code": "WEB101",
          "course_name": "Web Programming"
        }
      ],
      "elective_groups": [
        {
          "id": 200,
          "name": "General Electives",
          "min_select": 1
        }
      ]
    }
  ]
}
```

---

## Courses

| Method | Path |
|--------|------|
| GET | `/api/courses` — list |
| POST | `/api/courses` — create |
| GET | `/api/courses/:id` |
| PUT | `/api/courses/:id` — update |
| DELETE | `/api/courses/:id` — **admin only**; may fail if course is still linked to a term offering |

### JSON examples

**POST `/api/courses`**
```json
{
  "course_code": "WPF201",
  "course_name": "Web Programming Framework 2",
  "credit_hours": 3
}
```
```json
{
  "id": 21,
  "course_code": "WPF201",
  "course_name": "Web Programming Framework 2",
  "credit_hours": 3
}
```

**PUT `/api/courses/:id`**
```json
{
  "course_name": "Web Programming Framework II",
  "credit_hours": 4
}
```
```json
{
  "id": 21,
  "course_code": "WPF201",
  "course_name": "Web Programming Framework II",
  "credit_hours": 4
}
```

**GET `/api/courses`**
```json
[
  {
    "id": 21,
    "course_code": "WPF201",
    "course_name": "Web Programming Framework II",
    "credit_hours": 4
  }
]
```

---

## Elective groups (per program semester)

| Method | Path |
|--------|------|
| POST | `/api/program-semesters/:id/elective-groups` — create a group on that curriculum semester |

### JSON examples

**POST `/api/program-semesters/:id/elective-groups`**
```json
{
  "name": "Technology Electives",
  "min_select": 2,
  "max_select": 4
}
```
```json
{
  "id": 301,
  "program_semester_id": 10,
  "name": "Technology Electives",
  "min_select": 2,
  "max_select": 4
}
```

---

## Semesters (calendar: year + fall/winter/summer)

| Method | Path |
|--------|------|
| GET | `/api/semesters` |
| POST | `/api/semesters` — admin |
| GET | `/api/semesters/:id` |
| PUT | `/api/semesters/:id` |
| DELETE | `/api/semesters/:id` — admin; blocked if used by term links |

### JSON examples

**POST `/api/semesters`**
```json
{
  "year": 2026,
  "season": "FALL"
}
```
```json
{
  "id": 5,
  "year": 2026,
  "season": "FALL"
}
```

**PUT `/api/semesters/:id`**
```json
{
  "season": "WINTER"
}
```
```json
{
  "id": 5,
  "year": 2026,
  "season": "WINTER"
}
```

**GET `/api/semesters`**
```json
[
  {
    "id": 5,
    "year": 2026,
    "season": "WINTER"
  }
]
```

---

## Terms (link a course to a calendar semester)

| Method | Path |
|--------|------|
| GET | `/api/terms` |
| POST | `/api/terms` — admin |
| GET | `/api/terms/:id` |
| PUT | `/api/terms/:id` |
| DELETE | `/api/terms/:id` — admin |

### JSON examples

**POST `/api/terms`**
```json
{
  "course_id": 21,
  "semester_id": 5,
  "section": "A",
  "capacity": 40
}
```
```json
{
  "id": 900,
  "course_id": 21,
  "semester_id": 5,
  "section": "A",
  "capacity": 40
}
```

**PUT `/api/terms/:id`**
```json
{
  "section": "B",
  "capacity": 35
}
```
```json
{
  "id": 900,
  "course_id": 21,
  "semester_id": 5,
  "section": "B",
  "capacity": 35
}
```

**GET `/api/terms`**
```json
[
  {
    "id": 900,
    "course_id": 21,
    "semester_id": 5,
    "section": "B",
    "capacity": 35
  }
]
```

---

## Permission requests (staff asks admin to create/delete)

| Method | Path |
|--------|------|
| GET | `/api/permission-requests` — staff see their own; admin sees all |
| POST | `/api/permission-requests` — staff only; `module` + `action` (create/delete) |
| PUT | `/api/permission-requests/:id/review` — admin only; approve or reject |

### JSON examples

**POST `/api/permission-requests`**
```json
{
  "module": "departments",
  "action": "create",
  "reason": "Need a new department for upcoming intake",
  "payload": {
    "name": "School of Data Science"
  }
}
```
```json
{
  "id": 77,
  "requester_id": 12,
  "module": "departments",
  "action": "create",
  "status": "PENDING"
}
```

**PUT `/api/permission-requests/:id/review`**
```json
{
  "decision": "approve",
  "review_note": "Looks valid"
}
```
```json
{
  "id": 77,
  "status": "APPROVED",
  "reviewed_by": 1,
  "review_note": "Looks valid"
}
```

**GET `/api/permission-requests`**
```json
[
  {
    "id": 77,
    "module": "departments",
    "action": "create",
    "status": "PENDING"
  }
]
```

---

## Common HTTP status codes

| Code | Meaning (short) |
|------|------------------|
| 200 | OK |
| 201 | Created |
| 204 | Success, no body (some deletes) |
| 400 | Bad request / validation |
| 401 | Not signed in |
| 403 | Not allowed for your role |
| 404 | Not found |
| 500 | Server error |
