export const SLUG_MIN_LENGTH = 2;
export const SLUG_MAX_LENGTH = 50;
export const TITLE_MAX_LENGTH = 100;
export const NAME_MAX_LENGTH = 100;
export const DESTINATION_MAX_LENGTH = 2048;

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
