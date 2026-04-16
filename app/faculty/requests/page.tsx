"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, CalendarClock, CalendarOff } from "lucide-react";
import { RequestsList } from "@/components/faculty/requests-list";
import {
  RescheduleRequestDialog,
  LeaveRequestDialog,
} from "@/components/faculty/request-dialogs";
import { RequestDetailsDialog } from "@/components/faculty/request-details-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useRequests,
  useClassOptions,
  useWithdrawRequest,
} from "@/hooks/use-faculty";
import { RequestStatus, type FacultyRequest } from "@/lib/types/faculty";
import { toast } from "sonner";

interface CourseAssignment {
  id: string;
  request_title?: string | null;
  course_code: string;
  course_name: string;
  term_label?: string | null;
  academic_year?: string | null;
  semester?: number | null;
  section?: string | null;
  program?: string | null;
  day_of_week?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  room_label?: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  assigned_at: string;
  response_note?: string | null;
}

function RequestsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function RequestsPage() {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsRequestId, setDetailsRequestId] = useState<string | null>(null);

  const { data: requestsData, isLoading, error, mutate } = useRequests();
  const { data: assignmentsData, mutate: mutateAssignments } = useSWR(
    "/api/faculty/course-assignments",
    (url: string) => fetch(url).then((r) => r.json()),
  );
  const { data: classOptions = [], mutate: mutateClassOptions } = useClassOptions();
  const { trigger: withdrawMutation } = useWithdrawRequest();

  const requests = requestsData?.data ?? [];
  const courseAssignments: CourseAssignment[] = assignmentsData?.data?.assignments ?? [];

  const pendingRequests = requests.filter(
    (r) => r.status === RequestStatus.PENDING,
  );
  const processedRequests = requests.filter(
    (r) =>
      r.status === RequestStatus.APPROVED ||
      r.status === RequestStatus.REJECTED ||
      r.status === RequestStatus.WITHDRAWN,
  );

  const handleWithdraw = async (requestId: string) => {
    try {
      await withdrawMutation(requestId);
      await mutate();
      toast.success("Request withdrawn successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to withdraw request",
      );
    }
  };

  const handleRequestSuccess = () => {
    mutate();
  };

  function handleViewDetails(request: FacultyRequest) {
    setDetailsRequestId(request.id);
    setDetailsOpen(true);
  }

  async function respondToAssignment(id: string, status: "ACCEPTED" | "REJECTED") {
    const res = await fetch(`/api/faculty/course-assignments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
      toast.error(body?.error?.message || "Failed to update assignment request");
      return;
    }
    toast.success(`Assignment ${status.toLowerCase()}`);
    await mutateAssignments();
  }

  if (error) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl p-6">
          <Card>
            <CardContent className="flex min-h-[400px] items-center justify-center p-6">
              <div className="text-center">
                <p className="text-lg font-medium text-destructive">
                  Failed to load requests
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error.message}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold">Course Assignment Requests</h2>
            {courseAssignments.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No course assignment requests.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {courseAssignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-md border p-3">
                    {assignment.request_title ? (
                      <p className="text-xs font-medium text-primary">{assignment.request_title}</p>
                    ) : null}
                    <p className="font-medium">
                      {assignment.course_code} - {assignment.course_name}
                    </p>
                    {(assignment.term_label || assignment.academic_year) && (
                      <p className="text-xs text-muted-foreground">
                        {assignment.term_label || "Term"}{" "}
                        {assignment.academic_year ? `• ${assignment.academic_year}` : ""}
                        {assignment.semester ? ` • Semester ${assignment.semester}` : ""}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Assigned: {new Date(assignment.assigned_at).toLocaleDateString()} | Status: {assignment.status}
                    </p>
                    {(assignment.day_of_week || assignment.start_time || assignment.room_label) && (
                      <p className="text-xs text-muted-foreground">
                        {assignment.day_of_week ? `${assignment.day_of_week} ` : ""}
                        {assignment.start_time && assignment.end_time
                          ? `${assignment.start_time} - ${assignment.end_time}`
                          : ""}
                        {assignment.room_label ? ` • ${assignment.room_label}` : ""}
                        {assignment.program ? ` • ${assignment.program}` : ""}
                        {assignment.section ? ` • Section ${assignment.section}` : ""}
                      </p>
                    )}
                    {assignment.status === "PENDING" ? (
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => respondToAssignment(assignment.id, "ACCEPTED")}>
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => respondToAssignment(assignment.id, "REJECTED")}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={async () => {
                  await mutateClassOptions();
                  setRescheduleOpen(true);
                }}
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                Reschedule
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLeaveOpen(true)}>
                <CalendarOff className="mr-2 h-4 w-4" />
                Leave Request
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="gap-2">
              Pending
              {pendingRequests.length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              <RequestsSkeleton />
            ) : (
              <RequestsList
                requests={pendingRequests}
                onView={handleViewDetails}
                onWithdraw={(request) => handleWithdraw(request.id)}
              />
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {isLoading ? (
              <RequestsSkeleton />
            ) : (
              <RequestsList
                requests={processedRequests}
                onView={handleViewDetails}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <RescheduleRequestDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        myClasses={classOptions}
        onSuccess={handleRequestSuccess}
      />
      <LeaveRequestDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        onSuccess={handleRequestSuccess}
      />
      <RequestDetailsDialog
        requestId={detailsRequestId}
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setDetailsRequestId(null);
        }}
      />
    </div>
  );
}
