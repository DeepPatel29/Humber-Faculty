"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useFacultyAdminDetail,
  useDepartmentOptions,
  useUpdateFacultyResource,
  useDeleteFacultyResource,
} from "@/hooks/use-faculty";
import {
  updateFacultyResourceSchema,
  type UpdateFacultyResourceInput,
} from "@/lib/validations/faculty";
import { FacultyStatus } from "@/lib/types/faculty";
import { Skeleton } from "@/components/ui/skeleton";

const statusOptions = [
  { value: FacultyStatus.ACTIVE, label: "Active" },
  { value: FacultyStatus.ON_LEAVE, label: "On leave" },
  { value: FacultyStatus.INACTIVE, label: "Inactive" },
];

export default function AdminFacultyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : null;

  const { data: row, isLoading, error } = useFacultyAdminDetail(id);
  const { data: departments = [] } = useDepartmentOptions();
  const { trigger: updateFaculty, isMutating: updating } = useUpdateFacultyResource();
  const { trigger: deleteFaculty, isMutating: deleting } = useDeleteFacultyResource();

  const form = useForm<UpdateFacultyResourceInput>({
    resolver: zodResolver(updateFacultyResourceSchema),
    values: row
      ? {
          departmentId: row.departmentId,
          employeeId: row.employeeId,
          designation: row.designation,
          status: row.status as UpdateFacultyResourceInput["status"],
        }
      : {
          departmentId: undefined,
          employeeId: undefined,
          designation: undefined,
          status: undefined,
        },
  });

  async function onSave(values: UpdateFacultyResourceInput) {
    if (!id) return;
    try {
      await updateFaculty({ id, data: values });
      toast.success("Faculty updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function onDelete() {
    if (!id) return;
    try {
      await deleteFaculty(id);
      toast.success("Faculty record deleted");
      router.push("/admin/faculty");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (!id) {
    return <p className="text-destructive">Invalid faculty id</p>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/faculty">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              {error instanceof Error ? error.message : "Failed to load faculty"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !row) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/faculty">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{row.user.name}</h1>
        <p className="text-muted-foreground">{row.user.email}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{row.user.role}</Badge>
          <Badge variant="secondary">{row.employeeId}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit faculty record</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 max-w-lg">
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Department" />
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">User ID:</span>{" "}
            <code className="rounded bg-muted px-1">{row.userId}</code>
          </p>
          <p>
            <span className="font-medium text-foreground">Joined:</span>{" "}
            {new Date(row.joiningDate).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      {row.preferredSubjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferred subjects</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {row.preferredSubjects.map((p) => (
              <Badge key={p.id} variant="outline">
                {p.subjectName}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Separator />

      <div>
        <h3 className="mb-2 text-sm font-semibold text-destructive">Danger zone</h3>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete faculty record
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this faculty record?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the faculty row and cascades related faculty data per database rules.
                The user account itself is not deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(e) => {
                  e.preventDefault();
                  void onDelete();
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
