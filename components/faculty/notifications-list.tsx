"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Bell, Calendar, FileText, Info, Megaphone, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { NotificationType, type FacultyNotification } from "@/lib/types/faculty";

interface NotificationsListProps {
  notifications: FacultyNotification[];
  onMarkAsRead?: (notification: FacultyNotification) => void;
  onMarkAllAsRead?: () => void;
}

const typeIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  [NotificationType.REQUEST_UPDATE]: FileText,
  [NotificationType.SCHEDULE_CHANGE]: Calendar,
  [NotificationType.ANNOUNCEMENT]: Megaphone,
  [NotificationType.REMINDER]: Bell,
  [NotificationType.SYSTEM]: Info,
};

const typeColors: Record<NotificationType, string> = {
  [NotificationType.REQUEST_UPDATE]: "bg-primary/10 text-primary",
  [NotificationType.SCHEDULE_CHANGE]: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  [NotificationType.ANNOUNCEMENT]: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  [NotificationType.REMINDER]: "bg-green-500/10 text-green-600 dark:text-green-400",
  [NotificationType.SYSTEM]: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

// Safe time ago - NEVER throws
function safeTimeAgo(dateValue: any): string {
  if (!dateValue) return "";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
}

export function NotificationsList({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationsListProps) {
  if (!notifications || notifications.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Bell className="h-5 w-5" />
          </EmptyMedia>
          <EmptyTitle>No notifications</EmptyTitle>
          <EmptyDescription>
            You&apos;re all caught up! New notifications will appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const unreadCount = notifications.filter((n) => n && !n.isRead).length;

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllAsRead}
            className="text-primary"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notification) => {
          if (!notification) return null;
          const Icon = typeIcons[notification.type] || Bell;
          const content = (
            <Card
              key={notification.id || Math.random()}
              className={cn(
                "cursor-pointer transition-colors hover:bg-accent/50",
                !notification.isRead && "border-primary/30 bg-primary/5"
              )}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      typeColors[notification.type] || typeColors[NotificationType.SYSTEM]
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={cn(
                          "font-medium",
                          !notification.isRead && "text-foreground"
                        )}
                      >
                        {notification.title || "Notification"}
                      </h3>
                      {!notification.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    {notification.message && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    {notification.createdAt && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {safeTimeAgo(notification.createdAt)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );

          if (notification.link) {
            return (
              <Link
                key={notification.id || Math.random()}
                href={notification.link}
                onClick={() => !notification.isRead && onMarkAsRead?.(notification)}
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={notification.id || Math.random()}
              onClick={() => !notification.isRead && onMarkAsRead?.(notification)}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
