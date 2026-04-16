"use client";

import { useState } from "react";
import useSWR from "swr";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DepartmentRow {
  id: number;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminDepartmentsPage() {
  const limit = 10;
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const { data, isLoading } = useSWR("/api/admin/course-schema/departments", fetcher);

  const departmentsAll: DepartmentRow[] = data?.data?.departments || [];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredDepartments = departmentsAll.filter(
    (department) =>
      !normalizedQuery ||
      department.name.toLowerCase().includes(normalizedQuery) ||
      department.code.toLowerCase().includes(normalizedQuery),
  );
  const total = filteredDepartments.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const departments = filteredDepartments.slice(start, start + limit);
  const visibleIds = departments.map((d) => d.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  function toggleAllVisible(checked: boolean) {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
  }

  function toggleRow(id: number, checked: boolean) {
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, id])) : prev.filter((v) => v !== id)));
  }

  function downloadCsv(filename: string, rows: string[][]) {
    const csv = rows
      .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportDepartments(all: boolean) {
    const source = all ? filteredDepartments : filteredDepartments.filter((d) => selectedIds.includes(d.id));
    if (!source.length) {
      toast.error(all ? "No departments to export" : "Select at least one row");
      return;
    }
    const rows = [
      ["ID", "Code", "Name", "Created At", "Updated At"],
      ...source.map((d) => [String(d.id), d.code, d.name, d.createdAt, d.updatedAt]),
    ];
    downloadCsv("departments.csv", rows);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted-foreground">Read-only departments from course schema</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => exportDepartments(true)} disabled={filteredDepartments.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV (All)
          </Button>
          <Button variant="outline" onClick={() => exportDepartments(false)} disabled={selectedIds.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV (Selected)
          </Button>
        </div>
      </div>

      <input
        value={query}
        onChange={(e) => {
          setPage(1);
          setQuery(e.target.value);
        }}
        placeholder="Search department name or code..."
        className="h-9 w-full rounded-md border bg-background px-3 text-sm sm:max-w-sm"
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Department List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : departments.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No departments found.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={(value) => toggleAllVisible(Boolean(value))}
                        aria-label="Select all department rows"
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(department.id)}
                          onCheckedChange={(value) => toggleRow(department.id, Boolean(value))}
                          aria-label={`Select ${department.name}`}
                        />
                      </TableCell>
                      <TableCell>{department.id}</TableCell>
                      <TableCell>{department.code}</TableCell>
                      <TableCell className="font-medium">{department.name}</TableCell>
                      <TableCell>{new Date(department.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(department.updatedAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!isLoading && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {safePage} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
