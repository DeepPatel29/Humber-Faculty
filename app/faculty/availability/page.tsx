"use client";

import { AvailabilityForm } from "@/components/faculty/availability-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvailability, useUpdateAvailability } from "@/hooks/use-faculty";
import { toast } from "sonner";
import type { UpdateAvailabilityInput } from "@/lib/validations/faculty";

function AvailabilitySkeleton() {
  return (
    <div className="space-y-6">
      {/* Working Days Skeleton */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </Card>

      {/* Time Slot Skeleton */}
      <Card>
        <div className="p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </Card>

      {/* Time Range Skeleton */}
      <Card>
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function AvailabilityPage() {
  const { data: availability, isLoading, error, mutate } = useAvailability();
  const { trigger: updateAvailabilityMutation, isMutating } =
    useUpdateAvailability();

  const handleSave = async (formData: UpdateAvailabilityInput) => {
    await updateAvailabilityMutation(formData);
    await mutate();
    toast.success("Availability updated successfully");
  };

  if (error) {
    return (
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
    );
  }

  return (
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
  );
}
