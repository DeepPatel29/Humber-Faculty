"use client";

import { useState } from "react";
import useSWR from "swr";
import { ChevronLeft, ChevronRight, Loader2, Download, Trash2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
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

interface AdminFacultyRow {
  id: string;
  userId: string;
  sharedDepartmentId: string | null;
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  role: string;
  joiningDate: string;
  department: string;
}

interface CourseOption {
  id: number;
  code: string;
  name: string;
}

interface RoomOption {
  id: string;
  roomNumber: string;
  building: string;
  buildingCode: string;
  label: string;
}

export default function AdminFacultyPage() {
  const limit = 10;
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assignFacultyId, setAssignFacultyId] = useState<string | null>(null);
  const [assignCourseId, setAssignCourseId] = useState("");
  const [assignDayOfWeek, setAssignDayOfWeek] = useState("MONDAY");
  const [assignStartTime, setAssignStartTime] = useState("");
  const [assignEndTime, setAssignEndTime] = useState("");
  const [assignRoomId, setAssignRoomId] = useState("");
  const [profileFaculty, setProfileFaculty] = useState<AdminFacultyRow | null>(null);
  const { data, isLoading, error, mutate } = useSWR("/api/admin/faculty", (url: string) => fetch(url).then((r) => r.json()));
  const { data: coursesData } = useSWR("/api/admin/course-schema/courses", (url: string) => fetch(url).then((r) => r.json()));
  const { data: roomsData } = useSWR("/api/external/rooms?options=true&limit=200", (url: string) => fetch(url).then((r) => r.json()));

  const facultyAll: AdminFacultyRow[] = data?.data?.faculty ?? [];
  const courses: CourseOption[] = coursesData?.data?.courses ?? [];
  const rooms: RoomOption[] = roomsData?.data ?? [];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredFaculty = facultyAll.filter((f) => {
    const matchesQuery =
      !normalizedQuery ||
      f.name.toLowerCase().includes(normalizedQuery) ||
      f.email.toLowerCase().includes(normalizedQuery) ||
      f.department.toLowerCase().includes(normalizedQuery);
    const matchesRole = roleFilter === "ALL" || f.role === roleFilter;
    return matchesQuery && matchesRole;
  });
  const total = filteredFaculty.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const faculty = filteredFaculty.slice(start, start + limit);
  const visibleIds = faculty.map((f) => f.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const roleOptions = Array.from(new Set(facultyAll.map((f) => f.role))).sort();

  function toggleAllVisible(checked: boolean) {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, id])) : prev.filter((v) => v !== id)));
  }

  function downloadCsv(filename: string, rows: string[][]) {
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
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

  function exportFaculty(all: boolean) {
    const source = all ? filteredFaculty : filteredFaculty.filter((f) => selectedIds.includes(f.id));
    if (!source.length) {
      toast.error(all ? "No faculty rows to export" : "Select at least one row");
      return;
    }
    const rows = [
      ["Name", "Email", "Employee ID", "Department", "Status", "Joining Date"],
      ...source.map((f) => [
        f.name,
        f.email,
        f.employeeId,
        f.department,
        f.role,
        new Date(f.joiningDate).toLocaleDateString(),
      ]),
    ];
    downloadCsv("faculty.csv", rows);
  }

  async function handleDeleteFaculty(facultyId: string) {
    const confirmed = window.confirm("Remove this faculty record?");
    if (!confirmed) return;
    const res = await fetch(`/api/admin/faculty/${facultyId}`, { method: "DELETE" });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
      toast.error(body?.error?.message || "Failed to remove faculty");
      return;
    }
    toast.success("Faculty removed");
    await mutate();
  }

  async function handleAssignCourse() {
    if (!assignFacultyId || !assignCourseId) {
      toast.error("Select a course");
      return;
    }
    const res = await fetch("/api/admin/course-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facultyId: assignFacultyId,
        courseId: Number(assignCourseId),
        dayOfWeek: assignDayOfWeek,
        startTime: assignStartTime || null,
        endTime: assignEndTime || null,
        roomId: assignRoomId || null,
        roomLabel:
          rooms.find((room) => room.id === assignRoomId)?.label || null,
        classType: "LECTURE",
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
      toast.error(body?.error?.message || "Failed to assign course");
      return;
    }
    toast.success("Course assignment request sent to faculty");
    setAssignCourseId("");
    setAssignStartTime("");
    setAssignEndTime("");
    setAssignRoomId("");
    setAssignFacultyId(null);
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
          <p className="text-muted-foreground">Directory and records</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => exportFaculty(true)} disabled={faculty.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV (All)
          </Button>
          <Button variant="outline" onClick={() => exportFaculty(false)} disabled={selectedIds.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV (Selected)
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={(e) => {
            setPage(1);
            setQuery(e.target.value);
          }}
          placeholder="Search name, email, department..."
          className="sm:max-w-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setPage(1);
            setRoleFilter(e.target.value);
          }}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="ALL">All roles</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

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
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={(value) => toggleAllVisible(Boolean(value))}
                        aria-label="Select all faculty rows"
                      />
                    </TableHead>
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
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(f.id)}
                          onCheckedChange={(value) => toggleRow(f.id, Boolean(value))}
                          aria-label={`Select ${f.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell className="text-muted-foreground">{f.email}</TableCell>
                      <TableCell className="font-mono text-sm">{f.employeeId}</TableCell>
                      <TableCell>{f.department}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{f.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setAssignFacultyId(f.id)}>
                            Assign Course
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setProfileFaculty(f)}>
                            View Profile
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteFaculty(f.id)}>
                            <Trash2 className="mr-1 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
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
                Page {safePage} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
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

      <Dialog open={Boolean(assignFacultyId)} onOpenChange={(open) => !open && setAssignFacultyId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Course to Faculty</DialogTitle>
          </DialogHeader>
          <Select value={assignCourseId} onValueChange={setAssignCourseId}>
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={String(course.id)}>
                  {course.code} - {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Select value={assignDayOfWeek} onValueChange={setAssignDayOfWeek}>
              <SelectTrigger>
                <SelectValue placeholder="Day of week" />
              </SelectTrigger>
              <SelectContent>
                {["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"].map((day) => (
                  <SelectItem key={day} value={day}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="time"
              value={assignStartTime}
              onChange={(e) => setAssignStartTime(e.target.value)}
            />
            <Input
              type="time"
              value={assignEndTime}
              onChange={(e) => setAssignEndTime(e.target.value)}
            />
          </div>
          <Select value={assignRoomId} onValueChange={setAssignRoomId}>
            <SelectTrigger>
              <SelectValue placeholder="Room (facilities schema)" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignFacultyId(null)}>
              Cancel
            </Button>
            <Button onClick={handleAssignCourse}>Send Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(profileFaculty)} onOpenChange={(open) => !open && setProfileFaculty(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Faculty Profile</DialogTitle>
          </DialogHeader>
          {profileFaculty && (
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {profileFaculty.name}</p>
              <p><span className="font-medium">Email:</span> {profileFaculty.email}</p>
              <p><span className="font-medium">Employee ID:</span> {profileFaculty.employeeId}</p>
              <p><span className="font-medium">Department:</span> {profileFaculty.department}</p>
              <p><span className="font-medium">Designation:</span> {profileFaculty.designation}</p>
              <p><span className="font-medium">Role:</span> {profileFaculty.role}</p>
              <p><span className="font-medium">Joining Date:</span> {new Date(profileFaculty.joiningDate).toLocaleDateString()}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileFaculty(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
