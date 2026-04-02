# AGENTS.md - FacultyHub Project Guide

This document provides guidance for AI coding agents working in this repository.

## Project Overview

FacultyHub is a Next.js 16 faculty management portal built with React 19, TypeScript, Tailwind CSS 4, and PostgreSQL (Neon). It uses shadcn/ui components with Radix UI primitives.

## Build/Lint/Test Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack

# Build
npm run build            # Production build (next build)

# Linting
npm run lint             # Run ESLint

# Type Checking
npm run typecheck        # Run TypeScript compiler in no-emit mode

# Formatting
npm run format           # Format all TypeScript/TSX files with Prettier
```

Note: No test framework is currently configured. When tests are added, update this section.

## Project Structure

```
app/
  (auth)/           # Auth-related pages (login, signup)
  api/              # API routes organized by domain
    auth/           # Authentication endpoints
    faculty/        # Faculty domain APIs (dashboard, profile, etc.)
    data/           # Database browsing APIs
  faculty/          # Faculty portal pages
  data/             # Database browser pages

components/
  ui/               # shadcn/ui components (base-ui, radix-ui)
  faculty/          # Faculty-specific components

lib/
  api/              # Client-side API functions
  types/            # TypeScript type definitions
  validations/      # Zod validation schemas
  auth.ts           # Authentication logic
  db.ts             # Database utilities
  api-response.ts   # API response helpers
  utils.ts          # Utility functions (cn)

prisma/
  schema.prisma     # Database schema
```

## Code Style Guidelines

### Imports

```typescript
// 1. External imports (alphabetically sorted)
import { NextResponse } from "next/server";
import { z } from "zod";

// 2. Internal imports using @ alias (grouped by proximity)
import { getSession } from "@/lib/auth";
import { successResponse, internalErrorResponse } from "@/lib/api-response";
import type { DashboardResponse } from "@/lib/types/faculty";

// 3. Component imports
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
```

### TypeScript Conventions

- **Strict mode enabled**: All code must pass strict TypeScript checks
- **Use `interface` for object types**, `type` for unions/intersections/primitives
- **Prefer explicit return types** for exported functions
- **Use `const` assertions** for readonly arrays and object literals
- **Avoid `any`**: Use `unknown` when type is truly unknown

```typescript
// Good
export interface FacultyProfile {
  id: string;
  bio: string | null;
}

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

// Bad
const data: any = fetchData();
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `DashboardCards` |
| Functions | camelCase | `getDashboardData` |
| Variables | camelCase | `facultyId` |
| Constants | SCREAMING_SNAKE_CASE | `SESSION_COOKIE_NAME` |
| Files (components) | kebab-case.tsx | `dashboard-cards.tsx` |
| Files (utilities) | kebab-case.ts | `api-response.ts` |
| API routes | kebab-case | `route.ts` |
| Types/Interfaces | PascalCase | `FacultyRequest` |

### React Component Patterns

```tsx
"use client";  // Required for client components

import { cn } from "@/lib/utils";
import type { SomeType } from "@/lib/types/some";

interface ComponentProps {
  data: SomeType;
  className?: string;
}

export function Component({ data, className }: ComponentProps) {
  return (
    <div className={cn("base-classes", className)}>
      {/* content */}
    </div>
  );
}
```

### API Route Patterns

```typescript
import { NextResponse } from "next/server";
import { successResponse, internalErrorResponse, unauthorizedResponse } from "@/lib/api-response";
import { parseRequestBody } from "@/lib/api-response";
import { someSchema } from "@/lib/validations/some";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    // Database queries with sql tagged template
    const rows = await sql`SELECT * FROM table WHERE id = ${id}`;

    return successResponse(data);
  } catch (error) {
    console.error("API error:", error);
    return internalErrorResponse("Failed to fetch data");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parseResult = await parseRequestBody(request, someSchema);
  if (!parseResult.success) return parseResult.response;

  // Process validated data
  const data = parseResult.data;
}
```

### Error Handling

- Use `try/catch` in API routes with `console.error` for logging
- Return appropriate error responses from `lib/api-response.ts`
- Use `successResponse()`, `internalErrorResponse()`, `unauthorizedResponse()`, etc.
- Client-side: Use `sonner` toast notifications for user feedback

```typescript
// API routes
try {
  // operations
} catch (error) {
  console.error("Operation failed:", error);
  return internalErrorResponse("Operation failed");
}

// Client components
import { toast } from "sonner";

try {
  await someOperation();
  toast.success("Operation successful");
} catch (error) {
  toast.error("Operation failed");
}
```

### Database Queries

- Use the `sql` tagged template from `@/lib/db`
- Use snake_case for column names in SQL (mapped to camelCase in types)
- Always use parameterized queries (`${variable}`) to prevent SQL injection

```typescript
const rows = await sql`
  SELECT
    f.id,
    f.designation,
    u.name as user_name,
    u.email as user_email
  FROM faculty f
  JOIN users u ON f.user_id = u.id
  WHERE f.id = ${facultyId}
`;
```

### Styling

- Use Tailwind CSS utility classes exclusively
- Use `cn()` utility for conditional class merging
- Follow mobile-first responsive design
- Use CSS variables for theming (light/dark mode supported)
- Use Tailwind's `@container` for component-level responsive styling

```tsx
<div className={cn(
  "flex items-center gap-2",
  isActive && "bg-primary text-primary-foreground",
  className
)}>
```

### Validation

- Use Zod for all schema validation
- Define schemas in `lib/validations/`
- Export both schema and inferred type

```typescript
export const createSwapRequestSchema = z.object({
  targetFacultyId: z.string().uuid(),
  reason: z.string().min(10).max(1000),
});

export type CreateSwapRequestInput = z.infer<typeof createSwapRequestSchema>;
```

### Enums Pattern

Define enums as const objects with TypeScript type inference:

```typescript
export const RequestStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];
```

## Key Files to Reference

- `lib/api-response.ts` - API response helpers (success/error)
- `lib/auth.ts` - Authentication and session management
- `lib/db.ts` - Database connection and query utilities
- `lib/types/faculty.ts` - Core type definitions
- `lib/validations/faculty.ts` - Zod validation schemas
- `prisma/schema.prisma` - Database schema reference

## Environment Variables

Required environment variables (check `.env` or deployment):
- `DATABASE_URL` - Neon PostgreSQL connection string
- `NODE_ENV` - Environment (development/production)

## Notes for Agents

- Run `npm run typecheck` after making changes to verify TypeScript correctness
- Run `npm run lint` to catch code quality issues
- API routes use `NextResponse` from `next/server`
- Client components require `"use client"` directive at the top
- Server components (default) should not use hooks or browser APIs
- Use SWR for client-side data fetching with automatic revalidation
