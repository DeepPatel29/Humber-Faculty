"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { CheckCircle, XCircle, Loader2, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AdminRequest {
  id: string;
  type: "SWAP" | "RESCHEDULE" | "LEAVE";
  status: "PENDING" | "APPROVED" | "REJECTED";
  title: string;
  description?: string;
  reason: string;
  effectiveDate: string;
  endDate?: string;
  requestDate: string;
  createdAt: string;
  faculty: {
    id: string;
    name: string;
    email: string;
    designation: string;
    department: string;
  };
  timeline: Array<{
    id: string;
    status: string;
    comment?: string;
    createdBy: string;
    createdAt: string;
  }>;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminRequestsPage() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const limit = 10;
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(filter === "approved" ? "APPROVED" : "ALL");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: pendingData, isLoading: pendingLoading, mutate: mutatePending } = useSWR(
    "/api/admin/requests?status=PENDING",
    fetcher,
  );
  const { data: approvedData, isLoading: approvedLoading, mutate: mutateApproved } = useSWR(
    "/api/admin/requests?status=APPROVED",
    fetcher,
  );
  const { data: rejectedData, isLoading: rejectedLoading, mutate: mutateRejected } = useSWR(
    "/api/admin/requests?status=REJECTED",
    fetcher,
  );

  const pendingRequests: AdminRequest[] = pendingData?.data?.requests || [];
  const approvedRequests: AdminRequest[] = approvedData?.data?.requests || [];
  const rejectedRequests: AdminRequest[] = rejectedData?.data?.requests || [];
  const allRequests = [...pendingRequests, ...approvedRequests, ...rejectedRequests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRequests = allRequests.filter((request) => {
    const matchesPrefilter = filter !== "approved" || request.status === "APPROVED";
    const matchesStatus = statusFilter === "ALL" || request.status === statusFilter;
    const matchesQuery =
      !normalizedQuery ||
      request.title.toLowerCase().includes(normalizedQuery) ||
      request.faculty.name.toLowerCase().includes(normalizedQuery) ||
      request.type.toLowerCase().includes(normalizedQuery);
    return matchesPrefilter && matchesStatus && matchesQuery;
  });
  const total = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const visibleRequests = filteredRequests.slice(start, start + limit);
  const isLoading = pendingLoading || approvedLoading || rejectedLoading;
  const visibleIds = visibleRequests.map((r) => r.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  function toggleAllVisible(checked: boolean) {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, id])) : prev.filter((v) => v !== id)));
  }

  function downloadCsv(filename: string, rows: string[][]) {
    const csv = rows
      .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportRequests(all: boolean) {
    const source = all ? visibleRequests : visibleRequests.filter((r) => selectedIds.includes(r.id));
    if (!source.length) {
      toast.error(all ? "No requests to export" : "Select at least one row");
      return;
    }
    const rows = [
      ["Type", "Title", "Faculty Name", "Status", "Created Date", "Effective Date"],
      ...source.map((r) => [
        r.type,
        r.title,
        r.faculty.name,
        r.status,
        new Date(r.createdAt).toLocaleDateString(),
        new Date(r.effectiveDate).toLocaleDateString(),
      ]),
    ];
    downloadCsv("requests.csv", rows);
  }

  const handleAction = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/requests/${selectedRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: actionType, comment }),
      });

      if (!res.ok) throw new Error("Failed to update request");

      toast.success(`Request ${actionType === "APPROVED" ? "approved" : "rejected"} successfully`);
      setActionDialogOpen(false);
      setSelectedRequest(null);
      setComment("");
      await Promise.all([mutatePending(), mutateApproved(), mutateRejected()]);
    } catch (error) {
      toast.error("Failed to update request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openActionDialog = (request: AdminRequest, type: "APPROVED" | "REJECTED") => {
    setSelectedRequest(request);
    setActionType(type);
    setComment("");
    setActionDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
        <h1 className="text-2xl font-bold">Request Management</h1>
        <p className="text-muted-foreground">Review and approve or reject faculty requests</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => exportRequests(true)} disabled={visibleRequests.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV (All)
          </Button>
          <Button variant="outline" onClick={() => exportRequests(false)} disabled={selectedIds.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV (Selected)
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => {
            setPage(1);
            setQuery(e.target.value);
          }}
          placeholder="Search title, faculty, type..."
          className="h-9 w-full rounded-md border bg-background px-3 text-sm sm:max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {filter === "approved" ? "Approved Requests" : "All Requests"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : visibleRequests.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="text-center text-muted-foreground">
                <CheckCircle className="mx-auto mb-4 h-10 w-10 text-green-500" />
                <p>No requests found.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={(value) => toggleAllVisible(Boolean(value))}
                        aria-label="Select all request rows"
                      />
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Effective</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(request.id)}
                          onCheckedChange={(value) => toggleRow(request.id, Boolean(value))}
                          aria-label={`Select ${request.title}`}
                        />
                      </TableCell>
                      <TableCell>{request.type}</TableCell>
                      <TableCell className="font-medium">{request.title}</TableCell>
                      <TableCell>{request.faculty.name}</TableCell>
                      <TableCell>{request.status}</TableCell>
                      <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(request.effectiveDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {request.status === "PENDING" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                              onClick={() => openActionDialog(request, "APPROVED")}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              onClick={() => openActionDialog(request, "REJECTED")}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!isLoading && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {safePage} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "APPROVED" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "APPROVED"
                ? "Approve this request. The faculty member will be notified."
                : "Reject this request. Please provide a reason for rejection."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder={actionType === "APPROVED" ? "Optional comment..." : "Reason for rejection..."}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={isSubmitting}
              variant={actionType === "APPROVED" ? "default" : "destructive"}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === "APPROVED" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
