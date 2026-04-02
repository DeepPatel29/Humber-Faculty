FacultyHub — Complete Implementation Plan & Code
Table of Contents
Architecture & User Flow
Setup & Install
Configuration Files
Prisma Schema & Seed
Authentication (Better Auth)
Utility Files
API Routes
Custom Hooks
Components
Pages
Styles
Run Instructions
1. Architecture & User Flow
ER Diagram (Text)
text

User 1──1 Faculty 1──* FacultySchedule
  │           │  1──1 FacultyProfile
  │           │  1──1 FacultyAvailability 1──* FacultyAvailabilityDay
  │           │  1──* FacultyRequest 1──* FacultyRequestTimeline
  │           │  1──* FacultyNotification
  │           └──1 Department 1──* Course
  │
  ├──* Session
  ├──* Account
  │
  └── FacultySchedule *──1 Course
      FacultySchedule *──1 Room
User Flow
text

[Landing Page /] → [Login /login] or [Signup /signup]
        ↓                    ↓
   (auth check)        (create account)
        ↓                    ↓
   [Faculty Dashboard /faculty/dashboard]
        │
        ├── Sidebar → Timetable /faculty/timetable
        ├── Sidebar → Requests /faculty/requests
        ├── Sidebar → Profile /faculty/profile
        ├── Sidebar → Availability /faculty/availability
        └── Sidebar → Notifications /faculty/notifications
UI Design Style (matching provided image)
Clean white background, minimal shadows
Card-based layouts with subtle border-gray-200 borders
Status badges with colored dots (green=Available/Approved, amber=Pending, red=Rejected)
Filter bars with search inputs and dropdowns
Top header with branding + user avatar
Left sidebar navigation for dashboard pages
Grid layouts (responsive 1→2→3→4 columns)
Blue primary accent color
Tags/badges for metadata
2. Setup & Install
Step 1: Create project
Bash

npx create-next-app@latest FacultyApp --typescript --tailwind --eslint --app --src=false --import-alias "@/*"
cd FacultyApp
Step 2: Install ALL dependencies
Bash

# Core
npm install @prisma/client better-auth date-fns zod react-hook-form @hookform/resolvers swr sonner lucide-react

# Radix UI primitives (for shadcn)
npm install @radix-ui/react-avatar @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-popover @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-tooltip

# Utilities
npm install class-variance-authority clsx tailwind-merge tailwindcss-animate react-day-picker@^9

# Dev
npm install -D prisma @types/node tsx
Step 3: Initialize Prisma
Bash

npx prisma init
Step 4: Initialize shadcn/ui
Bash

npx shadcn@latest init
Choose: New York style, Neutral base color, CSS variables = yes.

Then install components:

Bash

npx shadcn@latest add button card input label textarea badge avatar dialog tabs select skeleton separator switch popover calendar dropdown-menu tooltip
3. Configuration Files
next.config.ts
TypeScript

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "better-auth"],
};

export default nextConfig;
tailwind.config.ts
TypeScript

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
postcss.config.mjs
JavaScript

const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
export default config;
.env
env

DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host/dbname?sslmode=require"
BETTER_AUTH_SECRET="your-super-secret-key-at-least-32-characters-long"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
components.json
JSON

{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
tsconfig.json — Ensure these paths exist:
JSON

{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
4. Prisma Schema & Seed
prisma/schema.prisma
CRITICAL: Field names MUST match what Better Auth expects (camelCase). This is the #1 cause of runtime errors.

prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ==================== ENUMS ====================

enum AppRole {
  ADMIN
  FACULTY
  STUDENT
  SCHEDULER
}

enum RequestType {
  SWAP
  RESCHEDULE
  LEAVE
}

enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
  WITHDRAWN
}

enum NotificationType {
  REQUEST_UPDATE
  SCHEDULE_CHANGE
  ANNOUNCEMENT
  REMINDER
  SYSTEM
}

enum ScheduleItemType {
  LECTURE
  LAB
  TUTORIAL
  SEMINAR
  OFFICE_HOURS
}

enum PreferredSlot {
  MORNING
  AFTERNOON
  EVENING
  ANY
}

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

// ==================== BETTER AUTH TABLES ====================
// These MUST have exact field names that Better Auth expects

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  role          AppRole   @default(FACULTY)

  sessions Session[]
  accounts Account[]
  faculty  Faculty?
}

model Session {
  id        String   @id @default(cuid())
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
}

model Account {
  id                    String    @id @default(cuid())
  accountId             String
  providerId            String
  userId                String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model Verification {
  id         String    @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime? @default(now())
  updatedAt  DateTime? @updatedAt
}

// ==================== APPLICATION TABLES ====================

model Department {
  id          String    @id @default(uuid())
  name        String
  code        String    @unique
  description String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  courses     Course[]
  faculty     Faculty[]
}

model Course {
  id           String           @id @default(uuid())
  name         String
  code         String           @unique
  description  String?
  credits      Int              @default(3)
  departmentId String
  department   Department       @relation(fields: [departmentId], references: [id])
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  schedules    FacultySchedule[]

  @@index([departmentId])
}

model Room {
  id        String           @id @default(uuid())
  name      String
  building  String
  floor     Int              @default(1)
  capacity  Int              @default(30)
  type      String           @default("classroom")
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
  schedules FacultySchedule[]
}

model Faculty {
  id            String              @id @default(uuid())
  userId        String              @unique
  departmentId  String
  employeeId    String              @unique
  designation   String
  joiningDate   DateTime
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
  user          User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  department    Department          @relation(fields: [departmentId], references: [id])
  profile       FacultyProfile?
  schedules     FacultySchedule[]
  availability  FacultyAvailability?
  requests      FacultyRequest[]
  notifications FacultyNotification[]

  @@index([departmentId])
}

model FacultyProfile {
  id                String   @id @default(uuid())
  facultyId         String   @unique
  bio               String?
  phone             String?
  officeLocation    String?
  officeHours       String?
  researchInterests String[] @default([])
  qualifications    String[] @default([])
  publications      String[] @default([])
  socialLinks       Json     @default("{}")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  faculty           Faculty  @relation(fields: [facultyId], references: [id], onDelete: Cascade)
}

model FacultySchedule {
  id           String           @id @default(uuid())
  facultyId    String
  courseId      String
  roomId       String
  dayOfWeek    DayOfWeek
  startTime    String
  endTime      String
  type         ScheduleItemType @default(LECTURE)
  section      String?
  program      String?
  semester     Int?
  academicYear String           @default("2024-2025")
  isActive     Boolean          @default(true)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  faculty      Faculty          @relation(fields: [facultyId], references: [id], onDelete: Cascade)
  course       Course           @relation(fields: [courseId], references: [id])
  room         Room             @relation(fields: [roomId], references: [id])

  @@index([facultyId, dayOfWeek])
  @@index([facultyId, isActive])
}

model FacultyAvailability {
  id               String          @id @default(uuid())
  facultyId        String          @unique
  preferredSlot    PreferredSlot   @default(ANY)
  customStartTime  String?
  customEndTime    String?
  unavailableStart String?
  unavailableEnd   String?
  notes            String?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  faculty          Faculty         @relation(fields: [facultyId], references: [id], onDelete: Cascade)
  days             FacultyAvailabilityDay[]
}

model FacultyAvailabilityDay {
  id             String              @id @default(uuid())
  availabilityId String
  dayOfWeek      DayOfWeek
  isAvailable    Boolean             @default(true)
  availability   FacultyAvailability @relation(fields: [availabilityId], references: [id], onDelete: Cascade)

  @@unique([availabilityId, dayOfWeek])
}

model FacultyRequest {
  id               String                 @id @default(uuid())
  facultyId        String
  type             RequestType
  status           RequestStatus          @default(PENDING)
  title            String
  description      String?
  requestDate      DateTime               @default(now())
  effectiveDate    DateTime
  endDate          DateTime?
  targetFacultyId  String?
  targetScheduleId String?
  newDate          DateTime?
  newStartTime     String?
  newEndTime       String?
  reason           String
  createdAt        DateTime               @default(now())
  updatedAt        DateTime               @updatedAt
  faculty          Faculty                @relation(fields: [facultyId], references: [id], onDelete: Cascade)
  timeline         FacultyRequestTimeline[]

  @@index([facultyId, status])
  @@index([facultyId, type])
}

model FacultyRequestTimeline {
  id        String        @id @default(uuid())
  requestId String
  status    RequestStatus
  comment   String?
  createdBy String
  createdAt DateTime      @default(now())
  request   FacultyRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)

  @@index([requestId])
}

