"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createFacultyResourceSchema,
  type CreateFacultyResourceFormValues,
  type CreateFacultyResourceInput,
} from "@/lib/validations/faculty";

interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

interface FacultyCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: DepartmentOption[];
  onSubmit: (data: CreateFacultyResourceInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function FacultyCreateDialog({
  open,
  onOpenChange,
  departments,
  onSubmit,
  isSubmitting = false,
}: FacultyCreateDialogProps) {
  const form = useForm<CreateFacultyResourceFormValues, unknown, CreateFacultyResourceInput>({
    resolver: zodResolver(
      createFacultyResourceSchema
    ) as Resolver<CreateFacultyResourceFormValues, unknown, CreateFacultyResourceInput>,
    defaultValues: {
      userId: "",
      departmentId: "",
      employeeId: "",
      designation: "",
      joiningDate: undefined,
    },
  });

  async function handleSubmit(values: CreateFacultyResourceInput) {
    try {
      await onSubmit(values);
      form.reset();
      onOpenChange(false);
    } catch {
      /* error surfaced by parent (toast) */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add faculty record</DialogTitle>
          <DialogDescription>
            Link an existing user account to a department. The user must already exist and must not
            already have a faculty profile.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID (UUID)</FormLabel>
                  <FormControl>
                    <Input placeholder="Existing user UUID" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee ID</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="joiningDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Joining date (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().slice(0, 10)
                          : field.value
                            ? String(field.value).slice(0, 10)
                            : ""
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        field.onChange(v ? new Date(v + "T12:00:00") : undefined);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
