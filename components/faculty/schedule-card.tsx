"use client";

// Faculty Schedule Card Component
import Link from "next/link";
import { ArrowRight, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { ScheduleItemType, type FacultyScheduleItem } from "@/lib/types/faculty";
import { Calendar } from "lucide-react";

interface ScheduleCardProps {
  title: string;
  items: FacultyScheduleItem[];
  emptyMessage?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
}

const typeColors: Record<ScheduleItemType, string> = {
  [ScheduleItemType.LECTURE]: "bg-blue-500",
  [ScheduleItemType.LAB]: "bg-green-500",
  [ScheduleItemType.TUTORIAL]: "bg-amber-500",
  [ScheduleItemType.SEMINAR]: "bg-purple-500",
  [ScheduleItemType.OFFICE_HOURS]: "bg-gray-500",
};

export function ScheduleCard({
  title,
  items,
  emptyMessage = "No classes scheduled",
  showViewAll = true,
  viewAllHref = "/faculty/timetable",
}: ScheduleCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {showViewAll && items.length > 0 && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={viewAllHref} className="gap-1">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        {items.length === 0 ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Calendar className="h-4 w-4" />
              </EmptyMedia>
              <EmptyTitle className="text-base">{emptyMessage}</EmptyTitle>
              <EmptyDescription>Enjoy your free time!</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50"
              >
                {/* Time indicator */}
                <div
                  className={cn(
                    "w-1 shrink-0 rounded-full",
                    typeColors[item.type]
                  )}
                />

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-foreground">
                        {item.course.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {item.course.code}
                        {item.section && ` - Section ${item.section}`}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {item.type}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {item.startTime} - {item.endTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {item.room.building} {item.room.name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
