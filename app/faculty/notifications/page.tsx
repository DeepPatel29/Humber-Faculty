"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useUnreadCount,
} from "@/hooks/use-faculty";
import { Bell, Check, CheckCheck, Info, Calendar, Megaphone, AlertCircle, Settings } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const typeIcons: Record<string, React.ElementType> = {
  REQUEST_UPDATE: Info,
  SCHEDULE_CHANGE: Calendar,
  ANNOUNCEMENT: Megaphone,
  REMINDER: AlertCircle,
  SYSTEM: Settings,
};

const typeIconBg: Record<string, string> = {
  REQUEST_UPDATE: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
  SCHEDULE_CHANGE: "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400",
  ANNOUNCEMENT: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
  REMINDER: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400",
  SYSTEM: "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400",
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
    if (mins < 60) return `${mins} minutes ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs} hours ago`;
    const days = Math.floor(diff / 86400000);
    if (days < 30) return `${days} days ago`;
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

export default function NotificationsPage() {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const { data, isLoading, mutate } = useNotifications({ unreadOnly: showUnreadOnly });
  const { data: unreadData, mutate: mutateUnread } = useUnreadCount();
  const { trigger: markRead } = useMarkNotificationAsRead();
  const { trigger: markAllRead } = useMarkAllNotificationsAsRead();

  const notifications = (() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    const d = data as any;
    return Array.isArray(d.notifications) ? d.notifications : Array.isArray(d.data) ? d.data : [];
  })();

  const unreadCount = (() => {
    if (!unreadData) return 0;
    if (typeof unreadData === "number") return unreadData;
    return (unreadData as any)?.count ?? 0;
  })();

  async function handleMarkRead(id: string) {
    await markRead(id);
    mutate();
    mutateUnread();
  }

  async function handleMarkAllRead() {
    await markAllRead();
    toast.success("All marked as read");
    mutate();
    mutateUnread();
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Stay updated with your latest notifications</p>
      </div>

      {/* Tabs + Info */}
      <div className="space-y-4">
        <Tabs defaultValue="all" onValueChange={(v) => setShowUnreadOnly(v === "unread")}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread{" "}
                {unreadCount > 0 && (
                  <Badge className="ml-1.5" variant="destructive">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {unreadCount} unread notifications
              </span>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="h-8 text-xs"
                >
                  <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                  Mark all as read
                </Button>
              )}
            </div>
          </div>

          {["all", "unread"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              {notifications.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground/20" />
                    <p className="mt-3 text-muted-foreground">
                      No {tab === "unread" ? "unread " : ""}notifications
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif: any, idx: number) => {
                    if (!notif) return null;
                    const type = notif.type || "SYSTEM";
                    const Icon = typeIcons[type] || Bell;
                    const iconClass = typeIconBg[type] || typeIconBg.SYSTEM;
                    const isRead = notif.isRead ?? notif.is_read ?? false;
                    const title = notif.title || "Notification";
                    const message = notif.message || notif.body || "";
                    const link = notif.link || notif.url || null;
                    const createdAt = notif.createdAt || notif.created_at;

                    return (
                      <Card
                        key={notif.id || idx}
                        className={`transition-all ${
                          !isRead
                            ? "border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10"
                            : ""
                        } hover:shadow-sm`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 rounded-lg p-2 shrink-0 ${iconClass}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold">{title}</h3>
                                {!isRead && (
                                  <div className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                                )}
                              </div>
                              {message && (
                                <p className="mt-1 text-sm text-muted-foreground">{message}</p>
                              )}
                              <div className="mt-2 flex items-center gap-3">
                                {createdAt && (
                                  <p className="text-xs text-muted-foreground">
                                    {safeDate(createdAt)}
                                  </p>
                                )}
                                {link && (
                                  <Link
                                    href={link}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    View details →
                                  </Link>
                                )}
                              </div>
                            </div>
                            {!isRead && notif.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => handleMarkRead(notif.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
