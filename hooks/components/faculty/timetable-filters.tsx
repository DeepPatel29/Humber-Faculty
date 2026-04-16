"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TimetableFiltersProps {
  weekStart: string;
  weekEnd: string;
  view: "week" | "day" | "month";
  courseCode?: string;
  program?: string;
  onWeekChange: (direction: "prev" | "next" | "today") => void;
  onViewChange: (view: "week" | "day" | "month") => void;
  onCourseChange: (code: string | undefined) => void;
  onProgramChange: (program: string | undefined) => void;
  courses: Array<{ code: string; name: string }>;
  programs: string[];
}

export function TimetableFilters({
  weekStart,
  weekEnd,
  view,
  courseCode,
  program,
  onWeekChange,
  onViewChange,
  onCourseChange,
  onProgramChange,
  courses,
  programs,
}: TimetableFiltersProps) {
  const formatDateRange = () => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const startDay = start.getDate();
    const endDay = end.getDate();
    const year = end.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onWeekChange("prev")}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={() => onWeekChange("today")}
          className="h-9 px-3"
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Today
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onWeekChange("next")}
          className="h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="ml-2 text-sm font-medium text-foreground">
          {formatDateRange()}
        </span>
      </div>

      {/* Right: Filters & Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* View Toggle */}
        <Select value={view} onValueChange={(v) => onViewChange(v as "week" | "day" | "month")}>
          <SelectTrigger className="h-9 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>

        {/* Course Filter */}
        <Select
          value={courseCode ?? "all"}
          onValueChange={(v) => onCourseChange(v === "all" ? undefined : v)}
        >
          <SelectTrigger className="h-9 w-40">
            <Filter className="mr-2 h-3.5 w-3.5" />
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.code} value={course.code}>
                {course.code} - {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Program Filter */}
        <Select
          value={program ?? "all"}
          onValueChange={(v) => onProgramChange(v === "all" ? undefined : v)}
        >
          <SelectTrigger className="h-9 w-32">
            <SelectValue placeholder="All Programs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Export as PDF</DropdownMenuItem>
            <DropdownMenuItem>Export as ICS</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
