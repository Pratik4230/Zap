import { rateLimitKv, type RateLimitResult } from "@xaply/db";
import { NextResponse } from "next/server";

/** 100 link creates per minute per user (generous for bulk creation, still blocks abuse) */
export const LINK_CREATE_LIMIT = { limit: 100, windowSeconds: 60 };

/** 60 link updates/deletes per minute per user */
export const LINK_MUTATE_LIMIT = { limit: 60, windowSeconds: 60 };

/** 120 read requests per minute per user */
export const API_READ_LIMIT = { limit: 120, windowSeconds: 60 };

export async function rateLimit(opts: {
  kv: KVNamespace;
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  return rateLimitKv(opts.kv, opts.key, opts.limit, opts.windowSeconds);
}

export function rateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }
  );
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
