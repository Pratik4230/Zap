type LogLevel = "info" | "warn" | "error";

export interface LogEventPayload {
  event: string;
  level?: LogLevel;
  worker?: string;
  [key: string]: unknown;
}

/** Structured JSON log for Cloudflare Workers Logs indexing. */
export function logEvent(payload: LogEventPayload): void {
  const { level = "info", ...rest } = payload;
  const entry = {
    ...rest,
    level,
    ts: new Date().toISOString(),
  };
  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function logError(
  event: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  logEvent({
    event,
    level: "error",
    error:
      error instanceof Error
        ? { message: error.message, name: error.name, stack: error.stack }
        : String(error),
    ...context,
  });
}
