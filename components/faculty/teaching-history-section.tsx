"use client";

import { useMemo, useState } from "react";
import { BookOpenText, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FacultyTeachingHistoryEntry } from "@/lib/types/faculty";
import type {
  CreateTeachingHistoryInput,
  UpdateTeachingHistoryInput,
} from "@/lib/validations/faculty";

interface TeachingHistorySectionProps {
  items: FacultyTeachingHistoryEntry[];
  isLoading?: boolean;
  canEdit: boolean;
  isSubmitting?: boolean;
  onCreate: (data: CreateTeachingHistoryInput) => Promise<void>;
  onUpdate: (id: string, data: UpdateTeachingHistoryInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

interface HistoryFormState {
  institutionName: string;
  courseTitle: string;
  subjectArea: string;
  termLabel: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  studentCount: string;
  notes: string;
}

const EMPTY_FORM: HistoryFormState = {
  institutionName: "",
  courseTitle: "",
  subjectArea: "",
  termLabel: "",
  academicYear: "",
  startDate: "",
  endDate: "",
  studentCount: "",
  notes: "",
};

function toCreatePayload(state: HistoryFormState): CreateTeachingHistoryInput {
  return {
    institutionName: state.institutionName.trim(),
    courseTitle: state.courseTitle.trim(),
    subjectArea: state.subjectArea.trim() || null,
    termLabel: state.termLabel.trim() || null,
    academicYear: state.academicYear.trim() || null,
    startDate: state.startDate || null,
    endDate: state.endDate || null,
    studentCount: state.studentCount ? Number(state.studentCount) : null,
    notes: state.notes.trim() || null,
    isExternal: true,
  };
}

export function TeachingHistorySection({
  items,
  isLoading = false,
  canEdit,
  isSubmitting = false,
  onCreate,
  onUpdate,
  onDelete,
}: TeachingHistorySectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HistoryFormState>(EMPTY_FORM);

  const orderedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [items]
  );

  function startAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsAdding(true);
  }

  function startEdit(item: FacultyTeachingHistoryEntry) {
    setIsAdding(false);
    setEditingId(item.id);
    setForm({
      institutionName: item.institutionName,
      courseTitle: item.courseTitle,
      subjectArea: item.subjectArea ?? "",
      termLabel: item.termLabel ?? "",
      academicYear: item.academicYear ?? "",
      startDate: item.startDate ? item.startDate.slice(0, 10) : "",
      endDate: item.endDate ? item.endDate.slice(0, 10) : "",
      studentCount:
        item.studentCount !== null && item.studentCount !== undefined
          ? String(item.studentCount)
          : "",
      notes: item.notes ?? "",
    });
  }

  async function handleCreate() {
    await onCreate(toCreatePayload(form));
    setForm(EMPTY_FORM);
    setIsAdding(false);
  }

  async function handleUpdate() {
    if (!editingId) return;
    await onUpdate(editingId, toCreatePayload(form));
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleDelete(id: string) {
    await onDelete(id);
    if (editingId === id) {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <BookOpenText className="h-4 w-4" />
            Teaching History
          </h3>
          {canEdit && !isAdding && !editingId && (
            <Button size="sm" onClick={startAdd}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading teaching history...</p>
        ) : (
          <div className="space-y-3">
            {orderedItems.length === 0 && !isAdding && !editingId && (
              <p className="text-sm text-muted-foreground">
                No teaching history entries yet.
              </p>
            )}

            {orderedItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{item.courseTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.institutionName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[item.academicYear, item.termLabel]
                        .filter(Boolean)
                        .join(" - ") || "Details not specified"}
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(item)}
                        disabled={isSubmitting}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {canEdit && (isAdding || editingId) && (
          <div className="mt-4 rounded-lg border border-border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Institution name"
                value={form.institutionName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, institutionName: e.target.value }))
                }
              />
              <Input
                placeholder="Course title"
                value={form.courseTitle}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, courseTitle: e.target.value }))
                }
              />
              <Input
                placeholder="Subject area (optional)"
                value={form.subjectArea}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, subjectArea: e.target.value }))
                }
              />
              <Input
                placeholder="Academic year (optional)"
                value={form.academicYear}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, academicYear: e.target.value }))
                }
              />
              <Input
                placeholder="Term label (optional)"
                value={form.termLabel}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, termLabel: e.target.value }))
                }
              />
              <Input
                type="number"
                min={0}
                placeholder="Student count (optional)"
                value={form.studentCount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, studentCount: e.target.value }))
                }
              />
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
            <Textarea
              className="mt-3 min-h-[80px]"
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={
                  isSubmitting ||
                  !form.institutionName.trim() ||
                  !form.courseTitle.trim()
                }
              >
                {editingId ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