model FacultyNotification {
  id        String           @id @default(uuid())
  facultyId String
  type      NotificationType
  title     String
  message   String
  isRead    Boolean          @default(false)
  link      String?
  createdAt DateTime         @default(now())
  faculty   Faculty          @relation(fields: [facultyId], references: [id], onDelete: Cascade)

  @@index([facultyId, isRead])
  @@index([facultyId, createdAt])
}
prisma/seed.ts
TypeScript

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Department
  const csDept = await prisma.department.upsert({
    where: { code: "CS" },
    update: {},
    create: {
      name: "Computer Science",
      code: "CS",
      description: "Department of Computer Science and Engineering",
    },
  });

  console.log("✅ Department created:", csDept.name);

  // Create Courses
  const courses = [
    { name: "Machine Learning", code: "CS501", description: "Introduction to ML algorithms", credits: 4 },
    { name: "Deep Learning", code: "CS502", description: "Neural networks and deep learning", credits: 4 },
    { name: "Data Structures", code: "CS201", description: "Fundamental data structures", credits: 3 },
    { name: "Algorithms", code: "CS301", description: "Algorithm design and analysis", credits: 3 },
    { name: "Database Systems", code: "CS401", description: "Database design and SQL", credits: 3 },
    { name: "Web Development", code: "CS302", description: "Full-stack web development", credits: 3 },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { code: course.code },
      update: {},
      create: { ...course, departmentId: csDept.id },
    });
  }

  console.log("✅ Courses created:", courses.length);

  // Create Rooms
  const rooms = [
    { name: "LH-101", building: "Main Block", floor: 1, capacity: 120, type: "lecture_hall" },
    { name: "LAB-201", building: "IT Block", floor: 2, capacity: 40, type: "computer_lab" },
    { name: "CR-301", building: "Main Block", floor: 3, capacity: 60, type: "classroom" },
    { name: "SEM-102", building: "Research Block", floor: 1, capacity: 30, type: "seminar_hall" },
    { name: "CR-202", building: "IT Block", floor: 2, capacity: 50, type: "classroom" },
  ];

  for (const room of rooms) {
    const existing = await prisma.room.findFirst({ where: { name: room.name, building: room.building } });
    if (!existing) {
      await prisma.room.create({ data: room });
    }
  }

  console.log("✅ Rooms created:", rooms.length);
  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
Add to package.json:

JSON

{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "scripts": {
    "db:push": "prisma db push",
    "db:generate": "prisma generate",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  }
}
5. Authentication (Better Auth) — CRITICAL SECTION
⚠️ This is where most runtime errors occur. Follow EXACTLY.

lib/prisma.ts
TypeScript

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
lib/auth.ts — Server-side auth (ONLY import in server code)
TypeScript

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,   // 7 days
    updateAge: 60 * 60 * 24,         // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,                // 5 minutes
    },
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],
});
lib/auth-client.ts — Client-side auth (ONLY import in client components)
TypeScript

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});
app/api/auth/[...all]/route.ts — Auth API handler
TypeScript

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
middleware.ts — Route protection
⚠️ DO NOT call auth.api.getSession() here. Middleware runs on Edge runtime. Only check cookie existence.

TypeScript

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session cookie
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  const isAuthenticated = !!sessionCookie?.value;

  // Protect /faculty routes
  if (pathname.startsWith("/faculty")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /api/faculty routes
  if (pathname.startsWith("/api/faculty")) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }
  }

  // Redirect authenticated users away from login/signup
  if (pathname === "/login" || pathname === "/signup") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/faculty/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/faculty/:path*", "/api/faculty/:path*", "/login", "/signup"],
};
lib/api/auth-helper.ts — Shared helper for API routes
⚠️ KEY: In Next.js 15, headers() is async. You MUST await it.

TypeScript

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function getAuthenticatedFaculty() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return {
        error: NextResponse.json(
          { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
          { status: 401 }
        ),
      };
    }

    let faculty = await prisma.faculty.findUnique({
      where: { userId: session.user.id },
      include: {
        department: true,
        profile: true,
        availability: { include: { days: true } },
      },
    });

    // Auto-create faculty record if it doesn't exist
    if (!faculty) {
      let dept = await prisma.department.findFirst();
      if (!dept) {
        dept = await prisma.department.create({
          data: { name: "General", code: "GEN", description: "General Department" },
        });
      }

      faculty = await prisma.faculty.create({
        data: {
          userId: session.user.id,
          departmentId: dept.id,
          employeeId: `EMP-${Date.now()}`,
          designation: "Assistant Professor",
          joiningDate: new Date(),
          profile: { create: {} },
          availability: {
            create: {
              preferredSlot: "ANY",
              days: {
                create: [
                  { dayOfWeek: "MONDAY", isAvailable: true },
                  { dayOfWeek: "TUESDAY", isAvailable: true },
                  { dayOfWeek: "WEDNESDAY", isAvailable: true },
                  { dayOfWeek: "THURSDAY", isAvailable: true },
                  { dayOfWeek: "FRIDAY", isAvailable: true },
                  { dayOfWeek: "SATURDAY", isAvailable: false },
                  { dayOfWeek: "SUNDAY", isAvailable: false },
                ],
              },
            },
          },
        },
        include: {
          department: true,
          profile: true,
          availability: { include: { days: true } },
        },
      });

      // Create welcome notification
      await prisma.facultyNotification.create({
        data: {
          facultyId: faculty.id,
          type: "SYSTEM",
          title: "Welcome to FacultyHub!",
          message: "Your account has been set up. Start by updating your profile and availability.",
          link: "/faculty/profile",
        },
      });
    }

    return { session, faculty };
  } catch (error) {
    console.error("Auth helper error:", error);
    return {
      error: NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: "Authentication failed" } },
        { status: 500 }
      ),
    };
  }
}
6. Utility Files
lib/utils.ts
TypeScript

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export function getDayName(day: string): string {
  const map: Record<string, string> = {
    MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday",
    THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday", SUNDAY: "Sunday",
  };
  return map[day] || day;
}

export function getDayShort(day: string): string {
  const map: Record<string, string> = {
    MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed",
    THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
  };
  return map[day] || day;
}

