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

interface FacultySummary {
  id: string;
  name: string;
  designation: string;
  schedules: TimetableSlot[];
  acceptedAssignments: TimetableSlot[];
}

interface TimetableSlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  roomLabel: string;
  source: "BASE_TIMETABLE" | "ACCEPTED_REQUEST";
}

export default function SchedulerTimetablePage() {
  const { data, isLoading } = useSWR(
    "/api/scheduler/timetable",
    fetcher
  );

  const faculty: FacultySummary[] = data?.data?.faculty || [];

  return (
    <div className="space-y-6">
      <ReadOnlyBanner />

      <div>
        <h1 className="text-2xl font-bold">Faculty Timetables</h1>
        <p className="text-muted-foreground">
          View faculty schedules for scheduling purposes
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {faculty.map((f) => {
            const allSlots = [...f.schedules, ...f.acceptedAssignments];
            const slotsByDay = DAYS.reduce<Record<string, TimetableSlot[]>>(
              (acc, day) => {
                acc[day] = allSlots
                  .filter((slot) => (slot.dayOfWeek || "").toUpperCase() === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                return acc;
              },
              {}
            );

            return (
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
                        {f.designation}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600">FACULTY</Badge>
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
                <div className="grid grid-cols-5 gap-2">
                  {DAYS.map((day) => (
                    <div key={day} className="min-h-28 rounded-lg border p-2 space-y-2">
                      {slotsByDay[day].length > 0 ? (
                        slotsByDay[day].map((slot) => (
                          <div key={slot.id} className="rounded-md bg-muted/50 p-2 text-left">
                            <p className="text-xs font-medium leading-tight">
                              {slot.courseCode || "COURSE"}
                            </p>
                            <p className="text-xs text-muted-foreground leading-tight">
                              {slot.courseName}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {slot.startTime} - {slot.endTime}
                            </p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {slot.roomLabel || "TBA"}
                            </p>
                            {slot.source === "ACCEPTED_REQUEST" && (
                              <p className="mt-1 text-[10px] font-medium text-green-600">
                                Accepted request
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="flex h-full min-h-20 items-center justify-center text-[11px] text-muted-foreground">
                          No class
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {allSlots.length === 0 && (
                  <div className="mt-3 text-center text-xs text-muted-foreground">
                    <Calendar className="h-4 w-4 inline-block mr-1 -mt-0.5 opacity-70" />
                    No timetable entries for this faculty yet
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}

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
