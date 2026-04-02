import { NextResponse } from "next/server";
import { ZodError } from "zod";

// ============================================================================
// Response Types (strict Phase 1 shape)
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  error: null;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// Success Response Helpers
// ============================================================================

export function successResponse<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data, error: null }, { status });
}

export function createdResponse<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, 201);
}

// ============================================================================
// Error Response Helpers
// ============================================================================

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  const error: ApiErrorBody = { code, message };
  if (details !== undefined && Object.keys(details).length > 0) {
    error.details = details;
  }
  return NextResponse.json({ success: false, data: null, error }, { status });
}

export function badRequestResponse(
  message: string,
  details?: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  return errorResponse("BAD_REQUEST", message, 400, details);
}

export function unauthorizedResponse(message = "Unauthorized"): NextResponse<ApiErrorResponse> {
  return errorResponse("UNAUTHORIZED", message, 401);
}

export function forbiddenResponse(message = "Forbidden"): NextResponse<ApiErrorResponse> {
  return errorResponse("FORBIDDEN", message, 403);
}

export function notFoundResponse(resource = "Resource"): NextResponse<ApiErrorResponse> {
  return errorResponse("NOT_FOUND", `${resource} not found`, 404);
}

export function conflictResponse(message: string): NextResponse<ApiErrorResponse> {
  return errorResponse("CONFLICT", message, 409);
}

export function internalErrorResponse(message = "Internal server error"): NextResponse<ApiErrorResponse> {
  return errorResponse("INTERNAL_ERROR", message, 500);
}

export function serviceUnavailableResponse(
  message = "Service unavailable"
): NextResponse<ApiErrorResponse> {
  return errorResponse("SERVICE_UNAVAILABLE", message, 503);
}

// ============================================================================
// Validation Error Helper
// ============================================================================

export function validationErrorResponse(error: ZodError): NextResponse<ApiErrorResponse> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(issue.message);
  }

  return badRequestResponse("Validation failed", details);
}

// ============================================================================
// Safe Parse Helper
// ============================================================================

export async function parseRequestBody<T>(
  request: Request,
  schema: { parse: (data: unknown) => T }
): Promise<{ success: true; data: T } | { success: false; response: NextResponse<ApiErrorResponse> }> {
  try {
    const body: unknown = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, response: validationErrorResponse(error) };
    }
    return { success: false, response: badRequestResponse("Invalid request body") };
  }
}

export function parseQueryParams<T>(
  searchParams: URLSearchParams,
  schema: { parse: (data: unknown) => T }
): { success: true; data: T } | { success: false; response: NextResponse<ApiErrorResponse> } {
  try {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, response: validationErrorResponse(error) };
    }
    return { success: false, response: badRequestResponse("Invalid query parameters") };
  }
}