export function getScheduleTypeColor(type: string): string {
  const map: Record<string, string> = {
    LECTURE: "bg-blue-100 text-blue-800 border-blue-200",
    LAB: "bg-green-100 text-green-800 border-green-200",
    TUTORIAL: "bg-purple-100 text-purple-800 border-purple-200",
    SEMINAR: "bg-amber-100 text-amber-800 border-amber-200",
    OFFICE_HOURS: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return map[type] || "bg-gray-100 text-gray-800";
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    WITHDRAWN: "bg-gray-100 text-gray-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

export function getStatusDot(status: string): string {
  const map: Record<string, string> = {
    PENDING: "bg-amber-500",
    APPROVED: "bg-green-500",
    REJECTED: "bg-red-500",
    WITHDRAWN: "bg-gray-500",
  };
  return map[status] || "bg-gray-500";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getTodayDayOfWeek(): string {
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  return days[new Date().getDay()];
}
lib/types/index.ts
TypeScript

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface DashboardData {
  summary: {
    classesThisWeek: number;
    totalStudents: number;
    pendingRequests: number;
    officeHours: string;
  };
  todaySchedule: ScheduleItem[];
  upcomingSchedule: ScheduleItem[];
  recentNotifications: NotificationItem[];
  faculty: {
    name: string;
    designation: string;
    department: string;
    employeeId: string;
  };
}

export interface ScheduleItem {
  id: string;
  courseCode: string;
  courseName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomName: string;
  building: string;
  type: string;
  section?: string | null;
  program?: string | null;
  semester?: number | null;
}

export interface ProfileData {
  id: string;
  facultyId: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  departmentCode: string;
  employeeId: string;
  joiningDate: string;
  avatarUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
  officeLocation?: string | null;
  officeHours?: string | null;
  researchInterests: string[];
  qualifications: string[];
  publications: string[];
  socialLinks: Record<string, string>;
}

export interface AvailabilityData {
  id: string;
  preferredSlot: string;
  customStartTime?: string | null;
  customEndTime?: string | null;
  unavailableStart?: string | null;
  unavailableEnd?: string | null;
  notes?: string | null;
  days: { dayOfWeek: string; isAvailable: boolean }[];
}

export interface RequestItem {
  id: string;
  type: string;
  status: string;
  title: string;
  description?: string | null;
  requestDate: string;
  effectiveDate: string;
  endDate?: string | null;
  reason: string;
  targetFacultyId?: string | null;
  targetScheduleId?: string | null;
  newDate?: string | null;
  newStartTime?: string | null;
  newEndTime?: string | null;
  timeline: {
    id: string;
    status: string;
    comment?: string | null;
    createdAt: string;
  }[];
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface ClassOption {
  id: string;
  label: string;
  courseCode: string;
  courseName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface ColleagueOption {
  id: string;
  name: string;
  department: string;
  designation: string;
}
lib/validations/profile.ts
TypeScript

import { z } from "zod";

export const updateProfileSchema = z.object({
  bio: z.string().max(1000).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  officeLocation: z.string().max(200).nullable().optional(),
  officeHours: z.string().max(500).nullable().optional(),
  researchInterests: z.array(z.string().max(100)).max(20).optional(),
  qualifications: z.array(z.string().max(200)).max(10).optional(),
  publications: z.array(z.string().max(500)).max(50).optional(),
  socialLinks: z.record(z.string().url().or(z.literal(""))).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
lib/validations/availability.ts
TypeScript

import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const updateAvailabilitySchema = z.object({
  preferredSlot: z.enum(["MORNING", "AFTERNOON", "EVENING", "ANY"]),
  customStartTime: z.string().regex(timeRegex).nullable().optional(),
  customEndTime: z.string().regex(timeRegex).nullable().optional(),
  unavailableStart: z.string().regex(timeRegex).nullable().optional(),
  unavailableEnd: z.string().regex(timeRegex).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  days: z.array(z.object({
    dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
    isAvailable: z.boolean(),
  })).length(7),
});

export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
lib/validations/requests.ts
TypeScript

import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createSwapRequestSchema = z.object({
  myScheduleId: z.string().uuid(),
  targetFacultyId: z.string().uuid(),
  targetScheduleId: z.string().uuid(),
  effectiveDate: z.string().regex(dateRegex),
  reason: z.string().min(10).max(1000),
});

export const createRescheduleRequestSchema = z.object({
  scheduleId: z.string().uuid(),
  newDate: z.string().regex(dateRegex),
  newStartTime: z.string().regex(timeRegex),
  newEndTime: z.string().regex(timeRegex),
  reason: z.string().min(10).max(1000),
}).refine((data) => data.newStartTime < data.newEndTime, {
  message: "Start time must be before end time",
  path: ["newEndTime"],
});

export const createLeaveRequestSchema = z.object({
  effectiveDate: z.string().regex(dateRegex),
  endDate: z.string().regex(dateRegex),
  reason: z.string().min(10).max(1000),
}).refine((data) => data.endDate >= data.effectiveDate, {
  message: "End date must be on or after start date",
  path: ["endDate"],
});

export type CreateSwapRequestInput = z.infer<typeof createSwapRequestSchema>;
export type CreateRescheduleRequestInput = z.infer<typeof createRescheduleRequestSchema>;
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
lib/api/fetcher.ts
TypeScript

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: "Request failed" } }));
    throw new Error(error.error?.message || "Request failed");
  }
  const json = await res.json();
  return json.data ?? json;
}

export async function mutationFetcher<T>(
  url: string,
  { arg }: { arg: { method?: string; body?: unknown } }
): Promise<T> {
  const res = await fetch(url, {
    method: arg.method || "POST",
    headers: { "Content-Type": "application/json" },
    body: arg.body ? JSON.stringify(arg.body) : undefined,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: "Request failed" } }));
    throw new Error(error.error?.message || "Request failed");
  }
  const json = await res.json();
  return json.data ?? json;
}
7. API Routes
app/api/faculty/dashboard/route.ts
TypeScript

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedFaculty } from "@/lib/api/auth-helper";
import { getTodayDayOfWeek } from "@/lib/utils";

export async function GET() {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { session, faculty } = result;

  const today = getTodayDayOfWeek();
  const allDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

  const todaySchedule = await prisma.facultySchedule.findMany({
    where: { facultyId: faculty.id, dayOfWeek: today as any, isActive: true },
    include: { course: true, room: true },
    orderBy: { startTime: "asc" },
  });

  const weekSchedule = await prisma.facultySchedule.findMany({
    where: { facultyId: faculty.id, isActive: true },
    include: { course: true, room: true },
  });

  const pendingRequests = await prisma.facultyRequest.count({
    where: { facultyId: faculty.id, status: "PENDING" },
  });

  const recentNotifications = await prisma.facultyNotification.findMany({
    where: { facultyId: faculty.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const data = {
    summary: {
      classesThisWeek: weekSchedule.length,
      totalStudents: weekSchedule.length * 35,
      pendingRequests,
      officeHours: faculty.profile?.officeHours || "Not set",
    },
    todaySchedule: todaySchedule.map((s) => ({
      id: s.id,
      courseCode: s.course.code,
      courseName: s.course.name,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      roomName: s.room.name,
      building: s.room.building,
      type: s.type,
      section: s.section,
      program: s.program,
      semester: s.semester,
    })),
    upcomingSchedule: weekSchedule.map((s) => ({
      id: s.id,
      courseCode: s.course.code,
      courseName: s.course.name,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      roomName: s.room.name,
      building: s.room.building,
      type: s.type,
      section: s.section,
      program: s.program,
      semester: s.semester,
    })),
    recentNotifications: recentNotifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      link: n.link,
      createdAt: n.createdAt.toISOString(),
    })),
    faculty: {
      name: session.user.name,
      designation: faculty.designation,
      department: faculty.department.name,
      employeeId: faculty.employeeId,
    },
  };

  return NextResponse.json({ success: true, data });
}
app/api/faculty/profile/route.ts
TypeScript

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedFaculty } from "@/lib/api/auth-helper";
import { updateProfileSchema } from "@/lib/validations/profile";

export async function GET() {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { session, faculty } = result;

  const data = {
    id: faculty.profile?.id || "",
    facultyId: faculty.id,
    name: session.user.name,
    email: session.user.email,
    designation: faculty.designation,
    department: faculty.department.name,
    departmentCode: faculty.department.code,
    employeeId: faculty.employeeId,
    joiningDate: faculty.joiningDate.toISOString(),
    avatarUrl: session.user.image,
    bio: faculty.profile?.bio || null,
    phone: faculty.profile?.phone || null,
    officeLocation: faculty.profile?.officeLocation || null,
    officeHours: faculty.profile?.officeHours || null,
    researchInterests: faculty.profile?.researchInterests || [],
    qualifications: faculty.profile?.qualifications || [],
    publications: faculty.profile?.publications || [],
    socialLinks: (faculty.profile?.socialLinks as Record<string, string>) || {},
  };

  return NextResponse.json({ success: true, data });
}

