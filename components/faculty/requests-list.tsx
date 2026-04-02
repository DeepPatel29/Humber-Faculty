"use client";

import { ArrowLeftRight, CalendarClock, CalendarOff, MoreVertical, Eye, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { RequestType, RequestStatus, type FacultyRequest } from "@/lib/types/faculty";

interface RequestsListProps {
  requests: FacultyRequest[];
  onView?: (request: FacultyRequest) => void;
  onWithdraw?: (request: FacultyRequest) => void;
}

const typeIcons: Record<RequestType, React.ComponentType<{ className?: string }>> = {
  [RequestType.SWAP]: ArrowLeftRight,
  [RequestType.RESCHEDULE]: CalendarClock,
  [RequestType.LEAVE]: CalendarOff,
};

const typeLabels: Record<RequestType, string> = {
  [RequestType.SWAP]: "Class Swap",
  [RequestType.RESCHEDULE]: "Reschedule",
  [RequestType.LEAVE]: "Leave",
};

const statusColors: Record<RequestStatus, string> = {
  [RequestStatus.PENDING]: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  [RequestStatus.APPROVED]: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
  [RequestStatus.REJECTED]: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
  [RequestStatus.WITHDRAWN]: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30",
};

// Safe time ago - NEVER throws
function safeTimeAgo(dateValue: any): string {
  if (!dateValue) return "Unknown time";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "Unknown time";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  } catch {
    return "Unknown time";
  }
}

export function RequestsList({ requests, onView, onWithdraw }: RequestsListProps) {
  if (!requests || requests.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText className="h-5 w-5" />
          </EmptyMedia>
          <EmptyTitle>No requests found</EmptyTitle>
          <EmptyDescription>
            You haven&apos;t submitted any requests yet. Create a new request to get started.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        if (!request) return null;
        const Icon = typeIcons[request.type] || FileText;
        return (
          <Card key={request.id || Math.random()} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-start gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-foreground">{request.title || "Untitled Request"}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {typeLabels[request.type] || request.type} &bull;{" "}
                        {safeTimeAgo(request.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("border", statusColors[request.status] || "")}
                      >
                        {request.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView?.(request)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {request.status === RequestStatus.PENDING && (
                            <DropdownMenuItem
                              onClick={() => onWithdraw?.(request)}
                              className="text-destructive"
                            >
                              <X className="mr-2 h-4 w-4" />
                              Withdraw
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {request.reason && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {request.reason}
                    </p>
                  )}

                  {request.timeline && request.timeline.length > 1 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">Latest:</span>
                      <span>
                        {request.timeline[request.timeline.length - 1]?.comment || ""} &bull;{" "}
                        {safeTimeAgo(request.timeline[request.timeline.length - 1]?.createdAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
