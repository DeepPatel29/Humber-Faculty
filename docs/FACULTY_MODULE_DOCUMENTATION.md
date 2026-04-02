# Faculty Dashboard Module - Documentation

## College Scheduling System
**Module:** Faculty Dashboard  
**Tech Stack:** Next.js 16 (TypeScript, App Router), PostgreSQL (Neon), Prisma 7 ORM, Tailwind CSS + shadcn/ui, REST API, Zod Validation

---

## Table of Contents
1. [Task 1: Database Design (Prisma)](#task-1-database-design-prisma)
2. [Task 2: UI Implementation Plan](#task-2-ui-implementation-plan)
3. [Task 3: REST API Design](#task-3-rest-api-design)
4. [Task 4: Data Flow Explanation](#task-4-data-flow-explanation)
5. [Task 5: Security](#task-5-security)

---

## Task 1: Database Design (Prisma)

### Prisma Schema Location
`prisma/schema.prisma`

### Enums

| Enum Name | Values | Purpose |
|-----------|--------|---------|
| `AppRole` | ADMIN, FACULTY, STUDENT, SCHEDULER | User roles in the system |
| `RequestType` | SWAP, RESCHEDULE, LEAVE | Types of faculty requests |
| `RequestStatus` | PENDING, APPROVED, REJECTED, WITHDRAWN | Request workflow states |
| `NotificationType` | REQUEST_UPDATE, SCHEDULE_CHANGE, ANNOUNCEMENT, REMINDER, SYSTEM | Notification categories |
| `ScheduleItemType` | LECTURE, LAB, TUTORIAL, SEMINAR, OFFICE_HOURS | Types of scheduled activities |
| `PreferredSlot` | MORNING, AFTERNOON, EVENING, ANY | Time slot preferences |
| `DayOfWeek` | MONDAY through SUNDAY | Days of the week |

### Models

#### Core Models

| Model | Description | Key Fields |
|-------|-------------|------------|
| `User` | Base user authentication | id, email, name, role, avatarUrl |
| `Department` | Academic departments | id, name, code, description |
| `Course` | Academic courses | id, name, code, credits, departmentId |
| `Room` | Physical classrooms/labs | id, name, building, floor, capacity, type |

#### Faculty-Specific Models

| Model | Description | Key Fields |
|-------|-------------|------------|
| `Faculty` | Faculty member record | id, userId, departmentId, employeeId, designation |
| `FacultyProfile` | Extended profile info | bio, phone, officeLocation, researchInterests, qualifications, publications |
| `FacultySchedule` | Teaching schedule items | courseId, roomId, dayOfWeek, startTime, endTime, type |
| `FacultyAvailability` | Availability preferences | preferredSlot, customStartTime, customEndTime, notes |
| `FacultyAvailabilityDay` | Per-day availability | dayOfWeek, isAvailable |
| `FacultyRequest` | Swap/Reschedule/Leave requests | type, status, effectiveDate, reason, targetFacultyId |
| `FacultyRequestTimeline` | Request status history | status, comment, createdBy |
| `FacultyNotification` | Faculty notifications | type, title, message, isRead |

### Relationships

```
User (1) ──────── (1) Faculty
Faculty (1) ──────── (1) FacultyProfile
Faculty (1) ──────── (1) FacultyAvailability
Faculty (1) ──────── (N) FacultySchedule
Faculty (1) ──────── (N) FacultyRequest
Faculty (1) ──────── (N) FacultyNotification
FacultyAvailability (1) ──────── (N) FacultyAvailabilityDay
FacultyRequest (1) ──────── (N) FacultyRequestTimeline
Department (1) ──────── (N) Faculty
Department (1) ──────── (N) Course
Course (1) ──────── (N) FacultySchedule
Room (1) ──────── (N) FacultySchedule
```

### Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `faculty_schedules` | `[facultyId, dayOfWeek]` | Fast lookup by faculty and day |
| `faculty_schedules` | `[facultyId, isActive]` | Filter active schedules |
| `faculty_requests` | `[facultyId, status]` | Filter requests by status |
| `faculty_requests` | `[facultyId, createdAt DESC]` | Recent requests first |
| `faculty_notifications` | `[facultyId, isRead]` | Unread notifications |
| `faculty_notifications` | `[facultyId, createdAt DESC]` | Recent notifications first |

### Constraints

| Constraint | Table | Fields | Purpose |
|------------|-------|--------|---------|
| Unique | `faculty_availability_days` | `[availabilityId, dayOfWeek]` | One entry per day per availability |
| Unique | `users` | `email` | No duplicate emails |
| Unique | `faculty` | `employeeId` | Unique employee IDs |
| Unique | `faculty` | `userId` | One faculty per user |

---

## Task 2: UI Implementation Plan

### Main Screens (5 Screens)

#### Screen 1: Dashboard (`/faculty/dashboard`)

**Layout:**
- Header with user info and notifications
- Sidebar navigation (collapsible)
- Main content area with grid layout

**Components:**
| Component | Type | Source |
|-----------|------|--------|
| `FacultySidebar` | Client | Custom |
| `FacultyHeader` | Client | Custom |
| `DashboardCards` | Client | Custom + shadcn Card |
| `ScheduleCard` | Client | Custom + shadcn Card, Badge |
| `NotificationsList` | Client | Custom + shadcn Card |

**Data Fetching:** SWR hooks (`useDashboard`, `useTodaySchedule`, `useUpcomingSchedule`, `useUnreadCount`)

#### Screen 2: Timetable (`/faculty/timetable`)

**Layout:**
- Filters bar (week selector, course filter, program filter)
- Weekly grid view with time slots

**Components:**
| Component | Type | Source |
|-----------|------|--------|
| `TimetableFilters` | Client | Custom + shadcn Select, Button |
| `TimetableGrid` | Client | Custom + shadcn Badge, Tooltip |
| `WeekNavigator` | Client | Custom + shadcn Button |

**Data Fetching:** SWR hook (`useTimetable` with filter params)

#### Screen 3: Profile (`/faculty/profile`)

**Layout:**
- Two-column layout on desktop
- Personal info card + editable form sections

**Components:**
| Component | Type | Source |
|-----------|------|--------|
| `ProfileForm` | Client | Custom + shadcn Input, Textarea, Button |
| `DynamicListField` | Client | Custom (for arrays like qualifications) |
| `AvatarUpload` | Client | Custom + shadcn Avatar |

**Data Fetching:** SWR hook (`useProfile`) with mutation (`useProfileMutation`)

#### Screen 4: Availability (`/faculty/availability`)

**Layout:**
- Single column form with day toggles
- Time slot preferences section

**Components:**
| Component | Type | Source |
|-----------|------|--------|
| `AvailabilityForm` | Client | Custom + shadcn Switch, Select |
| `DayToggleGroup` | Client | Custom toggle buttons |
| `TimeSlotSelector` | Client | Custom + shadcn RadioGroup |

**Data Fetching:** SWR hook (`useAvailability`) with mutation (`useAvailabilityMutation`)

#### Screen 5: Requests (`/faculty/requests`)

**Layout:**
- Tab navigation (All, Pending, Approved, Rejected)
- Request list with expandable cards
- Action dialogs for creating requests

**Components:**
| Component | Type | Source |
|-----------|------|--------|
| `RequestsList` | Client | Custom + shadcn Card, Badge |
| `RequestFilters` | Client | shadcn Tabs, Select |
| `SwapRequestDialog` | Client | shadcn Dialog, Form |
| `RescheduleRequestDialog` | Client | shadcn Dialog, Form |
| `LeaveRequestDialog` | Client | shadcn Dialog, Form |

**Data Fetching:** SWR hook (`useRequests` with filters) with mutations

### Component Architecture

```
app/faculty/layout.tsx (Client - wraps all faculty pages)
├── components/faculty/faculty-sidebar.tsx (Client)
└── [page content]

app/faculty/dashboard/page.tsx (Client)
├── components/faculty/dashboard-cards.tsx (Client)
├── components/faculty/schedule-card.tsx (Client)
└── components/faculty/notifications-list.tsx (Client)

app/faculty/timetable/page.tsx (Client)
├── components/faculty/timetable-filters.tsx (Client)
└── components/faculty/timetable-grid.tsx (Client)

app/faculty/profile/page.tsx (Client)
└── components/faculty/profile-form.tsx (Client)

app/faculty/availability/page.tsx (Client)
└── components/faculty/availability-form.tsx (Client)

app/faculty/requests/page.tsx (Client)
├── components/faculty/requests-list.tsx (Client)
└── components/faculty/request-dialogs.tsx (Client)
```

---

## Task 3: REST API Design

### API Endpoints

#### Dashboard Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/faculty/dashboard` | Get dashboard summary data | Faculty |

#### Profile Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/faculty/profile` | Get faculty profile | Faculty |
| PUT | `/api/faculty/profile` | Update faculty profile | Faculty |

#### Timetable Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/faculty/timetable` | Get weekly timetable | Faculty |
| GET | `/api/faculty/timetable/today` | Get today's schedule | Faculty |
| GET | `/api/faculty/timetable/upcoming` | Get upcoming classes | Faculty |

#### Availability Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/faculty/availability` | Get availability settings | Faculty |
| PUT | `/api/faculty/availability` | Update availability | Faculty |

#### Request Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/faculty/requests` | List all requests | Faculty |
| GET | `/api/faculty/requests/[id]` | Get request details | Faculty |
| PUT | `/api/faculty/requests/[id]` | Update request (withdraw) | Faculty |
| DELETE | `/api/faculty/requests/[id]` | Delete request | Faculty |
| POST | `/api/faculty/requests/swap` | Create swap request | Faculty |
| POST | `/api/faculty/requests/reschedule` | Create reschedule request | Faculty |
| POST | `/api/faculty/requests/leave` | Create leave request | Faculty |

#### Notification Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/faculty/notifications` | List notifications | Faculty |
| GET | `/api/faculty/notifications/unread-count` | Get unread count | Faculty |
| PUT | `/api/faculty/notifications/[id]/read` | Mark as read | Faculty |
| PUT | `/api/faculty/notifications/read-all` | Mark all as read | Faculty |

#### Option Endpoints (for dropdowns)

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/faculty/classes/options` | Get faculty's classes | Faculty |
| GET | `/api/faculty/colleagues/options` | Get colleagues list | Faculty |

### Validation Schemas (Zod)

**Location:** `lib/validations/faculty.ts`

| Schema | Purpose | Key Validations |
|--------|---------|-----------------|
| `updateProfileSchema` | Profile updates | bio max 1000 chars, valid phone format, URLs for social links |
| `updateAvailabilitySchema` | Availability updates | Valid time format (HH:MM), all 7 days required, start < end |
| `createSwapRequestSchema` | Swap requests | Valid UUIDs, date format, reason min 10 chars |
| `createRescheduleRequestSchema` | Reschedule requests | Valid times, start < end, reason required |
| `createLeaveRequestSchema` | Leave requests | effectiveDate <= endDate |
| `timetableQuerySchema` | Timetable filters | Valid date format, view enum |
| `requestsQuerySchema` | Request filters | Valid status enum, pagination |

### TypeScript Interfaces

**Location:** `lib/types/faculty.ts`

**Input Types:**
- `UpdateProfileInput`
- `UpdateAvailabilityInput`
- `CreateSwapRequestInput`
- `CreateRescheduleRequestInput`
- `CreateLeaveRequestInput`
- `UpdateRequestInput`

**Response Types:**
- `DashboardResponse`
- `ProfileResponse`
- `TimetableResponse`
- `AvailabilityResponse`
- `RequestsResponse`
- `NotificationsResponse`
- `ClassOptionsResponse`
- `ColleagueOptionsResponse`

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation failed |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate/conflict |
| 500 | Internal Error | Server error |

---

## Task 4: Data Flow Explanation

### Standard Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │────▶│   UI Form    │────▶│   REST API   │────▶│    Prisma    │────▶│   Neon DB    │
│   Action     │     │  (React)     │     │   (Route)    │     │    Client    │     │  (PostgreSQL)│
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
                                                                       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  UI Update   │◀────│ SWR Mutate   │◀────│   Response   │◀────│    Query     │
│   (React)    │     │   (Cache)    │     │    (JSON)    │     │   Result     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### Detailed Flow Example: Create Leave Request

```
1. User fills Leave Request Form
   └─▶ SwapRequestDialog component (use client)

2. Form Submission
   └─▶ Zod validation (createLeaveRequestSchema)
       ├─▶ If invalid: Show field errors, stop
       └─▶ If valid: Continue

3. API Call
   └─▶ POST /api/faculty/requests/leave
       └─▶ Request body: { effectiveDate, endDate, reason }

4. Route Handler Processing
   ├─▶ Parse request body
   ├─▶ Validate with Zod schema
   ├─▶ Check user authentication
   └─▶ Prisma create operation

5. Database Operation (Prisma → Neon)
   └─▶ prisma.facultyRequest.create({
         data: { type: 'LEAVE', status: 'PENDING', ... }
       })

6. Response
   └─▶ { success: true, data: { request: {...} } }

7. UI Update
   ├─▶ SWR mutate (revalidate requests cache)
   ├─▶ Show success toast
   └─▶ Close dialog
```

### Error Handling Flow

#### Validation Error

```
User Input ──▶ Zod Validation ──▶ FAIL
                                   │
                                   ▼
                            ┌─────────────┐
                            │ 400 Response│
                            │ {           │
                            │   success:  │
                            │   false,    │
                            │   error: {  │
                            │     details │
                            │   }         │
                            │ }           │
                            └─────────────┘
                                   │
                                   ▼
                            Show field-level
                            error messages
```

#### Database Error

```
Prisma Operation ──▶ Database Error
                           │
                           ▼
                    ┌─────────────┐
                    │ Catch Error │
                    │ Log Details │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ 500 Response│
                    │ {           │
                    │   success:  │
                    │   false,    │
                    │   error: {  │
                    │     code:   │
                    │     message │
                    │   }         │
                    │ }           │
                    └─────────────┘
                           │
                           ▼
                    Show error toast
                    "Something went wrong"
```

### SWR Caching Strategy

```
┌────────────────────────────────────────────────────────────┐
│                    SWR Cache Keys                          │
├────────────────────────────────────────────────────────────┤
│ "faculty-dashboard"           → Dashboard data             │
│ "faculty-profile"             → Profile data               │
│ "faculty-timetable"           → Weekly schedule            │
│ "faculty-today-schedule"      → Today's classes            │
│ "faculty-upcoming-schedule"   → Next 5 classes             │
│ "faculty-availability"        → Availability settings      │
│ "faculty-requests"            → Requests list              │
│ "faculty-notifications"       → Notifications list         │
│ "faculty-unread-count"        → Notification badge count   │
│ "faculty-class-options"       → Dropdown options           │
│ "faculty-colleague-options"   → Dropdown options           │
└────────────────────────────────────────────────────────────┘

On mutation success:
  └─▶ mutate() invalidates relevant cache keys
  └─▶ SWR automatically refetches fresh data
```

---

## Task 5: Security

### User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `ADMIN` | System administrator | Full access to all modules |
| `FACULTY` | Teaching staff | Own data + limited cross-faculty access |
| `STUDENT` | Students | Read-only schedule access |
| `SCHEDULER` | Schedule coordinator | Schedule management access |

### Role-Based Access Control (RBAC)

#### Faculty Module Access Matrix

| Endpoint | ADMIN | FACULTY | STUDENT | SCHEDULER |
|----------|-------|---------|---------|-----------|
| GET /api/faculty/dashboard | Yes | Own Only | No | No |
| GET /api/faculty/profile | Yes | Own Only | No | No |
| PUT /api/faculty/profile | Yes | Own Only | No | No |
| GET /api/faculty/timetable | Yes | Own Only | No | View Only |
| GET /api/faculty/availability | Yes | Own Only | No | View Only |
| PUT /api/faculty/availability | Yes | Own Only | No | No |
| GET /api/faculty/requests | Yes | Own Only | No | View Only |
| POST /api/faculty/requests/* | Yes | Own Only | No | No |
| PUT /api/faculty/requests/[id] | Yes | Own Only | No | Approve/Reject |
| GET /api/faculty/notifications | Yes | Own Only | No | No |
| GET /api/faculty/colleagues/options | Yes | Yes | No | Yes |

### Authentication Flow

```
1. User authenticates via Better-Auth
   └─▶ Session created with userId and role

2. API Request
   └─▶ Middleware checks session
       ├─▶ No session: 401 Unauthorized
       └─▶ Has session: Continue

3. Authorization Check
   └─▶ Route handler checks role
       ├─▶ Wrong role: 403 Forbidden
       └─▶ Correct role: Continue

4. Resource Ownership Check
   └─▶ For Faculty endpoints:
       ├─▶ Extract facultyId from session
       ├─▶ Compare with requested resource
       ├─▶ Mismatch: 403 Forbidden
       └─▶ Match: Process request
```

### Security Best Practices Implemented

1. **Input Validation**
   - All inputs validated with Zod schemas
   - Type coercion for query parameters
   - Maximum length constraints on text fields

2. **SQL Injection Prevention**
   - Prisma ORM parameterized queries
   - No raw SQL queries

3. **Data Isolation**
   - Faculty can only access own data
   - Cross-faculty queries filtered by permissions

4. **Error Handling**
   - Generic error messages to clients
   - Detailed logging server-side
   - No stack traces in production

5. **Session Management**
   - HTTP-only cookies
   - Session expiration
   - CSRF protection via Better-Auth

### API Security Headers

```typescript
// Recommended headers (set in middleware)
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
}
```

---

## File Structure

```
├── app/
│   ├── api/faculty/
│   │   ├── dashboard/route.ts
│   │   ├── profile/route.ts
│   │   ├── timetable/
│   │   │   ├── route.ts
│   │   │   ├── today/route.ts
│   │   │   └── upcoming/route.ts
│   │   ├── availability/route.ts
│   │   ├── requests/
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   ├── swap/route.ts
│   │   │   ├── reschedule/route.ts
│   │   │   └── leave/route.ts
│   │   ├── notifications/
│   │   │   ├── route.ts
│   │   │   ├── unread-count/route.ts
│   │   │   ├── [id]/read/route.ts
│   │   │   └── read-all/route.ts
│   │   ├── classes/options/route.ts
│   │   └── colleagues/options/route.ts
│   └── faculty/
│       ├── layout.tsx
│       ├── dashboard/page.tsx
│       ├── profile/page.tsx
│       ├── timetable/page.tsx
│       ├── availability/page.tsx
│       ├── requests/page.tsx
│       └── notifications/page.tsx
├── components/faculty/
│   ├── faculty-sidebar.tsx
│   ├── faculty-header.tsx
│   ├── dashboard-cards.tsx
│   ├── schedule-card.tsx
│   ├── notifications-list.tsx
│   ├── profile-form.tsx
│   ├── timetable-filters.tsx
│   ├── timetable-grid.tsx
│   ├── availability-form.tsx
│   ├── requests-list.tsx
│   └── request-dialogs.tsx
├── hooks/
│   └── use-faculty.ts
├── lib/
│   ├── api/
│   │   └── faculty-client.ts
│   ├── types/
│   │   └── faculty.ts
│   ├── validations/
│   │   └── faculty.ts
│   ├── mock-data/
│   │   └── faculty.ts
│   ├── api-response.ts
│   └── prisma.ts
├── prisma/
│   └── schema.prisma
└── docs/
    └── FACULTY_MODULE_DOCUMENTATION.md
```

---

## Summary

This Faculty Dashboard Module provides:

- **15+ database models** with proper relationships, indexes, and constraints
- **5 main UI screens** with responsive design using shadcn/ui components
- **20+ REST API endpoints** with full CRUD operations
- **Comprehensive Zod validation** for all inputs
- **Type-safe TypeScript interfaces** for all data structures
- **SWR-based data fetching** with caching and mutations
- **Role-based access control** with proper authorization checks