export async function PUT(request: Request) {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty } = result;

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  const updated = await prisma.facultyProfile.update({
    where: { facultyId: faculty.id },
    data: parsed.data,
  });

  return NextResponse.json({ success: true, data: updated });
}
app/api/faculty/timetable/route.ts
TypeScript

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedFaculty } from "@/lib/api/auth-helper";

export async function GET(request: Request) {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty } = result;

  const { searchParams } = new URL(request.url);
  const courseCode = searchParams.get("courseCode");
  const program = searchParams.get("program");

  const where: any = { facultyId: faculty.id, isActive: true };
  if (courseCode) where.course = { code: courseCode };
  if (program) where.program = program;

  const schedules = await prisma.facultySchedule.findMany({
    where,
    include: { course: true, room: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const data = schedules.map((s) => ({
    id: s.id,
    courseCode: s.course.code,
    courseName: s.course.name,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    roomName: s.room.name,
    building: s.room.building,
    type: s.type,
    section: s.section,
    program: s.program,
    semester: s.semester,
  }));

  return NextResponse.json({ success: true, data });
}
app/api/faculty/timetable/today/route.ts
TypeScript

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedFaculty } from "@/lib/api/auth-helper";
import { getTodayDayOfWeek } from "@/lib/utils";

export async function GET() {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty } = result;

  const today = getTodayDayOfWeek();

  const schedules = await prisma.facultySchedule.findMany({
    where: { facultyId: faculty.id, dayOfWeek: today as any, isActive: true },
    include: { course: true, room: true },
    orderBy: { startTime: "asc" },
  });

  const data = schedules.map((s) => ({
    id: s.id,
    courseCode: s.course.code,
    courseName: s.course.name,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    roomName: s.room.name,
    building: s.room.building,
    type: s.type,
    section: s.section,
    program: s.program,
    semester: s.semester,
  }));

  return NextResponse.json({ success: true, data });
}
app/api/faculty/timetable/upcoming/route.ts
TypeScript

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedFaculty } from "@/lib/api/auth-helper";

export async function GET(request: Request) {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty } = result;

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10");

  const schedules = await prisma.facultySchedule.findMany({
    where: { facultyId: faculty.id, isActive: true },
    include: { course: true, room: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    take: limit,
  });

  const data = schedules.map((s) => ({
    id: s.id,
    courseCode: s.course.code,
    courseName: s.course.name,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    roomName: s.room.name,
    building: s.room.building,
    type: s.type,
    section: s.section,
    program: s.program,
    semester: s.semester,
  }));

  return NextResponse.json({ success: true, data });
}
app/api/faculty/availability/route.ts
TypeScript

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedFaculty } from "@/lib/api/auth-helper";
import { updateAvailabilitySchema } from "@/lib/validations/availability";

export async function GET() {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty } = result;

  const availability = await prisma.facultyAvailability.findUnique({
    where: { facultyId: faculty.id },
    include: { days: { orderBy: { dayOfWeek: "asc" } } },
  });

  if (!availability) {
    return NextResponse.json({ success: true, data: null });
  }

  const data = {
    id: availability.id,
    preferredSlot: availability.preferredSlot,
    customStartTime: availability.customStartTime,
    customEndTime: availability.customEndTime,
    unavailableStart: availability.unavailableStart,
    unavailableEnd: availability.unavailableEnd,
    notes: availability.notes,
    days: availability.days.map((d) => ({
      dayOfWeek: d.dayOfWeek,
      isAvailable: d.isAvailable,
    })),
  };

  return NextResponse.json({ success: true, data });
}

export async function PUT(request: Request) {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty } = result;

  const body = await request.json();
  const parsed = updateAvailabilitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  const { days, ...availabilityData } = parsed.data;

  const availability = await prisma.facultyAvailability.upsert({
    where: { facultyId: faculty.id },
    update: availabilityData,
    create: { facultyId: faculty.id, ...availabilityData },
  });

  // Update days
  for (const day of days) {
    await prisma.facultyAvailabilityDay.upsert({
      where: {
        availabilityId_dayOfWeek: {
          availabilityId: availability.id,
          dayOfWeek: day.dayOfWeek as any,
        },
      },
      update: { isAvailable: day.isAvailable },
      create: {
        availabilityId: availability.id,
        dayOfWeek: day.dayOfWeek as any,
        isAvailable: day.isAvailable,
      },
    });
  }

  return NextResponse.json({ success: true, data: { message: "Availability updated" } });
}
app/api/faculty/requests/route.ts
TypeScript

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedFaculty } from "@/lib/api/auth-helper";

export async function GET(request: Request) {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty } = result;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

  const where: any = { facultyId: faculty.id };
  if (status) where.status = status;
  if (type) where.type = type;

  const [requests, total] = await Promise.all([
    prisma.facultyRequest.findMany({
      where,
      include: { timeline: { orderBy: { createdAt: "desc" } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.facultyRequest.count({ where }),
  ]);

  const data = requests.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    title: r.title,
    description: r.description,
    requestDate: r.requestDate.toISOString(),
    effectiveDate: r.effectiveDate.toISOString(),
    endDate: r.endDate?.toISOString() || null,
    reason: r.reason,
    targetFacultyId: r.targetFacultyId,
    targetScheduleId: r.targetScheduleId,
    newDate: r.newDate?.toISOString() || null,
    newStartTime: r.newStartTime,
    newEndTime: r.newEndTime,
    timeline: r.timeline.map((t) => ({
      id: t.id,
      status: t.status,
      comment: t.comment,
      createdAt: t.createdAt.toISOString(),
    })),
  }));

  return NextResponse.json({ success: true, data, total, page, limit });
}
app/api/faculty/requests/[id]/route.ts
TypeScript

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedFaculty } from "@/lib/api/auth-helper";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty } = result;
  const { id } = await params;

  const request = await prisma.facultyRequest.findFirst({
    where: { id, facultyId: faculty.id },
    include: { timeline: { orderBy: { createdAt: "desc" } } },
  });

  if (!request) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Request not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: request });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty, session } = result;
  const { id } = await params;

  const body = await req.json();

  const existing = await prisma.facultyRequest.findFirst({
    where: { id, facultyId: faculty.id },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Request not found" } },
      { status: 404 }
    );
  }

  if (body.status === "WITHDRAWN" && existing.status === "PENDING") {
    await prisma.facultyRequest.update({
      where: { id },
      data: { status: "WITHDRAWN" },
    });

    await prisma.facultyRequestTimeline.create({
      data: {
        requestId: id,
        status: "WITHDRAWN",
        comment: "Withdrawn by faculty",
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({ success: true, data: { message: "Request withdrawn" } });
  }

  return NextResponse.json(
    { success: false, error: { code: "INVALID_ACTION", message: "Cannot perform this action" } },
    { status: 400 }
  );
}
app/api/faculty/requests/swap/route.ts
TypeScript

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedFaculty } from "@/lib/api/auth-helper";
import { createSwapRequestSchema } from "@/lib/validations/requests";

export async function POST(request: Request) {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty, session } = result;

  const body = await request.json();
  const parsed = createSwapRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  const { myScheduleId, targetFacultyId, targetScheduleId, effectiveDate, reason } = parsed.data;

  const mySchedule = await prisma.facultySchedule.findFirst({
    where: { id: myScheduleId, facultyId: faculty.id },
    include: { course: true },
  });

  if (!mySchedule) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Your schedule not found" } },
      { status: 404 }
    );
  }

  const newRequest = await prisma.facultyRequest.create({
    data: {
      facultyId: faculty.id,
      type: "SWAP",
      title: `Swap: ${mySchedule.course.code}`,
      description: `Request to swap ${mySchedule.course.name} class`,
      effectiveDate: new Date(effectiveDate),
      targetFacultyId,
      targetScheduleId,
      reason,
    },
  });

  await prisma.facultyRequestTimeline.create({
    data: {
      requestId: newRequest.id,
      status: "PENDING",
      comment: "Request submitted",
      createdBy: session.user.id,
    },
  });

  return NextResponse.json({ success: true, data: newRequest }, { status: 201 });
}
app/api/faculty/requests/reschedule/route.ts
TypeScript

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedFaculty } from "@/lib/api/auth-helper";
import { createRescheduleRequestSchema } from "@/lib/validations/requests";

