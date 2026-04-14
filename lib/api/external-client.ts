const PROGRAMS_API_URL =
  process.env.PROGRAMS_API_URL || "https://humber-programs.vercel.app";
const FACILITIES_API_URL =
  process.env.FACILITIES_API_URL || "https://humber-facilities.vercel.app";
const PROGRAMS_API_KEY = process.env.PROGRAMS_API_KEY;

export interface ExternalFetchOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ExternalApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchWithTimeout(
  url: string,
  options: ExternalFetchOptions = {},
): Promise<Response> {
  const { timeout = 10000, headers = {} } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchProgramsApi<T>(
  endpoint: string,
  options: ExternalFetchOptions = {},
): Promise<ExternalApiResponse<T>> {
  const url = `${PROGRAMS_API_URL}${endpoint}`;
  const headers: Record<string, string> = { ...options.headers };

  if (PROGRAMS_API_KEY) {
    headers["X-API-Key"] = PROGRAMS_API_KEY;
  }

  try {
    const response = await fetchWithTimeout(url, { ...options, headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData?.error || errorData?.message || `HTTP ${response.status}`;
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, error: "Request timeout" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function fetchFacilitiesApi<T>(
  endpoint: string,
  options: ExternalFetchOptions = {},
): Promise<ExternalApiResponse<T>> {
  const url = `${FACILITIES_API_URL}${endpoint}`;

  try {
    const response = await fetchWithTimeout(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData?.error || errorData?.message || `HTTP ${response.status}`;
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, error: "Request timeout" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export { PROGRAMS_API_URL, FACILITIES_API_URL };
