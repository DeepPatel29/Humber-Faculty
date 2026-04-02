"use client";

import { FacultyHeader } from "@/components/faculty/faculty-header";
import { AvailabilityForm } from "@/components/faculty/availability-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvailability, useUnreadCount, useUpdateAvailability } from "@/hooks/use-faculty";
import { toast } from "sonner";
import type { UpdateAvailabilityInput } from "@/lib/validations/faculty";

function AvailabilitySkeleton() {
  return (
    <div className="space-y-6">
      {/* Working Days Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Slot Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Range Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AvailabilityPage() {
  const { data: availability, isLoading, error, mutate } = useAvailability();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { trigger: updateAvailabilityMutation, isMutating } = useUpdateAvailability();

  const handleSave = async (formData: UpdateAvailabilityInput) => {
    try {
      await updateAvailabilityMutation(formData);
      await mutate();
      toast.success("Availability updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update availability");
      throw err;
    }
  };

  if (error) {
    return (
      <>
        <FacultyHeader
          title="Availability"
          description="Set your preferred working days and time slots"
          unreadNotifications={0}
        />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl p-6">
            <Card>
              <CardContent className="flex min-h-[400px] items-center justify-center p-6">
                <div className="text-center">
                  <p className="text-lg font-medium text-destructive">
                    Failed to load availability
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {error.message}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <FacultyHeader
        title="Availability"
        description="Set your preferred working days and time slots"
        unreadNotifications={unreadCount}
      />

    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-6">
          {isLoading || !availability ? (
            <AvailabilitySkeleton />
          ) : (
            <AvailabilityForm 
              availability={availability} 
              onSave={handleSave}
              isSubmitting={isMutating}
            />
          )}
        </div>
      </div>
    </>
  );
}
