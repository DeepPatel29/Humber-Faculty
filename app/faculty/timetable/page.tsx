"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime, getDayName } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  List,
  Grid3X3,
  LayoutGrid,
} from "lucide-react";
import { useTimetable } from "@/hooks/use-faculty";

type ViewMode = "day" | "week" | "month";

const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_FULL = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const typeBorder: Record<string, string> = {
  LECTURE: "border-l-primary bg-primary/10 dark:bg-primary/15",
  LAB: "border-l-green-500 bg-green-50/70 dark:bg-green-950/30",
  TUTORIAL: "border-l-purple-500 bg-purple-50/70 dark:bg-purple-950/30",
  SEMINAR: "border-l-amber-500 bg-amber-50/70 dark:bg-amber-950/30",
  OFFICE_HOURS: "border-l-gray-400 bg-gray-50/70 dark:bg-zinc-800/30",
};

const typeDot: Record<string, string> = {
  LECTURE: "bg-primary",
  LAB: "bg-green-500",
  TUTORIAL: "bg-purple-500",
  SEMINAR: "bg-amber-500",
  OFFICE_HOURS: "bg-gray-400",
};

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);
  const grid: { date: Date; isCurrentMonth: boolean }[] = [];

  for (let i = startDay - 1; i >= 0; i--) {
    grid.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    grid.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  const remaining = 42 - grid.length;
  for (let i = 1; i <= remaining; i++) {
    grid.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }

  return grid;
}

function getField(item: any, ...keys: string[]): string {
  for (const k of keys) {
    if (item[k] != null && item[k] !== "") return String(item[k]);
  }
  return "";
}

