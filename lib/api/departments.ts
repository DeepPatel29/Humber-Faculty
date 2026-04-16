import { fetchProgramsApi } from "./external-client";
import type {
  ExternalDepartment,
  ExternalProgram,
  DepartmentOption,
} from "@/lib/types/external";

export async function getDepartments(): Promise<{
  success: boolean;
  data?: ExternalDepartment[];
  error?: string;
}> {
  const response =
    await fetchProgramsApi<ExternalDepartment[]>("/api/departments");

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data };
}

export async function getDepartmentById(
  id: number,
): Promise<{ success: boolean; data?: ExternalDepartment; error?: string }> {
  const response = await fetchProgramsApi<ExternalDepartment>(
    `/api/departments/${id}`,
  );

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data };
}

export async function getDepartmentOptions(): Promise<{
  success: boolean;
  data?: DepartmentOption[];
  error?: string;
}> {
  const response = await getDepartments();

  if (!response.success || !response.data) {
    return { success: false, error: response.error };
  }

  const options: DepartmentOption[] = response.data.map((dept) => ({
    id: String(dept.id),
    code: dept.code,
    name: dept.name,
  }));

  return { success: true, data: options };
}

export async function getPrograms(params?: {
  department_id?: number;
}): Promise<{ success: boolean; data?: ExternalProgram[]; error?: string }> {
  const queryParams = new URLSearchParams();
  if (params?.department_id) {
    queryParams.set("department_id", String(params.department_id));
  }

  const query = queryParams.toString();
  const endpoint = `/api/programs${query ? `?${query}` : ""}`;

  const response = await fetchProgramsApi<ExternalProgram[]>(endpoint);

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data };
}

export async function getProgramById(
  id: number,
): Promise<{ success: boolean; data?: ExternalProgram; error?: string }> {
  const response = await fetchProgramsApi<ExternalProgram>(
    `/api/programs/${id}`,
  );

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data };
}

export async function getProgramCurriculum(programId: number): Promise<{
  success: boolean;
  data?: {
    program: { id: number; name: string; code: string };
    semesters: Array<{
      id: number;
      semester_number: number;
      courses: Array<{ id: number; course_code: string; course_name: string }>;
      elective_groups: Array<{ id: number; name: string; min_select: number }>;
    }>;
  };
  error?: string;
}> {
  const response = await fetchProgramsApi<{
    program: { id: number; name: string; code: string };
    semesters: Array<{
      id: number;
      semester_number: number;
      courses: Array<{ id: number; course_code: string; course_name: string }>;
      elective_groups: Array<{ id: number; name: string; min_select: number }>;
    }>;
  }>(`/api/programs/${programId}/curriculum`);

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data };
}
