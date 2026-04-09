"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FacultyCreateDialog } from "@/components/admin/faculty-create-dialog";
import {
  useFacultyAdminList,
  useDepartmentOptions,
  useCreateFacultyResource,
} from "@/hooks/use-faculty";
import type { CreateFacultyResourceInput } from "@/lib/validations/faculty";
import { FacultyStatus } from "@/lib/types/faculty";

function statusLabel(s: string): string {
  switch (s) {
    case FacultyStatus.ACTIVE:
      return "Active";
    case FacultyStatus.ON_LEAVE:
      return "On leave";
    case FacultyStatus.INACTIVE:
      return "Inactive";
    default:
      return s;
  }
}

export default function AdminFacultyPage() {
  const [page, setPage] = useState(1);
  const limit = 15;
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, error, mutate } = useFacultyAdminList(page, limit);
  const { data: departments = [], isLoading: deptLoading } = useDepartmentOptions();
  const { trigger: createFaculty, isMutating: creating } = useCreateFacultyResource();

  const faculty = data?.faculty ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  async function handleCreate(values: CreateFacultyResourceInput) {
    try {
      await createFaculty(values);
      toast.success("Faculty record created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create faculty");
      throw e;
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Faculty</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              {error instanceof Error ? error.message : "Failed to load faculty list"}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => mutate()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Faculty</h1>
          <p className="text-muted-foreground">Directory and records (canonical CRUD)</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={deptLoading || departments.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Add faculty
        </Button>
      </div>

      {departments.length === 0 && !deptLoading && (
        <p className="text-sm text-amber-600 dark:text-amber-500">
          No departments available. Seed or create departments before adding faculty.
        </p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All faculty</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : faculty.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No faculty records yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faculty.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{f.user.email}</TableCell>
                      <TableCell className="font-mono text-sm">{f.employeeId}</TableCell>
                      <TableCell>{f.department.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{statusLabel(f.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="link" className="h-auto p-0" asChild>
                          <Link href={`/admin/faculty/${f.id}`}>View / edit</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <FacultyCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        departments={departments}
        onSubmit={handleCreate}
        isSubmitting={creating}
      />
    </div>
  );
}
