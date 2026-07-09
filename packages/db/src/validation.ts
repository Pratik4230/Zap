export const SLUG_MIN_LENGTH = 2;
export const SLUG_MAX_LENGTH = 50;
export const TITLE_MAX_LENGTH = 100;
export const NAME_MAX_LENGTH = 100;
export const DESTINATION_MAX_LENGTH = 2048;
export const MAX_CLICK_LIMIT = 1_000_000;
export const MAX_EXPIRY_YEARS = 10;

const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]*[a-z0-9]$|^[a-z0-9]$/;
const BLOCKED_PROTOCOLS = ["javascript:", "data:", "file:", "vbscript:", "blob:"];

export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

function fail(error: string): ValidationResult {
  return { ok: false, error };
}

export function validateDestinationUrl(input: unknown): ValidationResult {
  if (typeof input !== "string") return fail("destinationUrl must be a string");
  const trimmed = input.trim();
  if (!trimmed) return fail("destinationUrl is required");
  if (trimmed.length > DESTINATION_MAX_LENGTH) {
    return fail(`URL must be under ${DESTINATION_MAX_LENGTH} characters`);
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return fail("Invalid destination URL");
  }

  const protocol = parsed.protocol.toLowerCase();
  if (BLOCKED_PROTOCOLS.includes(protocol)) {
    return fail("URL protocol is not allowed");
  }
  if (protocol !== "https:" && protocol !== "http:") {
    return fail("URL must use http or https");
  }
  if (!parsed.hostname) {
    return fail("Invalid destination URL");
  }

  return { ok: true, value: trimmed };
}

/** Stricter check used before issuing redirects */
export function assertSafeRedirectUrl(url: string): boolean {
  const result = validateDestinationUrl(url);
  if (!result.ok) return false;
  try {
    const parsed = new URL(result.value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function validateSlug(input: unknown): ValidationResult {
  if (typeof input !== "string") return fail("slug must be a string");
  const slug = input.trim().toLowerCase();
  if (slug.length < SLUG_MIN_LENGTH) {
    return fail(`Slug must be at least ${SLUG_MIN_LENGTH} characters`);
  }
  if (slug.length > SLUG_MAX_LENGTH) {
    return fail(`Slug must be under ${SLUG_MAX_LENGTH} characters`);
  }
  if (!SLUG_PATTERN.test(slug)) {
    return fail("Slug can only contain lowercase letters, numbers, hyphens, and underscores");
  }
  return { ok: true, value: slug };
}

export function validateTitle(input: unknown): ValidationResult {
  if (input === null || input === undefined || input === "") {
    return { ok: true, value: "" };
  }
  if (typeof input !== "string") return fail("title must be a string");
  const title = input.trim();
  if (title.length > TITLE_MAX_LENGTH) {
    return fail(`Title must be under ${TITLE_MAX_LENGTH} characters`);
  }
  return { ok: true, value: title };
}

export function validateProfileName(input: unknown): ValidationResult {
  if (typeof input !== "string") return fail("name must be a string");
  const name = input.trim();
  if (!name) return fail("Name is required");
  if (name.length > NAME_MAX_LENGTH) {
    return fail(`Name must be under ${NAME_MAX_LENGTH} characters`);
  }
  if (!/^[\p{L}\p{N}\s'.-]+$/u.test(name)) {
    return fail("Name contains invalid characters");
  }
  return { ok: true, value: name };
}

export function validateLinkStatus(
  input: unknown
): { ok: true; value: "active" | "paused" } | { ok: false; error: string } {
  if (input !== "active" && input !== "paused") {
    return { ok: false, error: "Invalid status" };
  }
  return { ok: true, value: input };
}

/** Safe slug path for redirect lookups (includes auto-generated slugs) */
export function isValidSlugPath(slug: string): boolean {
  if (!slug || slug.length > SLUG_MAX_LENGTH) return false;
  if (slug.includes("/") || slug.includes("\\") || slug.includes("..")) return false;
  return /^[a-zA-Z0-9_-]+$/.test(slug);
}

export function validateExpiresAt(
  input: unknown
): { ok: true; value: Date | null } | { ok: false; error: string } {
  if (input === null || input === undefined || input === "") {
    return { ok: true, value: null };
  }
  if (typeof input !== "string") {
    return { ok: false, error: "expiresAt must be a string" };
  }
  const trimmed = input.trim();
  if (!trimmed) return { ok: true, value: null };

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "Invalid expiry date" };
  }
  if (date <= new Date()) {
    return { ok: false, error: "Expiry must be in the future" };
  }
  const max = new Date();
  max.setFullYear(max.getFullYear() + MAX_EXPIRY_YEARS);
  if (date > max) {
    return { ok: false, error: `Expiry cannot be more than ${MAX_EXPIRY_YEARS} years ahead` };
  }
  return { ok: true, value: date };
}

export function validateClickLimit(
  input: unknown
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (input === null || input === undefined || input === "") {
    return { ok: true, value: null };
  }

  let value: number;
  if (typeof input === "number") {
    value = input;
  } else if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return { ok: true, value: null };
    if (!/^\d+$/.test(trimmed)) {
      return { ok: false, error: "Click limit must be a whole number" };
    }
    value = Number(trimmed);
  } else {
    return { ok: false, error: "clickLimit must be a number" };
  }

  if (!Number.isInteger(value) || value < 1) {
    return { ok: false, error: "Click limit must be at least 1" };
  }
  if (value > MAX_CLICK_LIMIT) {
    return { ok: false, error: `Click limit cannot exceed ${MAX_CLICK_LIMIT.toLocaleString()}` };
  }
  return { ok: true, value };
}

export function isLinkNotExpired(link: { expiresAt: Date | string | null }): boolean {
  if (!link.expiresAt) return true;
  const expiresAt = link.expiresAt instanceof Date ? link.expiresAt : new Date(link.expiresAt);
  return expiresAt > new Date();
}

export function isLinkWithinClickLimit(link: {
  clickCount: number;
  clickLimit: number | null;
}): boolean {
  if (link.clickLimit == null) return true;
  return link.clickCount < link.clickLimit;
}

export function isLinkRedirectAllowed(link: {
  status: string;
  expiresAt: Date | string | null;
  clickCount: number;
  clickLimit: number | null;
}): boolean {
  return (
    link.status === "active" &&
    isLinkNotExpired(link) &&
    isLinkWithinClickLimit(link)
  );
}
