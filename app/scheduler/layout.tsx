"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Eye,
  LogOut,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRoleAuth } from "@/hooks/use-role-auth";
import { ROLE_INFO } from "@/lib/types/roles";
import { getInitials } from "@/lib/utils";

const navItems = [
  { href: "/scheduler/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scheduler/timetable", label: "Timetables", icon: Calendar },
  { href: "/scheduler/constraints", label: "Constraints", icon: Users },
];

export default function SchedulerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isScheduler, isAdmin, logout } = useRoleAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isScheduler && !isAdmin) {
      router.push("/unauthorized");
    }
  }, [isLoading, isScheduler, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!isScheduler && !isAdmin) {
    return null;
  }

  const roleInfo = ROLE_INFO["SCHEDULER"];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600">
            <Eye className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold">FacultyHub</h1>
            <p className="text-xs text-muted-foreground">Scheduler Portal</p>
          </div>
        </div>

        <div className="mx-4 mt-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs font-semibold">{user?.name?.split(" ")[0]}</p>
              <p className="text-[10px] font-medium text-green-500">
                {roleInfo?.label}
              </p>
            </div>
          </div>
        </div>

        <div className="mx-4 mt-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">
          <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
            🔒 Read-only access to faculty data
          </p>
        </div>

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <Link
            href="/faculty/dashboard"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-2"
          >
            <LayoutDashboard className="h-5 w-5" />
            Faculty View
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div>
            <h2 className="text-lg font-semibold">Scheduler Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-bold">
              {getInitials(user?.name || "")}
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
