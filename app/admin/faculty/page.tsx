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

interface FacultyTimetableItem {
  id: string;
  courseCode: string;
  courseName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  section: string | null;
  program: string | null;
  semester: number | null;
  academicYear: string;
  assignmentStatus: string;
}

interface FacultyAvailabilityDay {
  id: string;
  dayOfWeek: string;
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
}

export default function AdminFacultyPage() {
  const limit = 10;
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assignFacultyId, setAssignFacultyId] = useState<string | null>(null);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignCourseId, setAssignCourseId] = useState("");
  const [assignTermLabel, setAssignTermLabel] = useState("");
  const [assignAcademicYear, setAssignAcademicYear] = useState("");
  const [assignSemester, setAssignSemester] = useState("");
  const [assignSection, setAssignSection] = useState("");
  const [assignProgram, setAssignProgram] = useState("");
  const [assignDayOfWeek, setAssignDayOfWeek] = useState("MONDAY");
  const [assignStartTime, setAssignStartTime] = useState("");
  const [assignEndTime, setAssignEndTime] = useState("");
  const [assignRoomId, setAssignRoomId] = useState("");
  const [profileFaculty, setProfileFaculty] = useState<AdminFacultyRow | null>(null);
  const { data, isLoading, error, mutate } = useSWR("/api/admin/faculty", (url: string) => fetch(url).then((r) => r.json()));
  const { data: coursesData } = useSWR("/api/admin/course-schema/courses", (url: string) => fetch(url).then((r) => r.json()));
  const { data: roomsData } = useSWR("/api/external/rooms?options=true&limit=200", (url: string) => fetch(url).then((r) => r.json()));
  const { data: timetableData, mutate: mutateTimetable } = useSWR(
    profileFaculty ? `/api/admin/faculty/${profileFaculty.id}/timetable` : null,
    (url: string) => fetch(url).then((r) => r.json()),
  );
  const { data: availabilityData } = useSWR(
    profileFaculty ? `/api/admin/faculty/${profileFaculty.id}/availability` : null,
    (url: string) => fetch(url).then((r) => r.json()),
  );

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
    const matchesRole =
      roleFilter === "ALL" ||
      (roleFilter === "FACULTY" ? f.role === "FACULTY" || f.role === "STAFF" : f.role === roleFilter);
    return matchesQuery && matchesRole;
  });
  const total = filteredFaculty.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const faculty = filteredFaculty.slice(start, start + limit);
  const visibleIds = faculty.map((f) => f.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const roleOptions = ["ADMIN", "FACULTY"] as const;
  const timetableItems: FacultyTimetableItem[] = timetableData?.data?.items ?? [];
  const availabilityDays: FacultyAvailabilityDay[] =
    availabilityData?.data?.availability?.days ?? [];

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
    if (!assignTitle.trim() || !assignTermLabel.trim() || !assignAcademicYear.trim()) {
      toast.error("Title, term, and academic year are required");
      return;
    }
    if (!assignStartTime || !assignEndTime) {
      toast.error("Start and end time are required");
      return;
    }
    const res = await fetch("/api/admin/course-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facultyId: assignFacultyId,
        requestTitle: assignTitle.trim(),
        courseId: Number(assignCourseId),
        termLabel: assignTermLabel.trim(),
        academicYear: assignAcademicYear.trim(),
        semester: assignSemester ? Number(assignSemester) : undefined,
        section: assignSection.trim() || undefined,
        program: assignProgram.trim() || undefined,
        dayOfWeek: assignDayOfWeek,
        startTime: assignStartTime,
        endTime: assignEndTime,
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
    setAssignTitle("");
    setAssignCourseId("");
    setAssignTermLabel("");
    setAssignAcademicYear("");
    setAssignSemester("");
    setAssignSection("");
    setAssignProgram("");
    setAssignStartTime("");
    setAssignEndTime("");
    setAssignRoomId("");
    setAssignFacultyId(null);
  }

  async function handleRemoveTimetableItem(scheduleId: string) {
    if (!profileFaculty) return;
    const confirmed = window.confirm("Remove this timetable entry?");
    if (!confirmed) return;
    const res = await fetch(
      `/api/admin/faculty/${profileFaculty.id}/timetable/${scheduleId}`,
      { method: "DELETE" },
    );
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
      toast.error(body?.error?.message || "Failed to remove timetable entry");
      return;
    }
    toast.success("Timetable entry removed");
    await mutateTimetable();
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Faculty</h1>
          <p className="text-muted-foreground">Directory and records</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="border-border bg-background hover:bg-primary/5" onClick={() => exportFaculty(true)} disabled={faculty.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV (All)
          </Button>
          <Button variant="outline" className="border-border bg-background hover:bg-primary/5" onClick={() => exportFaculty(false)} disabled={selectedIds.length === 0}>
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
          className="border-border bg-background sm:max-w-sm"
        />
        <Select
          value={roleFilter}
          onValueChange={(value) => {
            setPage(1);
            setRoleFilter(value);
          }}
        >
          <SelectTrigger className="w-full border-border bg-background sm:w-[180px]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            {roleOptions.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border bg-card">
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
            <div className="overflow-x-auto rounded-xl border border-border bg-muted/10">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
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
                    <TableRow key={f.id} className="hover:bg-primary/5">
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
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/15">
                          {f.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="border-border bg-background hover:bg-primary/5" onClick={() => setAssignFacultyId(f.id)}>
                            Assign Course
                          </Button>
                          <Button size="sm" variant="outline" className="border-border bg-background hover:bg-primary/5" onClick={() => setProfileFaculty(f)}>
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
                  className="border-border bg-background hover:bg-primary/5"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border bg-background hover:bg-primary/5"
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
          <Input
            value={assignTitle}
            onChange={(e) => setAssignTitle(e.target.value)}
            placeholder="Request title (e.g., Fall Timetable Assignment)"
          />
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
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              value={assignTermLabel}
              onChange={(e) => setAssignTermLabel(e.target.value)}
              placeholder="Term (e.g., Fall 2026)"
            />
            <Input
              value={assignAcademicYear}
              onChange={(e) => setAssignAcademicYear(e.target.value)}
              placeholder="Academic year (e.g., 2026-2027)"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Input
              type="number"
              min={1}
              max={12}
              value={assignSemester}
              onChange={(e) => setAssignSemester(e.target.value)}
              placeholder="Semester"
            />
            <Input
              value={assignSection}
              onChange={(e) => setAssignSection(e.target.value)}
              placeholder="Section (optional)"
            />
            <Input
              value={assignProgram}
              onChange={(e) => setAssignProgram(e.target.value)}
              placeholder="Program (optional)"
            />
          </div>
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
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden p-0">
          <DialogHeader>
            <DialogTitle className="border-b border-border px-6 py-4 text-lg">
              Faculty Profile Details
            </DialogTitle>
          </DialogHeader>
          {profileFaculty && (
            <div className="max-h-[calc(85vh-140px)] space-y-6 overflow-y-auto px-6 py-5 text-sm">
              <section className="rounded-lg border border-border bg-card p-4">
                <p className="mb-3 text-sm font-semibold">Basic Information</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium text-foreground">{profileFaculty.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground break-all">{profileFaculty.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Employee ID</p>
                    <p className="font-medium text-foreground">{profileFaculty.employeeId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium text-foreground">{profileFaculty.department}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Designation</p>
                    <p className="font-medium text-foreground">{profileFaculty.designation}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="font-medium text-foreground">{profileFaculty.role}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Joining Date</p>
                    <p className="font-medium text-foreground">
                      {new Date(profileFaculty.joiningDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card p-4">
                <p className="mb-3 text-sm font-semibold">Assigned Timetable</p>
                {timetableItems.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-center text-muted-foreground">
                    No active timetable entries for this faculty.
                  </p>
                ) : (
                  <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border border-border bg-background p-2">
                    {timetableItems.map((item) => (
                      <div key={item.id} className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {item.courseCode || "NO-CODE"} - {item.courseName}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {item.dayOfWeek} {item.startTime} - {item.endTime}
                            {item.section ? ` · Section ${item.section}` : ""}
                            {item.program ? ` · ${item.program}` : ""}
                            {item.semester ? ` · Sem ${item.semester}` : ""}
                            {item.academicYear ? ` · ${item.academicYear}` : ""}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="self-start"
                          onClick={() => handleRemoveTimetableItem(item.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-border bg-card p-4">
                <p className="mb-3 text-sm font-semibold">Availability (By Day)</p>
                {availabilityDays.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-center text-muted-foreground">
                    No availability set for this faculty yet.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {availabilityDays.map((day) => (
                      <div key={day.id} className="rounded-md border border-border bg-background p-3">
                        <p className="text-xs font-semibold tracking-wide text-foreground">{day.dayOfWeek}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {day.isAvailable
                            ? `${day.startTime || "N/A"} - ${day.endTime || "N/A"}`
                            : "Not available"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
          <DialogFooter className="border-t border-border px-6 py-4">
            <Button variant="outline" onClick={() => setProfileFaculty(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