export async function POST(request: Request) {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty, session } = result;

  const body = await request.json();
  const parsed = createRescheduleRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  const { scheduleId, newDate, newStartTime, newEndTime, reason } = parsed.data;

  const schedule = await prisma.facultySchedule.findFirst({
    where: { id: scheduleId, facultyId: faculty.id },
    include: { course: true },
  });

  if (!schedule) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Schedule not found" } },
      { status: 404 }
    );
  }

  const newRequest = await prisma.facultyRequest.create({
    data: {
      facultyId: faculty.id,
      type: "RESCHEDULE",
      title: `Reschedule: ${schedule.course.code}`,
      description: `Reschedule ${schedule.course.name} class`,
      effectiveDate: new Date(newDate),
      newDate: new Date(newDate),
      newStartTime,
      newEndTime,
      reason,
    },
  });

  await prisma.facultyRequestTimeline.create({
    data: {
      requestId: newRequest.id,
      status: "PENDING",
      comment: "Reschedule request submitted",
      createdBy: session.user.id,
    },
  });

  return NextResponse.json({ success: true, data: newRequest }, { status: 201 });
}
app/api/faculty/requests/leave/route.ts
TypeScript

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedFaculty } from "@/lib/api/auth-helper";
import { createLeaveRequestSchema } from "@/lib/validations/requests";

export async function POST(request: Request) {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty, session } = result;

  const body = await request.json();
  const parsed = createLeaveRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  const { effectiveDate, endDate, reason } = parsed.data;

  const newRequest = await prisma.facultyRequest.create({
    data: {
      facultyId: faculty.id,
      type: "LEAVE",
      title: "Leave Request",
      description: `Leave from ${effectiveDate} to ${endDate}`,
      effectiveDate: new Date(effectiveDate),
      endDate: new Date(endDate),
      reason,
    },
  });

  await prisma.facultyRequestTimeline.create({
    data: {
      requestId: newRequest.id,
      status: "PENDING",
      comment: "Leave request submitted",
      createdBy: session.user.id,
    },
  });

  return NextResponse.json({ success: true, data: newRequest }, { status: 201 });
}
app/api/faculty/notifications/route.ts
TypeScript

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedFaculty } from "@/lib/api/auth-helper";

export async function GET(request: Request) {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty } = result;

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

  const where: any = { facultyId: faculty.id };
  if (unreadOnly) where.isRead = false;

  const [notifications, total] = await Promise.all([
    prisma.facultyNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.facultyNotification.count({ where }),
  ]);

  const data = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    link: n.link,
    createdAt: n.createdAt.toISOString(),
  }));

  return NextResponse.json({ success: true, data, total, page, limit });
}
app/api/faculty/notifications/unread-count/route.ts
TypeScript

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedFaculty } from "@/lib/api/auth-helper";

export async function GET() {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty } = result;

  const count = await prisma.facultyNotification.count({
    where: { facultyId: faculty.id, isRead: false },
  });

  return NextResponse.json({ success: true, data: { count } });
}
app/api/faculty/notifications/[id]/read/route.ts
TypeScript

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedFaculty } from "@/lib/api/auth-helper";

export async function PUT(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty } = result;
  const { id } = await params;

  await prisma.facultyNotification.updateMany({
    where: { id, facultyId: faculty.id },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true, data: { message: "Marked as read" } });
}
app/api/faculty/notifications/read-all/route.ts
TypeScript

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedFaculty } from "@/lib/api/auth-helper";

export async function PUT() {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty } = result;

  await prisma.facultyNotification.updateMany({
    where: { facultyId: faculty.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true, data: { message: "All marked as read" } });
}
app/api/faculty/classes/options/route.ts
TypeScript

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedFaculty } from "@/lib/api/auth-helper";

export async function GET() {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty } = result;

  const schedules = await prisma.facultySchedule.findMany({
    where: { facultyId: faculty.id, isActive: true },
    include: { course: true },
  });

  const data = schedules.map((s) => ({
    id: s.id,
    label: `${s.course.code} - ${s.course.name} (${s.dayOfWeek} ${s.startTime}-${s.endTime})`,
    courseCode: s.course.code,
    courseName: s.course.name,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
  }));

  return NextResponse.json({ success: true, data });
}
app/api/faculty/colleagues/options/route.ts
TypeScript

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedFaculty } from "@/lib/api/auth-helper";

export async function GET() {
  const result = await getAuthenticatedFaculty();
  if ("error" in result) return result.error;
  const { faculty } = result;

  const colleagues = await prisma.faculty.findMany({
    where: { id: { not: faculty.id } },
    include: { user: true, department: true },
    take: 50,
  });

  const data = colleagues.map((c) => ({
    id: c.id,
    name: c.user.name,
    department: c.department.name,
    designation: c.designation,
  }));

  return NextResponse.json({ success: true, data });
}
8. Custom Hooks
hooks/use-dashboard.ts
TypeScript

import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";
import type { DashboardData } from "@/lib/types";

export function useDashboard() {
  return useSWR<DashboardData>("/api/faculty/dashboard", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });
}

export function useUnreadCount() {
  return useSWR<{ count: number }>("/api/faculty/notifications/unread-count", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });
}
hooks/use-profile.ts
TypeScript

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { fetcher, mutationFetcher } from "@/lib/api/fetcher";
import type { ProfileData } from "@/lib/types";

export function useProfile() {
  return useSWR<ProfileData>("/api/faculty/profile", fetcher, {
    revalidateOnFocus: false,
  });
}

export function useUpdateProfile() {
  return useSWRMutation("/api/faculty/profile", (url: string, { arg }: { arg: any }) =>
    mutationFetcher(url, { arg: { method: "PUT", body: arg } })
  );
}
hooks/use-timetable.ts
TypeScript

import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";
import type { ScheduleItem } from "@/lib/types";

export function useTimetable(params?: { courseCode?: string; program?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.courseCode) searchParams.set("courseCode", params.courseCode);
  if (params?.program) searchParams.set("program", params.program);
  const query = searchParams.toString();
  const url = `/api/faculty/timetable${query ? `?${query}` : ""}`;

  return useSWR<ScheduleItem[]>(url, fetcher, { revalidateOnFocus: false });
}

export function useTodaySchedule() {
  return useSWR<ScheduleItem[]>("/api/faculty/timetable/today", fetcher, {
    revalidateOnFocus: false,
  });
}

export function useUpcomingSchedule(limit = 10) {
  return useSWR<ScheduleItem[]>(`/api/faculty/timetable/upcoming?limit=${limit}`, fetcher, {
    revalidateOnFocus: false,
  });
}
hooks/use-availability.ts
TypeScript

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { fetcher, mutationFetcher } from "@/lib/api/fetcher";
import type { AvailabilityData } from "@/lib/types";

export function useAvailability() {
  return useSWR<AvailabilityData>("/api/faculty/availability", fetcher, {
    revalidateOnFocus: false,
  });
}

export function useUpdateAvailability() {
  return useSWRMutation("/api/faculty/availability", (url: string, { arg }: { arg: any }) =>
    mutationFetcher(url, { arg: { method: "PUT", body: arg } })
  );
}
hooks/use-requests.ts
TypeScript

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { fetcher, mutationFetcher } from "@/lib/api/fetcher";
import type { RequestItem } from "@/lib/types";

