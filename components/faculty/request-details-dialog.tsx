"use client";

import { useEffect, useState } from "react";
import { Loader2, Calendar, User, GitBranch, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getRequestById } from "@/lib/api/faculty-client";
import type { FacultyRequestDetail } from "@/lib/types/faculty";
import { cn } from "@/lib/utils";
import { RequestStatus, RequestType } from "@/lib/types/faculty";

interface RequestDetailsDialogProps {
  requestId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeLabels: Record<string, string> = {
  [RequestType.SWAP]: "Class swap",
  [RequestType.RESCHEDULE]: "Reschedule",
  [RequestType.LEAVE]: "Leave",
};

const statusClass: Record<string, string> = {
  [RequestStatus.PENDING]:
    "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  [RequestStatus.APPROVED]:
    "border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-300",
  [RequestStatus.REJECTED]:
    "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300",
  [RequestStatus.WITHDRAWN]: "border-border bg-muted text-muted-foreground",
};

function formatWhen(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function RequestDetailsDialog({
  requestId,
  open,
  onOpenChange,
}: RequestDetailsDialogProps) {
  const [detail, setDetail] = useState<FacultyRequestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !requestId) {
      setDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);

    void (async () => {
      const res = await getRequestById(requestId);
      if (cancelled) return;
      setLoading(false);
      if (!res.success || !res.data) {
        setError(res.error || "Could not load request details.");
        return;
      }
      setDetail(res.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, requestId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-4 text-left">
          <DialogTitle className="pr-8">Request details</DialogTitle>
          <DialogDescription>
            {detail
              ? `${typeLabels[detail.type] ?? detail.type} — ${detail.title}`
              : loading
                ? "Loading…"
                : "View full request information"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] px-6 py-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading request…
            </div>
          )}

          {!loading && error && (
            <div
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          {!loading && !error && detail && (
            <div className="space-y-5 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "font-medium",
                    statusClass[detail.status] ?? "",
                  )}
                >
                  {detail.status}
                </Badge>
                <span className="text-muted-foreground">
                  {typeLabels[detail.type] ?? detail.type}
                </span>
              </div>

              <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Timeline
                    </p>
                    <p>
                      <span className="text-muted-foreground">Submitted:</span>{" "}
                      {formatWhen(detail.requestDate)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Created:</span>{" "}
                      {formatWhen(detail.createdAt)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Effective:</span>{" "}
                      {formatWhen(detail.effectiveDate)}
                    </p>
                    {detail.endDate && (
                      <p>
                        <span className="text-muted-foreground">End:</span>{" "}
                        {formatWhen(detail.endDate)}
                      </p>
                    )}
                    {detail.newDate && (
                      <p>
                        <span className="text-muted-foreground">
                          Proposed date:
                        </span>{" "}
                        {formatWhen(detail.newDate)}
                        {detail.newStartTime && detail.newEndTime
                          ? ` (${detail.newStartTime}–${detail.newEndTime})`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {detail.reason && (
                <div>
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Reason
                  </p>
                  <p className="whitespace-pre-wrap rounded-md border border-border bg-card px-3 py-2 text-foreground">
                    {detail.reason}
                  </p>
                </div>
              )}

              {detail.description && detail.description !== detail.reason && (
                <div>
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Additional notes
                  </p>
                  <p className="whitespace-pre-wrap rounded-md border border-border bg-card px-3 py-2 text-muted-foreground">
                    {detail.description}
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  Requesting faculty
                </div>
                <p className="font-medium">{detail.faculty.name}</p>
                <p className="text-muted-foreground">{detail.faculty.email}</p>
                <p className="mt-1 text-muted-foreground">
                  {detail.faculty.designation} · {detail.faculty.departmentName}{" "}
                  · ID {detail.faculty.employeeId}
                </p>
              </div>

              {detail.targetFaculty && (
                <div className="rounded-lg border border-border p-3">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Other faculty (swap target)
                  </p>
                  <p className="font-medium">{detail.targetFaculty.name}</p>
                  <p className="text-muted-foreground">
                    {detail.targetFaculty.email}
                  </p>
                  <p className="text-muted-foreground">
                    {detail.targetFaculty.designation}
                  </p>
                </div>
              )}

              {(detail.mySchedule || detail.targetSchedule) && (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    Related classes
                  </div>
                  {detail.mySchedule && (
                    <div className="rounded-md bg-muted/40 px-3 py-2">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Your class
                      </p>
                      <p>
                        {detail.mySchedule.courseCode} —{" "}
                        {detail.mySchedule.courseName}
                      </p>
                      <p className="text-muted-foreground">
                        {detail.mySchedule.dayOfWeek}{" "}
                        {detail.mySchedule.startTime}–
                        {detail.mySchedule.endTime} ·{" "}
                        {detail.mySchedule.roomLabel}
                      </p>
                      {detail.mySchedule.ownerName && (
                        <p className="text-xs text-muted-foreground">
                          Instructor: {detail.mySchedule.ownerName}
                        </p>
                      )}
                    </div>
                  )}
                  {detail.targetSchedule && (
                    <div className="rounded-md bg-muted/40 px-3 py-2">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Target class
                      </p>
                      <p>
                        {detail.targetSchedule.courseCode} —{" "}
                        {detail.targetSchedule.courseName}
                      </p>
                      <p className="text-muted-foreground">
                        {detail.targetSchedule.dayOfWeek}{" "}
                        {detail.targetSchedule.startTime}–
                        {detail.targetSchedule.endTime} ·{" "}
                        {detail.targetSchedule.roomLabel}
                      </p>
                      {detail.targetSchedule.ownerName && (
                        <p className="text-xs text-muted-foreground">
                          Instructor: {detail.targetSchedule.ownerName}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {detail.timeline && detail.timeline.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <GitBranch className="h-3.5 w-3.5" />
                    Status history
                  </div>
                  <ul className="space-y-3 border-l-2 border-border pl-4">
                    {detail.timeline.map((entry) => (
                      <li key={entry.id} className="relative">
                        <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                        <p className="font-medium">{entry.status}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatWhen(entry.createdAt)}
                          {entry.createdBy ? ` · ${entry.createdBy}` : ""}
                        </p>
                        {entry.comment && (
                          <p className="mt-1 rounded bg-muted/50 px-2 py-1 text-xs">
                            {entry.comment}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
