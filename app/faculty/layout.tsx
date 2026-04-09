"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  User,
  Clock,
  Bell,
  GraduationCap,
  LogOut,
  Loader2,
  Shield,
  Eye,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRoleAuth } from "@/hooks/use-role-auth";
import { ROLE_INFO } from "@/lib/types/roles";
import { getInitials } from "@/lib/utils";

const navItems = [
  { href: "/faculty/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/faculty/timetable", label: "Timetable", icon: Calendar },
  { href: "/faculty/requests", label: "Requests", icon: FileText },
  { href: "/faculty/profile", label: "Profile", icon: User },
  { href: "/faculty/availability", label: "Availability", icon: Clock },
  { href: "/faculty/notifications", label: "Notifications", icon: Bell },
];

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, role, isAdmin, isScheduler, logout } = useRoleAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch("/api/faculty/notifications/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data?.data?.count || 0);
        }
      } catch {}
    }
    fetchUnread();
  }, []);

  useEffect(() => {
    if (isLoading || user) return;
    const callback = pathname || "/faculty/dashboard";
    router.replace("/login?callbackUrl=" + encodeURIComponent(callback));
  }, [isLoading, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const roleInfo = role ? ROLE_INFO[role] : null;
  const greeting =
    new Date().getHours() < 12
      ? "Good Morning"
      : new Date().getHours() < 17
      ? "Good Afternoon"
      : "Good Evening";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold">FacultyHub</h1>
            <p className="text-xs text-muted-foreground">Faculty Portal</p>
          </div>
        </div>

        {/* Role Badge */}
        {roleInfo && (
          <div className="mx-4 mt-4 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <Shield className="h-4 w-4 text-purple-500" />
              ) : isScheduler ? (
                <Eye className="h-4 w-4 text-green-500" />
              ) : (
                <User className="h-4 w-4 text-primary" />
              )}
              <div>
                <p className="text-xs font-semibold">
                  {user?.name?.split(" ")[0]}
                </p>
                <p
                  className={`text-[10px] font-medium ${
                    isAdmin
                      ? "text-purple-500"
                      : isScheduler
                      ? "text-green-500"
                      : "text-primary"
                  }`}
                >
                  {roleInfo.label}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Admin/Scheduler Quick Links */}
        {(isAdmin || isScheduler) && (
          <div className="mx-4 mt-2 space-y-1">
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors"
              >
                <Shield className="h-3.5 w-3.5" />
                Admin Dashboard
              </Link>
            )}
            {isScheduler && !isAdmin && (
              <Link
                href="/scheduler/dashboard"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950 transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                Scheduler Dashboard
              </Link>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-primary/10 font-semibold text-primary dark:bg-primary/15"
                    : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {item.label === "Notifications" && unreadCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-border p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div>
            <h2 className="text-lg font-semibold">
              {greeting}, {user?.name?.split(" ")[0] || "User"}!
            </h2>
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
            <Link
              href="/faculty/notifications"
              className="relative rounded-lg p-2 hover:bg-muted transition-colors"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary text-sm font-bold">
              {getInitials(user?.name || "")}
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