export function useRequests(params?: { status?: string; type?: string; page?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.type) searchParams.set("type", params.type);
  if (params?.page) searchParams.set("page", params.page.toString());
  const query = searchParams.toString();

  return useSWR<RequestItem[]>(`/api/faculty/requests${query ? `?${query}` : ""}`, fetcher, {
    revalidateOnFocus: false,
  });
}

export function useCreateSwapRequest() {
  return useSWRMutation("/api/faculty/requests/swap", (url: string, { arg }: { arg: any }) =>
    mutationFetcher(url, { arg: { method: "POST", body: arg } })
  );
}

export function useCreateRescheduleRequest() {
  return useSWRMutation("/api/faculty/requests/reschedule", (url: string, { arg }: { arg: any }) =>
    mutationFetcher(url, { arg: { method: "POST", body: arg } })
  );
}

export function useCreateLeaveRequest() {
  return useSWRMutation("/api/faculty/requests/leave", (url: string, { arg }: { arg: any }) =>
    mutationFetcher(url, { arg: { method: "POST", body: arg } })
  );
}

export function useWithdrawRequest() {
  return useSWRMutation(
    "/api/faculty/requests",
    (url: string, { arg }: { arg: { id: string } }) =>
      mutationFetcher(`${url}/${arg.id}`, { arg: { method: "PUT", body: { status: "WITHDRAWN" } } })
  );
}
hooks/use-notifications.ts
TypeScript

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { fetcher, mutationFetcher } from "@/lib/api/fetcher";
import type { NotificationItem } from "@/lib/types";

export function useNotifications(params?: { unreadOnly?: boolean; page?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.unreadOnly) searchParams.set("unreadOnly", "true");
  if (params?.page) searchParams.set("page", params.page.toString());
  const query = searchParams.toString();

  return useSWR<NotificationItem[]>(`/api/faculty/notifications${query ? `?${query}` : ""}`, fetcher, {
    revalidateOnFocus: false,
  });
}

export function useMarkNotificationAsRead() {
  return useSWRMutation(
    "/api/faculty/notifications",
    (_: string, { arg }: { arg: { id: string } }) =>
      mutationFetcher(`/api/faculty/notifications/${arg.id}/read`, { arg: { method: "PUT" } })
  );
}

export function useMarkAllNotificationsAsRead() {
  return useSWRMutation("/api/faculty/notifications/read-all", (url: string) =>
    mutationFetcher(url, { arg: { method: "PUT" } })
  );
}
hooks/use-options.ts
TypeScript

import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";
import type { ClassOption, ColleagueOption } from "@/lib/types";

export function useClassOptions() {
  return useSWR<ClassOption[]>("/api/faculty/classes/options", fetcher, {
    revalidateOnFocus: false,
  });
}

export function useColleagueOptions() {
  return useSWR<ColleagueOption[]>("/api/faculty/colleagues/options", fetcher, {
    revalidateOnFocus: false,
  });
}
9. Components
components/faculty/faculty-sidebar.tsx
React

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Calendar, FileText, User, Clock, Bell, GraduationCap,
} from "lucide-react";

const navItems = [
  { href: "/faculty/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/faculty/timetable", label: "Timetable", icon: Calendar },
  { href: "/faculty/requests", label: "Requests", icon: FileText },
  { href: "/faculty/profile", label: "Profile", icon: User },
  { href: "/faculty/availability", label: "Availability", icon: Clock },
  { href: "/faculty/notifications", label: "Notifications", icon: Bell },
];

export function FacultySidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
        <GraduationCap className="h-7 w-7 text-blue-600" />
        <div>
          <h1 className="text-lg font-bold text-gray-900">FacultyHub</h1>
          <p className="text-xs text-gray-500">Faculty Management</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-gray-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
components/faculty/faculty-header.tsx
React

