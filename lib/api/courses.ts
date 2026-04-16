import { fetchProgramsApi } from "./external-client";
import type { ExternalCourse, CourseOption } from "@/lib/types/external";

export interface CoursesListParams {
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
}

export async function getCourses(
  params?: CoursesListParams,
): Promise<{ success: boolean; data?: ExternalCourse[]; error?: string }> {
  const queryParams = new URLSearchParams();
  if (params?.status) {
    queryParams.set("status", params.status);
  }

  const query = queryParams.toString();
  const endpoint = `/api/courses${query ? `?${query}` : ""}`;

  const response = await fetchProgramsApi<ExternalCourse[]>(endpoint);

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data };
}

export async function getCourseById(
  id: number,
): Promise<{ success: boolean; data?: ExternalCourse; error?: string }> {
  const response = await fetchProgramsApi<ExternalCourse>(`/api/courses/${id}`);

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data };
}

export async function getCourseOptions(): Promise<{
  success: boolean;
  data?: CourseOption[];
  error?: string;
}> {
  const response = await getCourses({ status: "ACTIVE" });

  if (!response.success || !response.data) {
    return { success: false, error: response.error };
  }

  const options: CourseOption[] = response.data.map((course) => ({
    id: String(course.id),
    code: course.code,
    name: course.name,
    credits: course.credits,
    programId: course.program_id,
  }));

  return { success: true, data: options };
}

export async function searchCourses(
  query: string,
): Promise<{ success: boolean; data?: ExternalCourse[]; error?: string }> {
  const response = await getCourses({ status: "ACTIVE" });

  if (!response.success || !response.data) {
    return { success: false, error: response.error };
  }

  const lowerQuery = query.toLowerCase();
  const filtered = response.data.filter(
    (course) =>
      course.code.toLowerCase().includes(lowerQuery) ||
      course.name.toLowerCase().includes(lowerQuery),
  );

  return { success: true, data: filtered };
}
