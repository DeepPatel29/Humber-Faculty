"use client";

// Faculty Request Dialogs Component
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, ArrowLeftRight, CalendarClock, CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { toast } from "sonner";
import {
  createSwapRequestSchema,
  createRescheduleRequestSchema,
  createLeaveRequestSchema,
  type CreateSwapRequestInput,
  type CreateRescheduleRequestInput,
  type CreateLeaveRequestInput,
} from "@/lib/validations/faculty";
import type { ClassOption, ColleagueOption } from "@/lib/types/faculty";

// ============================================================================
// Swap Request Dialog
// ============================================================================

interface SwapRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myClasses: ClassOption[];
  colleagues: ColleagueOption[];
  onSuccess?: () => void;
}

export function SwapRequestDialog({
  open,
  onOpenChange,
  myClasses,
  colleagues,
  onSuccess,
}: SwapRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateSwapRequestInput>({
    resolver: zodResolver(createSwapRequestSchema),
    defaultValues: {
      targetFacultyId: "",
      targetScheduleId: "",
      myScheduleId: "",
      effectiveDate: "",
      reason: "",
    },
  });

  const { register, setValue, watch, formState: { errors }, reset } = form;

  // Safely normalize arrays
  const classesList = Array.isArray(myClasses) ? myClasses : [];
  const colleaguesList = Array.isArray(colleagues) ? colleagues : [];

  const handleSubmit = async (data: CreateSwapRequestInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/faculty/requests/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create request");
      toast.success("Swap request submitted successfully");
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to submit swap request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Request Class Swap
          </DialogTitle>
          <DialogDescription>
            Swap one of your classes with a colleague
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup className="py-4">
            {classesList.length === 0 && (
              <p className="text-sm text-muted-foreground rounded-md border border-border bg-muted/40 p-3">
                No active class assignments were found for your account. The list includes every
                scheduled slot (even if course or room is not filled in yet). If this stays empty,
                scheduling may not have assigned you sections, or your login may not be linked to a
                faculty profile.
              </p>
            )}
            <Field>
              <FieldLabel>My Class</FieldLabel>
              <Select
                value={watch("myScheduleId") || undefined}
                onValueChange={(v) => setValue("myScheduleId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your class" />
                </SelectTrigger>
                <SelectContent>
                  {classesList.length === 0 ? (
                    <SelectItem value="_empty" disabled>
                      No classes available
                    </SelectItem>
                  ) : (
                    classesList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.courseCode} · {c.dayOfWeek} {c.startTime}–{c.endTime}
                        {c.room ? ` · ${c.room}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.myScheduleId && (
                <FieldError>{errors.myScheduleId.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>Colleague</FieldLabel>
              <Select
                value={watch("targetFacultyId") || undefined}
                onValueChange={(v) => setValue("targetFacultyId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select colleague" />
                </SelectTrigger>
                <SelectContent>
                  {colleaguesList.length === 0 ? (
                    <SelectItem value="_empty" disabled>
                      No colleagues available
                    </SelectItem>
                  ) : (
                    colleaguesList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.designation})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.targetFacultyId && (
                <FieldError>{errors.targetFacultyId.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>Target Schedule ID</FieldLabel>
              <Input {...register("targetScheduleId")} placeholder="Colleague's class ID" />
              {errors.targetScheduleId && (
                <FieldError>{errors.targetScheduleId.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>Effective Date</FieldLabel>
              <Input type="date" {...register("effectiveDate")} />
              {errors.effectiveDate && (
                <FieldError>{errors.effectiveDate.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>Reason</FieldLabel>
              <Textarea
                {...register("reason")}
                placeholder="Explain why you need this swap..."
                className="min-h-[80px] resize-none"
              />
              {errors.reason && <FieldError>{errors.reason.message}</FieldError>}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                classesList.length === 0 ||
                !watch("myScheduleId")
              }
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Reschedule Request Dialog
// ============================================================================

interface RescheduleRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myClasses: ClassOption[];
  onSuccess?: () => void;
}

export function RescheduleRequestDialog({
  open,
  onOpenChange,
  myClasses,
  onSuccess,
}: RescheduleRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateRescheduleRequestInput>({
    resolver: zodResolver(createRescheduleRequestSchema),
    defaultValues: {
      scheduleId: "",
      newDate: "",
      newStartTime: "",
      newEndTime: "",
      reason: "",
    },
  });

  const { register, setValue, watch, formState: { errors }, reset } = form;

  // Safely normalize myClasses to always be an array
  const classesList = Array.isArray(myClasses) ? myClasses : [];

  const handleSubmit = async (data: CreateRescheduleRequestInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/faculty/requests/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create request");
      toast.success("Reschedule request submitted successfully");
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to submit reschedule request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Request Class Reschedule
          </DialogTitle>
          <DialogDescription>
            Move a class to a different date or time
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup className="py-4">
            {classesList.length === 0 && (
              <p className="text-sm text-muted-foreground rounded-md border border-border bg-muted/40 p-3">
                Nothing listed usually means you have no active teaching assignments in the database
                yet, or your account is not linked to a faculty record. If options show{' '}
                <span className="font-medium text-foreground">No course linked</span> or{' '}
                <span className="font-medium text-foreground">No room</span>, you can still select
                that row—it is a real scheduled slot with incomplete course or room data.
              </p>
            )}
            <Field>
              <FieldLabel>Class to Reschedule</FieldLabel>
              <Select
                value={watch("scheduleId") || undefined}
                onValueChange={(v) => setValue("scheduleId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classesList.length === 0 ? (
                    <SelectItem value="_empty" disabled>
                      No classes available
                    </SelectItem>
                  ) : (
                    classesList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.courseCode} · {c.dayOfWeek} {c.startTime}–{c.endTime}
                        {c.room ? ` · ${c.room}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.scheduleId && <FieldError>{errors.scheduleId.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>New Date</FieldLabel>
              <Input type="date" {...register("newDate")} />
              {errors.newDate && <FieldError>{errors.newDate.message}</FieldError>}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>New Start Time</FieldLabel>
                <Input type="time" {...register("newStartTime")} />
                {errors.newStartTime && (
                  <FieldError>{errors.newStartTime.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>New End Time</FieldLabel>
                <Input type="time" {...register("newEndTime")} />
                {errors.newEndTime && (
                  <FieldError>{errors.newEndTime.message}</FieldError>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel>Reason</FieldLabel>
              <Textarea
                {...register("reason")}
                placeholder="Explain why you need this reschedule..."
                className="min-h-[80px] resize-none"
              />
              {errors.reason && <FieldError>{errors.reason.message}</FieldError>}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                classesList.length === 0 ||
                !watch("scheduleId")
              }
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Leave Request Dialog
// ============================================================================

interface LeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LeaveRequestDialog({
  open,
  onOpenChange,
  onSuccess,
}: LeaveRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateLeaveRequestInput>({
    resolver: zodResolver(createLeaveRequestSchema),
    defaultValues: {
      effectiveDate: "",
      endDate: "",
      reason: "",
    },
  });

  const { register, formState: { errors }, reset } = form;

  const handleSubmit = async (data: CreateLeaveRequestInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/faculty/requests/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create request");
      toast.success("Leave request submitted successfully");
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to submit leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5" />
            Request Leave
          </DialogTitle>
          <DialogDescription>
            Submit a leave request for approval
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup className="py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Start Date</FieldLabel>
                <Input type="date" {...register("effectiveDate")} />
                {errors.effectiveDate && (
                  <FieldError>{errors.effectiveDate.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>End Date</FieldLabel>
                <Input type="date" {...register("endDate")} />
                {errors.endDate && <FieldError>{errors.endDate.message}</FieldError>}
              </Field>
            </div>

            <Field>
              <FieldLabel>Reason</FieldLabel>
              <Textarea
                {...register("reason")}
                placeholder="Explain the reason for your leave..."
                className="min-h-[100px] resize-none"
              />
              {errors.reason && <FieldError>{errors.reason.message}</FieldError>}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
