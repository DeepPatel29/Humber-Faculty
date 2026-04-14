"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { Loader2, Save, Clock, Calendar, BookOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  updateAvailabilitySchema,
  type UpdateAvailabilityInput,
} from "@/lib/validations/faculty";
import {
  DayOfWeek,
  PreferredSlot,
  type FacultyAvailability,
} from "@/lib/types/faculty";

const dayLabels: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "Monday",
  [DayOfWeek.TUESDAY]: "Tuesday",
  [DayOfWeek.WEDNESDAY]: "Wednesday",
  [DayOfWeek.THURSDAY]: "Thursday",
  [DayOfWeek.FRIDAY]: "Friday",
  [DayOfWeek.SATURDAY]: "Saturday",
  [DayOfWeek.SUNDAY]: "Sunday",
};

const slotLabels: Record<PreferredSlot, { label: string; time: string }> = {
  [PreferredSlot.MORNING]: { label: "Morning", time: "8:00 AM - 12:00 PM" },
  [PreferredSlot.AFTERNOON]: { label: "Afternoon", time: "12:00 PM - 5:00 PM" },
  [PreferredSlot.EVENING]: { label: "Evening", time: "5:00 PM - 9:00 PM" },
  [PreferredSlot.ANY]: { label: "Any Time", time: "Flexible schedule" },
};

const allDays: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

interface AvailabilityFormProps {
  availability: FacultyAvailability & {
    eligibleCourseIds?: string[];
    allCourses?: { id: string; name: string; code: string }[];
  };
  onSave?: (
    data: UpdateAvailabilityInput & { eligibleCourseIds?: string[] },
  ) => Promise<void>;
  isSubmitting?: boolean;
}

