/**
 * Normalized API errors for TanStack Query retries and UI messages.
 */
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
  if (error.status === 408 || error.status === 429 || error.status >= 500) {
    return true;
  }
  return false;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
