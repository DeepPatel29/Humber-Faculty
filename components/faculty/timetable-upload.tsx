"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  File,
  FileSpreadsheet,
  FileText,
  X,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  TimetableFileType,
  ParsedTimetableEntry,
} from "@/lib/types/timetable-upload";

interface UploadResult {
  success: boolean;
  filename: string;
  fileType: TimetableFileType;
  entriesParsed: number;
  entriesCreated: number;
  entriesDeleted?: number;
  warnings: string[];
  errors: string[];
  requiresConfirmation?: boolean;
  preview?: ParsedTimetableEntry[];
  message?: string;
}

interface TimetableUploadProps {
  onUploadComplete?: () => void;
  className?: string;
}

const FILE_TYPE_ICONS: Record<TimetableFileType, typeof File> = {
  csv: FileText,
  xlsx: FileSpreadsheet,
  pdf: File,
};

const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

export function TimetableUpload({
  onUploadComplete,
  className,
}: TimetableUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        validateAndSetFile(selectedFile);
      }
    },
    [],
  );

  const validateAndSetFile = (file: File) => {
    const validTypes = [".csv", ".xlsx", ".pdf"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (!validTypes.includes(ext)) {
      toast.error("Invalid file type", {
        description: "Please upload a CSV, Excel, or PDF file",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Maximum file size is 5MB",
      });
      return;
    }

    setFile(file);
    setResult(null);
    setNeedsConfirm(false);
  };

  const uploadFile = async (confirm: boolean = false) => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (confirm) {
        formData.append("confirm", "true");
      }

      setUploadProgress(30);

      const response = await fetch("/api/faculty/timetable/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(70);

      const data: UploadResult = await response.json();

      setUploadProgress(100);

      if (!data.success) {
        toast.error("Upload failed", {
          description: data.errors?.join("; ") || "Failed to parse file",
        });
        setResult(data);
        return;
      }

      setResult(data);

      if (data.requiresConfirmation) {
        setNeedsConfirm(true);
        toast.info("File parsed successfully", {
          description: `Found ${data.entriesParsed} entries. Review and confirm to apply.`,
        });
      } else {
        setNeedsConfirm(false);
        toast.success("Timetable uploaded", {
          description: data.message || `Created ${data.entriesCreated} entries`,
        });
        toast.info("Administrators have been notified of your changes.");
        // Force page reload to ensure all data is fresh
        // This is more reliable than cache invalidation for immediate updates
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("facultyDataUpdated"));
        }
        onUploadComplete?.();
      }
    } catch (error) {
      toast.error("Upload failed", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmUpload = () => {
    uploadFile(true);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setNeedsConfirm(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const FileTypeIcon = file
    ? FILE_TYPE_ICONS[file.name.split(".").pop() as TimetableFileType] || File
    : File;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Timetable
        </CardTitle>
        <CardDescription>
          Upload your timetable as CSV, Excel, or PDF. This will replace your
          current schedule.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
            )}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              Drop your file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports CSV, XLSX, and PDF (max 5MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <FileTypeIcon className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              {!uploading && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {uploadProgress < 30
                    ? "Reading file..."
                    : uploadProgress < 70
                      ? "Parsing timetable..."
                      : uploadProgress < 100
                        ? "Processing..."
                        : "Complete!"}
                </p>
              </div>
            )}

            {result && !uploading && (
              <div className="space-y-3">
                {result.errors?.length > 0 && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                    {result.errors.map((error, i) => (
                      <p
                        key={i}
                        className="text-sm text-destructive flex items-start gap-2"
                      >
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        {error}
                      </p>
                    ))}
                  </div>
                )}

                {result.warnings?.length > 0 && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                      Warnings:
                    </p>
                    {result.warnings.slice(0, 5).map((warning, i) => (
                      <p
                        key={i}
                        className="text-xs text-amber-600 dark:text-amber-500"
                      >
                        {warning}
                      </p>
                    ))}
                    {result.warnings.length > 5 && (
                      <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                        +{result.warnings.length - 5} more warnings
                      </p>
                    )}
                  </div>
                )}

                {result.preview && result.preview.length > 0 && (
                  <div className="rounded-lg border overflow-hidden">
                    <div className="bg-muted/50 px-3 py-2 border-b">
                      <p className="text-xs font-medium">
                        Preview ({result.entriesParsed} entries)
                      </p>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/30 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium">
                              Day
                            </th>
                            <th className="px-3 py-2 text-left font-medium">
                              Time
                            </th>
                            <th className="px-3 py-2 text-left font-medium">
                              Course
                            </th>
                            <th className="px-3 py-2 text-left font-medium">
                              Room
                            </th>
                            <th className="px-3 py-2 text-left font-medium">
                              Type
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.preview.slice(0, 10).map((entry, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-3 py-2">
                                {DAY_SHORT[entry.dayOfWeek]}
                              </td>
                              <td className="px-3 py-2">
                                {entry.startTime} - {entry.endTime}
                              </td>
                              <td className="px-3 py-2 truncate max-w-[150px]">
                                {entry.courseCode || entry.courseName || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {entry.roomNumber || "TBA"}
                              </td>
                              <td className="px-3 py-2">
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {entry.type}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {result.preview.length > 10 && (
                        <p className="text-xs text-muted-foreground p-2 border-t">
                          +{result.preview.length - 10} more entries
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {needsConfirm ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleConfirmUpload}
                      className="flex-1"
                      disabled={uploading}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Confirm Upload
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : result.success && result.entriesCreated > 0 ? (
                  <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                    <Check className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {result.entriesCreated} entries imported successfully
                    </span>
                  </div>
                ) : null}
              </div>
            )}

            {!result && !uploading && (
              <Button onClick={() => uploadFile(false)} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Parse Timetable
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