export function AvailabilityForm({
  availability,
  onSave,
  isSubmitting: externalSubmitting,
}: AvailabilityFormProps) {
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const isSubmitting = externalSubmitting ?? internalSubmitting;
  const [selectedCourses, setSelectedCourses] = useState<string[]>(
    availability?.eligibleCourseIds || [],
  );
  const [hasChanges, setHasChanges] = useState(false);

  const availabilityDays = Array.isArray(availability?.days)
    ? availability.days
    : [];

  const defaultDays = allDays.map((day) => {
    const existingDay = availabilityDays.find((d) => d.dayOfWeek === day);
    const isAvailable = existingDay?.isAvailable ?? true;
    return {
      dayOfWeek: day,
      isAvailable,
      startTime: existingDay?.startTime ?? (isAvailable ? "09:00" : undefined),
      endTime: existingDay?.endTime ?? (isAvailable ? "17:00" : undefined),
    };
  });

  const form = useForm<UpdateAvailabilityInput>({
    resolver: zodResolver(
      updateAvailabilitySchema,
    ) as Resolver<UpdateAvailabilityInput>,
    defaultValues: {
      preferredSlot: availability?.preferredSlot ?? PreferredSlot.ANY,
      customStartTime: availability?.customStartTime ?? "",
      customEndTime: availability?.customEndTime ?? "",
      unavailableStart: availability?.unavailableStart ?? "",
      unavailableEnd: availability?.unavailableEnd ?? "",
      notes: availability?.notes ?? "",
      days: defaultDays,
    },
  });

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const days = watch("days");

  const handleSubmit = async (data: UpdateAvailabilityInput) => {
    if (onSave) {
      await onSave({ ...data, eligibleCourseIds: selectedCourses });
    } else {
      setInternalSubmitting(true);
      try {
        const res = await fetch("/api/faculty/availability", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, eligibleCourseIds: selectedCourses }),
        });
        if (!res.ok) throw new Error("Failed to update availability");
        toast.success("Availability saved successfully");
        setHasChanges(false);
      } catch {
        toast.error("Failed to update availability");
      } finally {
        setInternalSubmitting(false);
      }
    }
  };

  const toggleDay = (dayIndex: number) => {
    const newDays = [...days];
    const wasAvailable = newDays[dayIndex].isAvailable;
    const nextAvailable = !wasAvailable;
    newDays[dayIndex] = {
      ...newDays[dayIndex],
      isAvailable: nextAvailable,
      startTime: nextAvailable
        ? newDays[dayIndex].startTime || "09:00"
        : undefined,
      endTime: nextAvailable ? newDays[dayIndex].endTime || "17:00" : undefined,
    };
    setValue("days", newDays);
    setHasChanges(true);
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
    setHasChanges(true);
  };

  const allCourses = availability?.allCourses || [];

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {/* Working Days */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Working Days
          </CardTitle>
          <CardDescription>
            Select the days you are available for classes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {days.map((day, index) => (
              <button
                key={day.dayOfWeek}
                type="button"
                onClick={() => toggleDay(index)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all",
                  day.isAvailable
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground",
                )}
              >
                <span className="text-sm font-medium">
                  {dayLabels[day.dayOfWeek].slice(0, 3)}
                </span>
                <span className="mt-1 text-xs">
                  {day.isAvailable ? "Available" : "Off"}
                </span>
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Hours for each available day</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {days.map((day, index) =>
                day.isAvailable ? (
                  <div
                    key={day.dayOfWeek}
                    className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-end"
                  >
                    <span className="text-sm font-medium text-muted-foreground sm:w-24 sm:shrink-0">
                      {dayLabels[day.dayOfWeek]}
                    </span>
                    <div className="grid flex-1 grid-cols-2 gap-2">
                      <Field>
                        <FieldLabel className="text-xs">From</FieldLabel>
                        <Input
                          type="time"
                          value={day.startTime ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            const next = [...days];
                            next[index] = {
                              ...next[index],
                              startTime: v || undefined,
                            };
                            setValue("days", next);
                            setHasChanges(true);
                          }}
                        />
                      </Field>
                      <Field>
                        <FieldLabel className="text-xs">To</FieldLabel>
                        <Input
                          type="time"
                          value={day.endTime ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            const next = [...days];
                            next[index] = {
                              ...next[index],
                              endTime: v || undefined,
                            };
                            setValue("days", next);
                            setHasChanges(true);
                          }}
                        />
                      </Field>
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferred Time Slot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Preferred Time Slot
          </CardTitle>
          <CardDescription>
            Choose when you prefer to have classes scheduled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            name="preferredSlot"
            control={control}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  setHasChanges(true);
                }}
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              >
                {Object.entries(slotLabels).map(([value, { label, time }]) => (
                  <Label
                    key={value}
                    className={cn(
                      "flex cursor-pointer flex-col items-center rounded-lg border-2 p-4 transition-all hover:bg-accent",
                      field.value === value
                        ? "border-primary bg-primary/5"
                        : "border-border",
                    )}
                  >
                    <RadioGroupItem value={value} className="sr-only" />
                    <span className="font-medium">{label}</span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {time}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            )}
          />
        </CardContent>
      </Card>

      {/* Custom Time Range */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Time Range</CardTitle>
          <CardDescription>
            Set specific hours if you have custom availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="customStartTime">Start Time</FieldLabel>
                <Input
                  id="customStartTime"
                  type="time"
                  {...register("customStartTime")}
                  onChange={(e) => {
                    register("customStartTime").onChange(e);
                    setHasChanges(true);
                  }}
                />
                {errors.customStartTime && (
                  <FieldError>{errors.customStartTime.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="customEndTime">End Time</FieldLabel>
                <Input
                  id="customEndTime"
                  type="time"
                  {...register("customEndTime")}
                  onChange={(e) => {
                    register("customEndTime").onChange(e);
                    setHasChanges(true);
                  }}
                />
                {errors.customEndTime && (
                  <FieldError>{errors.customEndTime.message}</FieldError>
                )}
              </Field>
            </div>

            <Separator />

            <div>
              <p className="mb-3 text-sm font-medium">
                Unavailable Period (e.g., lunch break)
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="unavailableStart">From</FieldLabel>
                  <Input
                    id="unavailableStart"
                    type="time"
                    {...register("unavailableStart")}
                    onChange={(e) => {
                      register("unavailableStart").onChange(e);
                      setHasChanges(true);
                    }}
                  />
                  {errors.unavailableStart && (
                    <FieldError>{errors.unavailableStart.message}</FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="unavailableEnd">To</FieldLabel>
                  <Input
                    id="unavailableEnd"
                    type="time"
                    {...register("unavailableEnd")}
                    onChange={(e) => {
                      register("unavailableEnd").onChange(e);
                      setHasChanges(true);
                    }}
                  />
                  {errors.unavailableEnd && (
                    <FieldError>{errors.unavailableEnd.message}</FieldError>
                  )}
                </Field>
              </div>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Course Eligibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Eligibility
          </CardTitle>
          <CardDescription>
            Select courses you are qualified and available to teach. This
            information will be used by schedulers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allCourses.map((course) => {
              const selected = selectedCourses.includes(course.id);
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => toggleCourse(course.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30 hover:bg-muted/30",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2",
                      selected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30",
                    )}
                  >
                    {selected && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {course.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {course.code}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedCourses.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Selected:</span>
              {selectedCourses.map((id) => {
                const course = allCourses.find((c) => c.id === id);
                return course ? (
                  <Badge key={id} variant="secondary" className="text-xs">
                    {course.code}
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
          <CardDescription>
            Any special scheduling requirements or preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register("notes")}
            onChange={(e) => {
              register("notes").onChange(e);
              setHasChanges(true);
            }}
            placeholder="E.g., No classes on Wednesday afternoons due to research meetings..."
            className="min-h-[100px] resize-none"
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => form.handleSubmit((data) => handleSubmit(data))()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Sticky Save Bar */}
      {hasChanges && (
        <div className="sticky bottom-0 -mx-6 -mb-6 border-t border-border bg-card/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              You have unsaved changes
            </p>
            <Button
              size="sm"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => form.handleSubmit((data) => handleSubmit(data))()}
            >
              <Save className="mr-1.5 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
