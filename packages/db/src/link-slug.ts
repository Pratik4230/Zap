/** Lowercase alphanumeric — URL-safe and matches `validateSlug`. */
export const GENERATED_LINK_SLUG_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

export const GENERATED_LINK_SLUG_MIN_LENGTH = 3;
export const GENERATED_LINK_SLUG_MAX_LENGTH = 8;
export const GENERATED_LINK_SLUG_MAX_ATTEMPTS = 8;

function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  const rejectAbove = 256 - (256 % maxExclusive);
  const bytes = new Uint8Array(1);
  for (;;) {
    crypto.getRandomValues(bytes);
    const byte = bytes[0]!;
    if (byte < rejectAbove) return byte % maxExclusive;
  }
}

function randomSlugOfLength(length: number): string {
  const alphabet = GENERATED_LINK_SLUG_ALPHABET;
  const alphabetLen = alphabet.length;
  const rejectAbove = 256 - (256 % alphabetLen);
  let slug = "";

  while (slug.length < length) {
    const bytes = new Uint8Array(length - slug.length);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte >= rejectAbove) continue;
      slug += alphabet[byte % alphabetLen];
      if (slug.length === length) break;
    }
  }

  return slug;
}

/** Auto slugs are 3–8 chars. Later retries prefer longer so collisions don’t stick on 3-char space. */
export function generateRandomLinkSlug(attempt = 0): string {
  const min = Math.min(
    GENERATED_LINK_SLUG_MAX_LENGTH,
    GENERATED_LINK_SLUG_MIN_LENGTH + Math.floor(attempt / 2)
  );
  const span = GENERATED_LINK_SLUG_MAX_LENGTH - min + 1;
  const length = min + randomInt(span);
  return randomSlugOfLength(length);
}

export function isUniqueConstraintError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.message} ${error.cause instanceof Error ? error.cause.message : ""}`
      : String(error);
  return /UNIQUE|unique constraint|SQLITE_CONSTRAINT/i.test(message);
}
