"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Clock } from "lucide-react";
import { ReadOnlyBanner } from "@/components/role-gate";
import { useRoleAuth } from "@/hooks/use-role-auth";

export default function SchedulerDashboardPage() {
  const { user } = useRoleAuth();

  return (
    <div className="space-y-6">
      <ReadOnlyBanner />

      <div>
        <h1 className="text-2xl font-bold">Scheduler Dashboard</h1>
        <p className="text-muted-foreground">
          View faculty availability and constraints for scheduling
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty to Schedule</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">Active faculty members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Total scheduled sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Availability Set</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42/48</div>
            <p className="text-xs text-muted-foreground">Faculty with constraints</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faculty Availability Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Dr. John Smith", preferred: "Morning", status: "Available" },
              { name: "Dr. Jane Doe", preferred: "Afternoon", status: "Available" },
              { name: "Dr. Robert Johnson", preferred: "Morning", status: "Limited" },
              { name: "Dr. Emily Chen", preferred: "Evening", status: "Available" },
            ].map((faculty, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="text-sm font-medium">{faculty.name}</p>
                  <p className="text-xs text-muted-foreground">Prefers {faculty.preferred}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    faculty.status === "Available"
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                  }`}
                >
                  {faculty.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
