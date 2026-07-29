const DEFAULT_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  readonly status?: number;
  readonly isTimeout: boolean;

  constructor(message: string, status?: number, isTimeout = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.isTimeout = isTimeout;
  }
}

export function isRetryableApiError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;
  if (error.isTimeout) return true;
  if (error.status == null) return true;
  if (error.status === 408 || error.status === 429 || error.status >= 500) return true;
  return false;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(
        "The server is taking too long to respond. It may be temporarily unavailable.",
        undefined,
        true
      );
    }

    throw new ApiError("Unable to reach the server. Check your connection and try again.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const response = await apiFetch(input, init, timeoutMs);

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    const fallback =
      response.status === 503
        ? "Service temporarily unavailable. Please try again shortly."
        : `Request failed (${response.status})`;
    throw new ApiError(data.error ?? fallback, response.status);
  }

  return response.json() as Promise<T>;
}
