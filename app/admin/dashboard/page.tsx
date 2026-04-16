"use client";

import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Building2, CheckCircle, Clock, Loader2 } from "lucide-react";
import { useRoleAuth } from "@/hooks/use-role-auth";

interface AdminDashboardData {
  pendingRequests: number;
  pendingBreakdown: {
    swap: number;
    reschedule: number;
    leave: number;
  };
  totalFaculty: number;
  totalDepartments: number;
  approvedThisWeek: number;
  recentRequests: Array<{
    id: string;
    type: "SWAP" | "RESCHEDULE" | "LEAVE";
    status: "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
    createdAt: string;
    facultyName: string;
  }>;
}

const fetcher = async (url: string): Promise<AdminDashboardData> => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message || "Failed to fetch dashboard data");
  }
  return body.data as AdminDashboardData;
};

function formatRequestType(type: AdminDashboardData["recentRequests"][number]["type"]): string {
  return `${type.charAt(0)}${type.slice(1).toLowerCase()}`;
}

export default function AdminDashboardPage() {
  const { user } = useRoleAuth();
  const { data, isLoading } = useSWR("/api/admin/dashboard", fetcher);

  const pendingRequests = data?.pendingRequests ?? 0;
  const pendingBreakdown = data?.pendingBreakdown ?? { swap: 0, reschedule: 0, leave: 0 };
  const totalFaculty = data?.totalFaculty ?? 0;
  const totalDepartments = data?.totalDepartments ?? 0;
  const approvedThisWeek = data?.approvedThisWeek ?? 0;
  const recentRequests = data?.recentRequests ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome, {user?.name?.split(" ")[0]}!</h1>
        <p className="text-muted-foreground">
          Manage faculty, requests, and department operations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/requests">
        <Card className="cursor-pointer border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              {pendingBreakdown.swap} swap, {pendingBreakdown.reschedule} reschedule, {pendingBreakdown.leave} leave
            </p>
          </CardContent>
        </Card>
        </Link>

        <Link href="/admin/faculty">
        <Card className="cursor-pointer border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalFaculty}</div>
            <p className="text-xs text-muted-foreground">Across {totalDepartments} departments</p>
          </CardContent>
        </Card>
        </Link>

        <Link href="/admin/departments">
        <Card className="cursor-pointer border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalDepartments}</div>
            <p className="text-xs text-muted-foreground">Active departments</p>
          </CardContent>
        </Card>
        </Link>

        <Link href="/admin/requests?filter=approved">
        <Card className="cursor-pointer border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved This Week</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : approvedThisWeek}</div>
            <p className="text-xs text-muted-foreground">Requests approved</p>
          </CardContent>
        </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No requests yet.
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{formatRequestType(req.type)} Request</p>
                    <p className="text-xs text-muted-foreground">{req.facultyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      req.status === "PENDING"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        : req.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {req.status.toLowerCase()}
                  </span>
                </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/requests">
              <Button variant="outline" className="w-full justify-start border-border bg-background hover:bg-primary/5">
                <Clock className="mr-2 h-4 w-4" />
                Review Pending Requests
              </Button>
            </Link>
            <Link href="/admin/faculty">
              <Button variant="outline" className="w-full justify-start border-border bg-background hover:bg-primary/5">
                <Users className="mr-2 h-4 w-4" />
                Manage Faculty
              </Button>
            </Link>
            <Link href="/admin/departments">
              <Button variant="outline" className="w-full justify-start border-border bg-background hover:bg-primary/5">
                <Building2 className="mr-2 h-4 w-4" />
                Manage Departments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
