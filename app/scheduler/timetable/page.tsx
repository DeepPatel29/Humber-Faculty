"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, User, Building2 } from "lucide-react";
import { ReadOnlyBanner } from "@/components/role-gate";
import { DayOfWeek } from "@/lib/types/faculty";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const DAYS = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

export default function SchedulerTimetablePage() {
  const { data: facultyData, isLoading: facultyLoading } = useSWR(
    "/api/admin/faculty",
    fetcher
  );

  const faculty = facultyData?.data?.faculty || [];

  return (
    <div className="space-y-6">
      <ReadOnlyBanner />

      <div>
        <h1 className="text-2xl font-bold">Faculty Timetables</h1>
        <p className="text-muted-foreground">
          View faculty schedules for scheduling purposes
        </p>
      </div>

      {facultyLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {faculty.map((f: any) => (
            <Card key={f.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{f.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {f.designation} • {f.department}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    {f.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2 text-center text-xs font-medium text-muted-foreground mb-2">
                  {DAYS.map((day) => (
                    <div key={day} className="py-1">
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                    </div>
                  ))}
                </div>
                <div className="text-center text-sm text-muted-foreground py-4 border rounded-lg">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Schedule data will appear here</p>
                  <p className="text-xs">Based on faculty availability</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {faculty.length === 0 && (
            <Card>
              <CardContent className="flex min-h-[200px] items-center justify-center">
                <p className="text-muted-foreground">No faculty schedules to display</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
