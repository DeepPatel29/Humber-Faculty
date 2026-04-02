"use client";

import {
  BookOpen,
  Users,
  FileText,
  Clock,
  ChevronRight,
  MapPin,
  Calendar,
  Building2,
  Mail,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard, useProfile, useUnreadCount, useMarkAllNotificationsAsRead } from "@/hooks/use-faculty";
import { formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

const typeVariant: Record<string, "info" | "success" | "warning" | "secondary"> = {
  LECTURE: "info",
  LAB: "success",
  TUTORIAL: "warning",
  SEMINAR: "warning",
  OFFICE_HOURS: "secondary",
};

const typeBorder: Record<string, string> = {
  LECTURE: "border-l-blue-500",
  LAB: "border-l-green-500",
  TUTORIAL: "border-l-purple-500",
  SEMINAR: "border-l-amber-500",
  OFFICE_HOURS: "border-l-gray-400",
};

function safeDate(v: any): string {
  if (!v) return "";
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return "";
    const now = Date.now();
    const diff = now - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(diff / 86400000);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const { data: profile } = useProfile();
  const { data: unreadData } = useUnreadCount();
  const { trigger: markAllRead } = useMarkAllNotificationsAsRead();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const d = data || ({} as any);
  const p = profile || ({} as any);
  
  const classesThisWeek = d.classesThisWeek ?? d.classes_this_week ?? 0;
  const totalStudents = d.totalStudents ?? d.total_students ?? 0;
  const pendingRequests = d.pendingRequests ?? d.pending_requests ?? 0;
  const officeHoursVal = d.officeHours ?? d.office_hours ?? "N/A";
  const todaySchedule = Array.isArray(d.todaySchedule) ? d.todaySchedule : [];
  const upcomingClasses = Array.isArray(d.upcomingSchedule)
    ? d.upcomingSchedule
    : Array.isArray(d.upcomingClasses)
    ? d.upcomingClasses
    : [];
  const recentNotifications = Array.isArray(d.recentNotifications) ? d.recentNotifications : [];
  const unreadCount = (unreadData as any)?.count ?? 0;

  const stats = [
    {
      label: "Classes This Week",
      value: classesThisWeek,
      icon: Calendar,
      sub: "vs last week",
      iconBg: "bg-blue-50 dark:bg-blue-950",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Total Students",
      value: totalStudents,
      icon: Users,
      sub: "this semester",
      trend: "+12",
      iconBg: "bg-green-50 dark:bg-green-950",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Pending Requests",
      value: pendingRequests,
      icon: FileText,
      sub: "vs last week",
      trend: pendingRequests > 0 ? `-${pendingRequests}` : undefined,
      iconBg: "bg-amber-50 dark:bg-amber-950",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Office Hours",
      value: officeHoursVal,
      icon: Clock,
      sub: "this week",
      iconBg: "bg-purple-50 dark:bg-purple-950",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {p.name || (p.faculty as any)?.user?.name || "Dr. Faculty"}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="hover:shadow-md dark:hover:border-zinc-700 transition-all"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    {stat.trend && (
                      <span
                        className={`flex items-center text-xs font-medium ${
                          stat.trend.startsWith("+")
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-500"
                        }`}
                      >
                        {stat.trend.startsWith("+") ? (
                          <TrendingUp className="h-3 w-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-0.5" />
                        )}
                        {stat.trend}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{stat.sub}</span>
                  </div>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconBg}`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3-Column: Today's Schedule, Upcoming Classes, Recent Notifications */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Schedule */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Today&apos;s Schedule</CardTitle>
            <Link
              href="/faculty/timetable"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaySchedule.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No classes today</p>
            ) : (
              todaySchedule.slice(0, 4).map((item: any, idx: number) => {
                if (!item) return null;
                const name = item.course?.name || item.courseName || item.name || "Class";
                const code = item.course?.code || item.courseCode || item.code || "";
                const start = item.startTime || "";
                const end = item.endTime || "";
                const room = item.room?.name || item.roomName || item.room || "TBA";
                const bldg = item.room?.building || item.building || "";
                const type = item.type || "LECTURE";
                const section = item.section || "";

                return (
                  <div
                    key={item.id || idx}
                    className={`rounded-lg border border-l-4 p-3 ${
                      typeBorder[type] || "border-l-gray-400"
                    } bg-card`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-semibold">{name}</h4>
                      <Badge variant={typeVariant[type] || "secondary"} className="text-[10px]">
                        {type}
                      </Badge>
                    </div>
                    {code && (
                      <p className="text-xs text-muted-foreground">
                        {code}
                        {section ? ` - Section ${section}` : ""}
                      </p>
                    )}
                    <div className="mt-2 space-y-1">
                      {start && end && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(start)} - {formatTime(end)}
                        </p>
                      )}
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {room}
                        {bldg ? ` • ${bldg}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Upcoming Classes */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Upcoming Classes</CardTitle>
            <Link
              href="/faculty/timetable"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingClasses.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No upcoming classes</p>
            ) : (
              upcomingClasses.slice(0, 4).map((item: any, idx: number) => {
                if (!item) return null;
                const name = item.course?.name || item.courseName || item.name || "Class";
                const code = item.course?.code || item.courseCode || item.code || "";
                const start = item.startTime || "";
                const end = item.endTime || "";
                const room = item.room?.name || item.roomName || item.room || "TBA";
                const bldg = item.room?.building || item.building || "";
                const type = item.type || "LECTURE";
                const section = item.section || "";

                return (
                  <div
                    key={item.id || idx}
                    className={`rounded-lg border border-l-4 p-3 ${
                      typeBorder[type] || "border-l-gray-400"
                    } bg-card`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-semibold">{name}</h4>
                      <Badge variant={typeVariant[type] || "secondary"} className="text-[10px]">
                        {type}
                      </Badge>
                    </div>
                    {code && (
                      <p className="text-xs text-muted-foreground">
                        {code}
                        {section ? ` - Section ${section}` : ""}
                      </p>
                    )}
                    <div className="mt-2 space-y-1">
                      {start && end && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(start)} - {formatTime(end)}
                        </p>
                      )}
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {room}
                        {bldg ? ` • ${bldg}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Recent Notifications</CardTitle>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={async () => {
                  await markAllRead();
                  toast.success("All marked as read");
                }}
              >
                Mark all as read
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No notifications</p>
            ) : (
              recentNotifications.slice(0, 4).map((notif: any, idx: number) => {
                if (!notif) return null;
                const isRead = notif.isRead ?? notif.is_read ?? false;
                const title = notif.title || "Notification";
                const message = notif.message || notif.body || "";
                const createdAt = notif.createdAt || notif.created_at;

                return (
                  <div
                    key={notif.id || idx}
                    className={`rounded-lg border p-3 ${
                      !isRead
                        ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!isRead && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{message}</p>
                        {createdAt && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {safeDate(createdAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Quick Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Building2 className="h-3.5 w-3.5" /> Department
              </div>
              <p className="font-semibold">
                {p.department || (p.faculty as any)?.department?.name || "Computer Science"}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <BookOpen className="h-3.5 w-3.5" /> Designation
              </div>
              <p className="font-semibold">
                {p.designation || (p.faculty as any)?.designation || "Associate Professor"}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Mail className="h-3.5 w-3.5" /> Email
              </div>
              <p className="font-semibold text-sm truncate">
                {p.email || (p.faculty as any)?.user?.email || "faculty@university.edu"}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <FileText className="h-3.5 w-3.5" /> Pending Requests
              </div>
              <p className="font-semibold">{pendingRequests}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