"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useUnreadCount } from "@/hooks/use-dashboard";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, User, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function FacultyHeader() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { data: unreadData } = useUnreadCount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const userName = session?.user?.name || "User";
  const unreadCount = unreadData?.count || 0;

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">
          Faculty Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/faculty/notifications" className="relative p-2 rounded-lg hover:bg-gray-100">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                  {isPending ? "..." : getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{userName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/faculty/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b shadow-lg z-50 p-4 md:hidden">
          <nav className="space-y-2">
            {[
              { href: "/faculty/dashboard", label: "Dashboard" },
              { href: "/faculty/timetable", label: "Timetable" },
              { href: "/faculty/requests", label: "Requests" },
              { href: "/faculty/profile", label: "Profile" },
              { href: "/faculty/availability", label: "Availability" },
              { href: "/faculty/notifications", label: "Notifications" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
components/faculty/dashboard-cards.tsx
React

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, FileText, Clock } from "lucide-react";

interface DashboardCardsProps {
  summary: {
    classesThisWeek: number;
    totalStudents: number;
    pendingRequests: number;
    officeHours: string;
  };
}

const cards = [
  { key: "classesThisWeek", label: "Classes This Week", icon: Calendar, color: "text-blue-600 bg-blue-50" },
  { key: "totalStudents", label: "Total Students", icon: Users, color: "text-green-600 bg-green-50" },
  { key: "pendingRequests", label: "Pending Requests", icon: FileText, color: "text-amber-600 bg-amber-50" },
  { key: "officeHours", label: "Office Hours", icon: Clock, color: "text-purple-600 bg-purple-50" },
] as const;

export function DashboardCards({ summary }: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const value = summary[card.key];
        return (
          <Card key={card.key} className="border border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
components/faculty/schedule-card.tsx
React

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTime, getScheduleTypeColor, getDayShort } from "@/lib/utils";
import { MapPin, Clock } from "lucide-react";
import type { ScheduleItem } from "@/lib/types";

interface ScheduleCardProps {
  title: string;
  items: ScheduleItem[];
  showDay?: boolean;
  emptyMessage?: string;
}

export function ScheduleCard({ title, items, showDay = false, emptyMessage = "No classes scheduled" }: ScheduleCardProps) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">{emptyMessage}</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className={`px-2 py-1 rounded text-xs font-medium border ${getScheduleTypeColor(item.type)}`}>
                {item.type}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{item.courseName}</p>
                <p className="text-xs text-gray-500">{item.courseCode}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(item.startTime)} - {formatTime(item.endTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {item.roomName}, {item.building}
                  </span>
                </div>
                {showDay && (
                  <Badge variant="outline" className="mt-1.5 text-xs">
                    {getDayShort(item.dayOfWeek)}
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
components/faculty/timetable-grid.tsx
React

"use client";

import { formatTime, getScheduleTypeColor, getDayName } from "@/lib/utils";
import { MapPin } from "lucide-react";
import type { ScheduleItem } from "@/lib/types";

interface TimetableGridProps {
  items: ScheduleItem[];
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export function TimetableGrid({ items }: TimetableGridProps) {
  const scheduleByDay = DAYS.reduce((acc, day) => {
    acc[day] = items.filter((item) => item.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {DAYS.map((day) => (
        <div key={day} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">{getDayName(day)}</h3>
          </div>
          <div className="p-3 space-y-2 min-h-[100px]">
            {scheduleByDay[day].length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No classes</p>
            ) : (
              scheduleByDay[day].map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-lg border text-xs ${getScheduleTypeColor(item.type)}`}
                >
                  <p className="font-semibold">{item.courseCode}</p>
                  <p className="opacity-80">{item.courseName}</p>
                  <p className="mt-1">{formatTime(item.startTime)} - {formatTime(item.endTime)}</p>
                  <p className="flex items-center gap-1 mt-0.5 opacity-70">
                    <MapPin className="h-3 w-3" />{item.roomName}
                  </p>
                  {item.section && <p className="opacity-70">Sec: {item.section}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
components/faculty/timetable-filters.tsx
React

"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";

interface TimetableFiltersProps {
  courseFilter: string;
  programFilter: string;
  onCourseFilterChange: (value: string) => void;
  onProgramFilterChange: (value: string) => void;
  courses: { code: string; name: string }[];
}

export function TimetableFilters({
  courseFilter, programFilter, onCourseFilterChange, onProgramFilterChange, courses,
}: TimetableFiltersProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filter Schedule</span>
      </div>
      <div className="flex flex-wrap gap-3">
        <Select value={courseFilter} onValueChange={onCourseFilterChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={programFilter} onValueChange={onProgramFilterChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Programs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            <SelectItem value="B.Tech">B.Tech</SelectItem>
            <SelectItem value="M.Tech">M.Tech</SelectItem>
            <SelectItem value="PhD">PhD</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
components/faculty/requests-list.tsx
React

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusColor, getStatusDot } from "@/lib/utils";
import { format } from "date-fns";
import type { RequestItem } from "@/lib/types";

interface RequestsListProps {
  requests: RequestItem[];
  onWithdraw?: (id: string) => void;
  isWithdrawing?: boolean;
}

export function RequestsList({ requests, onWithdraw, isWithdrawing }: RequestsListProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">No requests found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <Card key={req.id} className="border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">{req.title}</h3>
                  <Badge variant="outline" className="text-xs capitalize">{req.type.toLowerCase()}</Badge>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${getStatusDot(req.status)}`} />
                    {req.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{req.reason}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  <span>Submitted: {format(new Date(req.requestDate), "MMM d, yyyy")}</span>
                  <span>Effective: {format(new Date(req.effectiveDate), "MMM d, yyyy")}</span>
                  {req.endDate && <span>End: {format(new Date(req.endDate), "MMM d, yyyy")}</span>}
                </div>
              </div>
              {req.status === "PENDING" && onWithdraw && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onWithdraw(req.id)}
                  disabled={isWithdrawing}
                  className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                >
                  Withdraw
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
components/faculty/leave-request-dialog.tsx
React

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateLeaveRequest } from "@/hooks/use-requests";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";

interface LeaveRequestDialogProps {
  onSuccess?: () => void;
}

export function LeaveRequestDialog({ onSuccess }: LeaveRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const { trigger, isMutating } = useCreateLeaveRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.length < 10) {
      toast.error("Reason must be at least 10 characters");
      return;
    }
    try {
      await trigger({ effectiveDate, endDate, reason });
      toast.success("Leave request submitted!");
      setOpen(false);
      setEffectiveDate("");
      setEndDate("");
      setReason("");
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarDays className="h-4 w-4" /> Leave Request
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Leave</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required min={effectiveDate} />
          </div>
          <div>
            <Label>Reason (min 10 characters)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain your reason..." required minLength={10} />
          </div>
          <Button type="submit" disabled={isMutating} className="w-full">
            {isMutating ? "Submitting..." : "Submit Leave Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
components/faculty/reschedule-request-dialog.tsx
React

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClassOptions } from "@/hooks/use-options";
import { useCreateRescheduleRequest } from "@/hooks/use-requests";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

interface RescheduleRequestDialogProps {
  onSuccess?: () => void;
}

export function RescheduleRequestDialog({ onSuccess }: RescheduleRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [scheduleId, setScheduleId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [reason, setReason] = useState("");
  const { data: classes } = useClassOptions();
  const { trigger, isMutating } = useCreateRescheduleRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.length < 10) {
      toast.error("Reason must be at least 10 characters");
      return;
    }
    try {
      await trigger({ scheduleId, newDate, newStartTime, newEndTime, reason });
      toast.success("Reschedule request submitted!");
      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    }
  };

  const resetForm = () => {
    setScheduleId("");
    setNewDate("");
    setNewStartTime("");
    setNewEndTime("");
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Reschedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Select Class</Label>
            <Select value={scheduleId} onValueChange={setScheduleId} required>
              <SelectTrigger><SelectValue placeholder="Choose class..." /></SelectTrigger>
              <SelectContent>
                {classes?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>New Date</Label>
            <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>New Start Time</Label>
              <Input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} required />
            </div>
            <div>
              <Label>New End Time</Label>
              <Input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label>Reason (min 10 characters)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required minLength={10} />
          </div>
          <Button type="submit" disabled={isMutating} className="w-full">
            {isMutating ? "Submitting..." : "Submit Reschedule Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
components/faculty/swap-request-dialog.tsx
React

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClassOptions, useColleagueOptions } from "@/hooks/use-options";
import { useCreateSwapRequest } from "@/hooks/use-requests";
import { toast } from "sonner";
import { ArrowLeftRight } from "lucide-react";

interface SwapRequestDialogProps {
  onSuccess?: () => void;
}

export function SwapRequestDialog({ onSuccess }: SwapRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [myScheduleId, setMyScheduleId] = useState("");
  const [targetFacultyId, setTargetFacultyId] = useState("");
  const [targetScheduleId, setTargetScheduleId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reason, setReason] = useState("");
  const { data: classes } = useClassOptions();
  const { data: colleagues } = useColleagueOptions();
  const { trigger, isMutating } = useCreateSwapRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.length < 10) {
      toast.error("Reason must be at least 10 characters");
      return;
    }
    try {
      await trigger({ myScheduleId, targetFacultyId, targetScheduleId, effectiveDate, reason });
      toast.success("Swap request submitted!");
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeftRight className="h-4 w-4" /> Swap Class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Swap Class Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Your Class</Label>
            <Select value={myScheduleId} onValueChange={setMyScheduleId}>
              <SelectTrigger><SelectValue placeholder="Select your class..." /></SelectTrigger>
              <SelectContent>
                {classes?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Target Faculty</Label>
            <Select value={targetFacultyId} onValueChange={setTargetFacultyId}>
              <SelectTrigger><SelectValue placeholder="Select colleague..." /></SelectTrigger>
              <SelectContent>
                {colleagues?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.department})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Target Schedule ID</Label>
            <Input value={targetScheduleId} onChange={(e) => setTargetScheduleId(e.target.value)} placeholder="Enter target schedule ID" required />
          </div>
          <div>
            <Label>Effective Date</Label>
            <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
          </div>
          <div>
            <Label>Reason (min 10 characters)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required minLength={10} />
          </div>
          <Button type="submit" disabled={isMutating} className="w-full">
            {isMutating ? "Submitting..." : "Submit Swap Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
components/faculty/profile-form.tsx
React

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { Save, X, Plus, Mail, Phone, MapPin, Calendar } from "lucide-react";

export function ProfileForm() {
  const { data: profile, isLoading, mutate } = useProfile();
  const { trigger: updateProfile, isMutating } = useUpdateProfile();

  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");
  const [officeHours, setOfficeHours] = useState("");
  const [researchInterests, setResearchInterests] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [newQualification, setNewQualification] = useState("");

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setPhone(profile.phone || "");
      setOfficeLocation(profile.officeLocation || "");
      setOfficeHours(profile.officeHours || "");
      setResearchInterests(profile.researchInterests || []);
      setQualifications(profile.qualifications || []);
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile({
        bio: bio || null,
        phone: phone || null,
        officeLocation: officeLocation || null,
        officeHours: officeHours || null,
        researchInterests,
        qualifications,
      });
      toast.success("Profile updated!");
      setEditing(false);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="text-center py-12 text-gray-500">Profile not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-bold">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
              <p className="text-sm text-gray-500">{profile.designation}</p>
              <Badge variant="outline" className="mt-2">{profile.department}</Badge>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{profile.email}</span>
                {profile.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{profile.phone}</span>}
                {profile.officeLocation && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.officeLocation}</span>}
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Joined {format(new Date(profile.joiningDate), "MMM yyyy")}</span>
              </div>
            </div>
            <Button variant={editing ? "destructive" : "outline"} size="sm" onClick={() => setEditing(!editing)}>
              {editing ? <><X className="h-4 w-4 mr-1" />Cancel</> : "Edit Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Details Card */}
      <Card className="border border-gray-200">
        <CardHeader><CardTitle className="text-base">Profile Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Bio</Label>
            {editing ? (
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} rows={3} />
            ) : (
              <p className="text-sm text-gray-600 mt-1">{profile.bio || "No bio added"}</p>
            )}
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              {editing ? (
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
              ) : (
                <p className="text-sm text-gray-600 mt-1">{profile.phone || "Not set"}</p>
              )}
            </div>
            <div>
              <Label>Office Location</Label>
              {editing ? (
                <Input value={officeLocation} onChange={(e) => setOfficeLocation(e.target.value)} placeholder="Office location" />
              ) : (
                <p className="text-sm text-gray-600 mt-1">{profile.officeLocation || "Not set"}</p>
              )}
            </div>
            <div>
              <Label>Office Hours</Label>
              {editing ? (
                <Input value={officeHours} onChange={(e) => setOfficeHours(e.target.value)} placeholder="e.g., Mon-Fri 2-4 PM" />
              ) : (
                <p className="text-sm text-gray-600 mt-1">{profile.officeHours || "Not set"}</p>
              )}
            </div>
          </div>
          <Separator />
          <div>
            <Label>Research Interests</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {researchInterests.map((interest, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {interest}
                  {editing && (
                    <button onClick={() => setResearchInterests(researchInterests.filter((_, idx) => idx !== i))} className="ml-1 text-red-500">×</button>
                  )}
                </Badge>
              ))}
              {researchInterests.length === 0 && !editing && <p className="text-sm text-gray-400">None added</p>}
            </div>
            {editing && (
              <div className="flex gap-2 mt-2">
                <Input value={newInterest} onChange={(e) => setNewInterest(e.target.value)} placeholder="Add interest" className="flex-1" />
                <Button type="button" size="sm" variant="outline" onClick={() => {
                  if (newInterest.trim()) {
                    setResearchInterests([...researchInterests, newInterest.trim()]);
                    setNewInterest("");
                  }
                }}><Plus className="h-4 w-4" /></Button>
              </div>
            )}
          </div>
          <div>
            <Label>Qualifications</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {qualifications.map((q, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {q}
                  {editing && (
                    <button onClick={() => setQualifications(qualifications.filter((_, idx) => idx !== i))} className="ml-1 text-red-500">×</button>
                  )}
                </Badge>
              ))}
              {qualifications.length === 0 && !editing && <p className="text-sm text-gray-400">None added</p>}
            </div>
            {editing && (
              <div className="flex gap-2 mt-2">
                <Input value={newQualification} onChange={(e) => setNewQualification(e.target.value)} placeholder="Add qualification" className="flex-1" />
                <Button type="button" size="sm" variant="outline" onClick={() => {
                  if (newQualification.trim()) {
                    setQualifications([...qualifications, newQualification.trim()]);
                    setNewQualification("");
                  }
                }}><Plus className="h-4 w-4" /></Button>
              </div>
            )}
          </div>
          {editing && (
            <Button onClick={handleSave} disabled={isMutating} className="gap-2">
              <Save className="h-4 w-4" />{isMutating ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
components/faculty/availability-form.tsx
React

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAvailability, useUpdateAvailability } from "@/hooks/use-availability";
import { getDayName } from "@/lib/utils";
import { toast } from "sonner";
import { Save } from "lucide-react";

const ALL_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export function AvailabilityForm() {
  const { data: availability, isLoading, mutate } = useAvailability();
  const { trigger: updateAvailability, isMutating } = useUpdateAvailability();

  const [preferredSlot, setPreferredSlot] = useState("ANY");
  const [customStartTime, setCustomStartTime] = useState("");
  const [customEndTime, setCustomEndTime] = useState("");
  const [unavailableStart, setUnavailableStart] = useState("");
  const [unavailableEnd, setUnavailableEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [days, setDays] = useState<Record<string, boolean>>({
    MONDAY: true, TUESDAY: true, WEDNESDAY: true, THURSDAY: true,
    FRIDAY: true, SATURDAY: false, SUNDAY: false,
  });

  useEffect(() => {
    if (availability) {
      setPreferredSlot(availability.preferredSlot);
      setCustomStartTime(availability.customStartTime || "");
      setCustomEndTime(availability.customEndTime || "");
      setUnavailableStart(availability.unavailableStart || "");
      setUnavailableEnd(availability.unavailableEnd || "");
      setNotes(availability.notes || "");
      const dayMap: Record<string, boolean> = {};
      availability.days.forEach((d) => { dayMap[d.dayOfWeek] = d.isAvailable; });
      ALL_DAYS.forEach((d) => { if (!(d in dayMap)) dayMap[d] = false; });
      setDays(dayMap);
    }
  }, [availability]);

  const handleSave = async () => {
    try {
      await updateAvailability({
        preferredSlot,
        customStartTime: customStartTime || null,
        customEndTime: customEndTime || null,
        unavailableStart: unavailableStart || null,
        unavailableEnd: unavailableEnd || null,
        notes: notes || null,
        days: ALL_DAYS.map((d) => ({ dayOfWeek: d, isAvailable: days[d] ?? false })),
      });
      toast.success("Availability updated!");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <Card className="border border-gray-200">
        <CardHeader><CardTitle className="text-base">Preferred Time Slot</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Preferred Slot</Label>
            <Select value={preferredSlot} onValueChange={setPreferredSlot}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MORNING">Morning</SelectItem>
                <SelectItem value="AFTERNOON">Afternoon</SelectItem>
                <SelectItem value="EVENING">Evening</SelectItem>
                <SelectItem value="ANY">Any</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Custom Start Time</Label>
              <Input type="time" value={customStartTime} onChange={(e) => setCustomStartTime(e.target.value)} />
            </div>
            <div>
              <Label>Custom End Time</Label>
              <Input type="time" value={customEndTime} onChange={(e) => setCustomEndTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Unavailable Start</Label>
              <Input type="time" value={unavailableStart} onChange={(e) => setUnavailableStart(e.target.value)} />
            </div>
            <div>
              <Label>Unavailable End</Label>
              <Input type="time" value={unavailableEnd} onChange={(e) => setUnavailableEnd(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardHeader><CardTitle className="text-base">Weekly Availability</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ALL_DAYS.map((day) => (
              <div key={day} className={`flex items-center justify-between p-3 rounded-lg border ${days[day] ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
                <span className="text-sm font-medium">{getDayName(day).slice(0, 3)}</span>
                <Switch checked={days[day] ?? false} onCheckedChange={(checked) => setDays({ ...days, [day]: checked })} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." maxLength={500} rows={3} />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isMutating} className="gap-2">
        <Save className="h-4 w-4" />{isMutating ? "Saving..." : "Save Availability"}
      </Button>
    </div>
  );
}
components/faculty/notifications-list.tsx
React

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, Info, Calendar, AlertCircle, Settings } from "lucide-react";
import type { NotificationItem } from "@/lib/types";
import Link from "next/link";

interface NotificationsListProps {
  notifications: NotificationItem[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  showMarkAll?: boolean;
}

const typeIcons: Record<string, any> = {
  REQUEST_UPDATE: AlertCircle,
  SCHEDULE_CHANGE: Calendar,
  ANNOUNCEMENT: Info,
  REMINDER: Bell,
  SYSTEM: Settings,
};

const typeColors: Record<string, string> = {
  REQUEST_UPDATE: "text-amber-600",
  SCHEDULE_CHANGE: "text-blue-600",
  ANNOUNCEMENT: "text-green-600",
  REMINDER: "text-purple-600",
  SYSTEM: "text-gray-600",
};

export function NotificationsList({ notifications, onMarkAsRead, onMarkAllAsRead, showMarkAll }: NotificationsListProps) {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No notifications</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showMarkAll && (
        <div className="flex justify-end