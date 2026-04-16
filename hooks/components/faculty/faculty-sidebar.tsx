"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Calendar,
  Clock,
  FileText,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Database,
} from "lucide-react";
import { useAuthSignOut } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: "/faculty/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/faculty/profile", label: "Profile", icon: User },
  { href: "/faculty/timetable", label: "Timetable", icon: Calendar },
  { href: "/faculty/availability", label: "Availability", icon: Clock },
  { href: "/faculty/requests", label: "Requests", icon: FileText },
  { href: "/faculty/notifications", label: "Notifications", icon: Bell },
  { href: "/data", label: "Data Browser", icon: Database },
];

interface FacultySidebarProps {
  user?: {
    name: string;
    email: string;
    avatarUrl?: string | null;
    designation?: string;
  };
  unreadNotifications?: number;
  pendingRequests?: number;
}

export function FacultySidebar({
  user = {
    name: "Dr. John Smith",
    email: "john.smith@university.edu",
    designation: "Associate Professor",
  },
  unreadNotifications = 0,
  pendingRequests = 0,
}: FacultySidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuthSignOut();

  const getBadge = (href: string): number | undefined => {
    if (href === "/faculty/notifications" && unreadNotifications > 0) {
      return unreadNotifications;
    }
    if (href === "/faculty/requests" && pendingRequests > 0) {
      return pendingRequests;
    }
    return undefined;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">
                  FD
                </span>
              </div>
              <span className="font-semibold text-foreground">Faculty Portal</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("h-8 w-8", collapsed && "mx-auto")}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const badge = getBadge(item.href);
            const Icon = item.icon;

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {badge !== undefined && badge > 0 && (
                      <Badge
                        variant={isActive ? "secondary" : "default"}
                        className="h-5 min-w-5 px-1.5"
                      >
                        {badge > 99 ? "99+" : badge}
                      </Badge>
                    )}
                  </>
                )}
                {collapsed && badge !== undefined && badge > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <div className="relative">{linkContent}</div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {item.label}
                    {badge !== undefined && badge > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5">
                        {badge}
                      </Badge>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-border p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg p-2",
              collapsed && "justify-center"
            )}
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.designation}
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="mt-2 w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
