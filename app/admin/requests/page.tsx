"use client";

import { useState } from "react";
import useSWR from "swr";
import { CheckCircle, XCircle, Clock, Loader2, ArrowLeftRight, CalendarClock, CalendarOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, mutate } = useSWR("/api/admin/requests", fetcher);
  const requests: AdminRequest[] = data?.data?.requests || [];

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const processedRequests = requests.filter((r) => r.status !== "PENDING");

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
      mutate();
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SWAP":
        return <ArrowLeftRight className="h-4 w-4" />;
      case "RESCHEDULE":
        return <CalendarClock className="h-4 w-4" />;
      case "LEAVE":
        return <CalendarOff className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Request Management</h1>
        <p className="text-muted-foreground">Review and approve or reject faculty requests</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingRequests.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900 px-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed">Processed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-[200px] items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No pending requests</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 dark:bg-primary/20">
                        {getTypeIcon(request.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{request.title}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                            {request.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          by {request.faculty.name} ({request.faculty.department})
                        </p>
                        <p className="text-sm mt-2">{request.reason}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Effective: {new Date(request.effectiveDate).toLocaleDateString()}
                          {request.endDate && ` to ${new Date(request.endDate).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                        onClick={() => openActionDialog(request, "APPROVED")}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => openActionDialog(request, "REJECTED")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : processedRequests.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-[200px] items-center justify-center">
                <p className="text-muted-foreground">No processed requests</p>
              </CardContent>
            </Card>
          ) : (
            processedRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      {getTypeIcon(request.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{request.title}</h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            request.status === "APPROVED"
                              ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                              : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        by {request.faculty.name} ({request.faculty.department})
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

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