function ClassCard({ item, compact = false }: { item: any; compact?: boolean }) {
  const name = getField(item, "courseName", "course_name", "name");
  const code = getField(item, "courseCode", "course_code", "code");
  const start = getField(item, "startTime", "start_time");
  const end = getField(item, "endTime", "end_time");
  const room = getField(item, "roomName", "room_name", "room");
  const bldg = getField(item, "building");
  const type = getField(item, "type") || "LECTURE";
  const section = getField(item, "section");

  if (compact) {
    return (
      <div
        className={`rounded border-l-2 px-2 py-1 text-xs ${
          typeBorder[type] || typeBorder.OFFICE_HOURS
        } cursor-default hover:opacity-80 transition-opacity`}
      >
        <p className="font-medium truncate">{name}</p>
        {start && <p className="text-[10px] text-muted-foreground">{formatTime(start)}</p>}
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-l-4 p-3 ${
        typeBorder[type] || typeBorder.OFFICE_HOURS
      } transition-all hover:shadow-sm`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-tight">{name}</h4>
        <Badge variant="outline" className="text-[10px] shrink-0">
          {type}
        </Badge>
      </div>
      {code && (
        <p className="mt-0.5 text-xs font-mono text-muted-foreground">
          {code}
          {section ? ` - Section ${section}` : ""}
        </p>
      )}
      <div className="mt-2 space-y-1">
        {start && end && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(start)} - {formatTime(end)}
          </p>
        )}
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {room || "TBA"}
          {bldg ? ` • ${bldg}` : ""}
        </p>
      </div>
    </div>
  );
}

function MonthView({
  year,
  month,
  schedule,
  today,
}: {
  year: number;
  month: number;
  schedule: any[];
  today: Date;
}) {
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  function getClassesForDate(date: Date) {
    const jsDayIdx = date.getDay();
    const dayName = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ][jsDayIdx];
    return schedule.filter((s) => {
      const d = getField(s, "dayOfWeek", "day_of_week", "day");
      return d.toUpperCase() === dayName;
    });
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="grid grid-cols-7 border-b">
        {WEEKDAY_NAMES.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-xs font-semibold text-muted-foreground border-r last:border-r-0 bg-muted/30"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grid.map((cell, idx) => {
          const isToday = isSameDay(cell.date, today);
          const classes = cell.isCurrentMonth ? getClassesForDate(cell.date) : [];
          const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;

          return (
            <div
              key={idx}
              className={`min-h-[120px] border-r border-b last:border-r-0 p-1.5 transition-colors ${
                !cell.isCurrentMonth
                  ? "bg-muted/20"
                  : isWeekend
                  ? "bg-muted/10"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : !cell.isCurrentMonth
                      ? "text-muted-foreground/40"
                      : isWeekend
                      ? "text-primary"
                      : "text-foreground"
                  }`}
                >
                  {cell.date.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {classes.slice(0, 3).map((item: any, i: number) => (
                  <ClassCard key={item.id || i} item={item} compact />
                ))}
                {classes.length > 3 && (
                  <p className="text-[10px] text-muted-foreground pl-1">
                    +{classes.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  weekStart,
  schedule,
  today,
}: {
  weekStart: Date;
  schedule: any[];
  today: Date;
}) {
  const TIME_HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="grid grid-cols-8">
        <div className="border-r border-b py-3 px-2 bg-muted/30" />
        {WEEKDAY_NAMES.map((day, i) => {
          const date = addDays(weekStart, i);
          const isToday = isSameDay(date, today);
          return (
            <div
              key={day}
              className={`border-r border-b last:border-r-0 py-3 text-center bg-muted/30 ${
                isToday ? "bg-primary/10 dark:bg-primary/15" : ""
              }`}
            >
              <p className="text-xs text-muted-foreground">{day}</p>
              <p
                className={`text-lg font-semibold mt-0.5 ${
                  isToday ? "text-primary" : ""
                }`}
              >
                {date.getDate()}
              </p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-8">
        {TIME_HOURS.map((hour) => (
          <div key={hour} className="contents">
            <div className="border-r border-b py-3 px-2 text-right">
              <span className="text-[11px] text-muted-foreground">
                {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? "PM" : "AM"}
              </span>
            </div>
            {WEEKDAY_FULL.map((dayName, dayIdx) => {
              const dayClasses = schedule.filter((s) => {
                const d = getField(s, "dayOfWeek", "day_of_week", "day").toUpperCase();
                const startHour = parseInt(
                  getField(s, "startTime", "start_time").split(":")[0] || "0"
                );
                return d === dayName && startHour === hour;
              });
              const date = addDays(weekStart, dayIdx);
              const isToday = isSameDay(date, today);
              return (
                <div
                  key={`${hour}-${dayName}`}
                  className={`border-r border-b last:border-r-0 p-1 min-h-[60px] ${
                    isToday ? "bg-primary/5 dark:bg-primary/10" : ""
                  }`}
                >
                  {dayClasses.map((item: any, i: number) => (
                    <ClassCard key={item.id || i} item={item} compact />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayView({ date, schedule }: { date: Date; schedule: any[] }) {
  const jsDayIdx = date.getDay();
  const dayName = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ][jsDayIdx];

  const dayClasses = schedule
    .filter(
      (s) => getField(s, "dayOfWeek", "day_of_week", "day").toUpperCase() === dayName
    )
    .sort((a, b) =>
      getField(a, "startTime", "start_time").localeCompare(
        getField(b, "startTime", "start_time")
      )
    );

  const TIME_HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="grid grid-cols-[80px_1fr]">
        {TIME_HOURS.map((hour) => {
          const hourClasses = dayClasses.filter((s) => {
            const startHour = parseInt(
              getField(s, "startTime", "start_time").split(":")[0] || "0"
            );
            return startHour === hour;
          });
          return (
            <div key={hour} className="contents">
              <div className="border-r border-b py-4 px-3 text-right">
                <span className="text-xs text-muted-foreground">
                  {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? "PM" : "AM"}
                </span>
              </div>
              <div className="border-b p-2 min-h-[80px]">
                <div className="space-y-2">
                  {hourClasses.map((item: any, i: number) => (
                    <ClassCard key={item.id || i} item={item} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TimetablePage() {
  const [view, setView] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const weekStart = getMonday(currentDate);

  const { data: rawData, isLoading } = useTimetable({});
  const schedule = Array.isArray(rawData) ? rawData.filter(Boolean) : [];

  function navigate(direction: number) {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + direction);
    else if (view === "week") d.setDate(d.getDate() + direction * 7);
    else d.setDate(d.getDate() + direction);
    setCurrentDate(d);
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  const headerLabel = (() => {
    if (view === "month") return `${MONTH_NAMES[month]} ${year}`;
    if (view === "week") {
      const end = addDays(weekStart, 6);
      return `${weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} — ${end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    }
    return currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  })();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{headerLabel}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-lg border bg-card">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-none border-x px-4 text-xs font-medium"
              onClick={goToday}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => navigate(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center rounded-lg border bg-card">
            <Button
              variant={view === "day" ? "default" : "ghost"}
              size="sm"
              className="h-9 rounded-r-none text-xs"
              onClick={() => setView("day")}
            >
              <List className="h-3.5 w-3.5 mr-1.5" />
              Day
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              className="h-9 rounded-none border-x text-xs"
              onClick={() => setView("week")}
            >
              <Grid3X3 className="h-3.5 w-3.5 mr-1.5" />
              Week
            </Button>
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              className="h-9 rounded-l-none text-xs"
              onClick={() => setView("month")}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
              Month
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(typeDot).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            {type.charAt(0) + type.slice(1).toLowerCase().replace("_", " ")}
          </span>
        ))}
      </div>

      {view === "month" && (
        <MonthView year={year} month={month} schedule={schedule} today={today} />
      )}
      {view === "week" && (
        <WeekView weekStart={weekStart} schedule={schedule} today={today} />
      )}
      {view === "day" && <DayView date={currentDate} schedule={schedule} />}
    </div>
  );
}
