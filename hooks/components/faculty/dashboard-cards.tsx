"use client";

import { Calendar, Users, Clock, Briefcase, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardSummaryCard } from "@/lib/types/faculty";

interface DashboardCardsProps {
  cards: DashboardSummaryCard[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  calendar: Calendar,
  users: Users,
  clock: Clock,
  briefcase: Briefcase,
};

export function DashboardCards({ cards }: DashboardCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = iconMap[card.icon] || Calendar;
        const hasChange = card.change !== undefined && card.change !== 0;
        const isPositive = card.change !== undefined && card.change > 0;

        return (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {card.value}
                  </p>
                  {card.changeLabel && (
                    <div className="flex items-center gap-1.5 text-sm">
                      {hasChange && (
                        <>
                          {isPositive ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span
                            className={cn(
                              "font-medium",
                              isPositive ? "text-green-600" : "text-red-600"
                            )}
                          >
                            {isPositive ? "+" : ""}
                            {card.change}
                          </span>
                        </>
                      )}
                      <span className="text-muted-foreground">
                        {card.changeLabel}
                      </span>
                    </div>
                  )}
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
