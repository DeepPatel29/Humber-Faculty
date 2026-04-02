"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DayOfWeek, ScheduleItemType, type FacultyScheduleItem } from "@/lib/types/faculty";

interface TimetableGridProps {
  items: FacultyScheduleItem[];
  weekStart: string;
}

const days: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

const dayLabels: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "Mon",
  [DayOfWeek.TUESDAY]: "Tue",
  [DayOfWeek.WEDNESDAY]: "Wed",
  [DayOfWeek.THURSDAY]: "Thu",
  [DayOfWeek.FRIDAY]: "Fri",
  [DayOfWeek.SATURDAY]: "Sat",
  [DayOfWeek.SUNDAY]: "Sun",
};

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
];

const typeColors: Record<ScheduleItemType, string> = {
  [ScheduleItemType.LECTURE]: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300",
  [ScheduleItemType.LAB]: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300",
  [ScheduleItemType.TUTORIAL]: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300",
  [ScheduleItemType.SEMINAR]: "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300",
  [ScheduleItemType.OFFICE_HOURS]: "bg-gray-500/10 border-gray-500/30 text-gray-700 dark:text-gray-300",
};

function getDateForDay(weekStart: string, day: DayOfWeek): string {
  const start = new Date(weekStart);
  const dayIndex = days.indexOf(day);
  const date = new Date(start);
  date.setDate(start.getDate() + dayIndex);
  return date.getDate().toString();
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function TimetableGrid({ items, weekStart }: TimetableGridProps) {
  const getItemsForDayAndTime = (day: DayOfWeek, timeSlot: string) => {
    const slotStart = timeToMinutes(timeSlot);
    const slotEnd = slotStart + 60;

    return items.filter((item) => {
      if (item.dayOfWeek !== day) return false;
      const itemStart = timeToMinutes(item.startTime);
      const itemEnd = timeToMinutes(item.endTime);
      return itemStart < slotEnd && itemEnd > slotStart;
    });
  };

  const isItemStartingAt = (item: FacultyScheduleItem, timeSlot: string): boolean => {
    const itemStart = timeToMinutes(item.startTime);
    const slotStart = timeToMinutes(timeSlot);
    return itemStart >= slotStart && itemStart < slotStart + 60;
  };

  const getItemDuration = (item: FacultyScheduleItem): number => {
    const start = timeToMinutes(item.startTime);
    const end = timeToMinutes(item.endTime);
    return Math.ceil((end - start) / 60);
  };

  return (
    <TooltipProvider>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-border">
              <div className="border-r border-border bg-muted/50 p-3" />
              {days.map((day) => (
                <div
                  key={day}
                  className="border-r border-border bg-muted/50 p-3 text-center last:border-r-0"
                >
                  <p className="text-sm font-medium text-foreground">{dayLabels[day]}</p>
                  <p className="text-2xl font-semibold text-foreground">
                    {getDateForDay(weekStart, day)}
                  </p>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="grid grid-cols-[80px_repeat(6,1fr)]">
              {timeSlots.map((timeSlot, timeIndex) => (
                <div key={timeSlot} className="contents">
                  {/* Time Label */}
                  <div
                    className={cn(
                      "flex items-start justify-center border-r border-border p-2 text-xs text-muted-foreground",
                      timeIndex < timeSlots.length - 1 && "border-b"
                    )}
                  >
                    {timeSlot}
                  </div>

                  {/* Day Cells */}
                  {days.map((day) => {
                    const dayItems = getItemsForDayAndTime(day, timeSlot);
                    const startingItems = dayItems.filter((item) =>
                      isItemStartingAt(item, timeSlot)
                    );

                    return (
                      <div
                        key={`${day}-${timeSlot}`}
                        className={cn(
                          "relative min-h-[60px] border-r border-border p-1 last:border-r-0",
                          timeIndex < timeSlots.length - 1 && "border-b"
                        )}
                      >
                        {startingItems.map((item) => {
                          const duration = getItemDuration(item);
                          return (
                            <Tooltip key={item.id}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "absolute inset-x-1 cursor-pointer rounded-md border p-2 transition-shadow hover:shadow-md",
                                    typeColors[item.type]
                                  )}
                                  style={{
                                    height: `calc(${duration * 60}px - 8px)`,
                                    zIndex: 10,
                                  }}
                                >
                                  <p className="truncate text-xs font-semibold">
                                    {item.course.code}
                                  </p>
                                  <p className="truncate text-xs opacity-80">
                                    {item.room.name}
                                  </p>
                                  {duration > 1 && (
                                    <p className="mt-1 truncate text-[10px] opacity-70">
                                      {item.startTime} - {item.endTime}
                                    </p>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className="max-w-xs space-y-2 p-3"
                              >
                                <div>
                                  <p className="font-semibold">{item.course.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.course.code}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  <Badge variant="secondary">{item.type}</Badge>
                                  {item.section && (
                                    <Badge variant="outline">Section {item.section}</Badge>
                                  )}
                                  {item.program && (
                                    <Badge variant="outline">{item.program}</Badge>
                                  )}
                                </div>
                                <div className="text-sm">
                                  <p>
                                    <span className="text-muted-foreground">Time:</span>{" "}
                                    {item.startTime} - {item.endTime}
                                  </p>
                                  <p>
                                    <span className="text-muted-foreground">Room:</span>{" "}
                                    {item.room.building} {item.room.name}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}
