export const LINK_PASSWORD_MIN_LENGTH = 4;
export const LINK_PASSWORD_MAX_LENGTH = 128;
export const LINK_PASSWORD_PBKDF2_ITERATIONS = 100_000;

export type LinkPasswordValidationResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function validateLinkPassword(
  input: unknown,
  { required = false }: { required?: boolean } = {}
): LinkPasswordValidationResult {
  if (input === null || input === undefined || input === "") {
    if (required) return { ok: false, error: "Password is required" };
    return { ok: true, value: "" };
  }
  if (typeof input !== "string") return { ok: false, error: "Password must be a string" };

  const password = input;
  if (password.length < LINK_PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      error: `Password must be at least ${LINK_PASSWORD_MIN_LENGTH} characters`,
    };
  }
  if (password.length > LINK_PASSWORD_MAX_LENGTH) {
    return {
      ok: false,
      error: `Password must be under ${LINK_PASSWORD_MAX_LENGTH} characters`,
    };
  }
  return { ok: true, value: password };
}

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64urlToBytes(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (padded.length % 4)) % 4;
    const base64 = padded + "=".repeat(padLen);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function deriveLinkPasswordKey(
  password: string,
  salt: Uint8Array,
  iterations = LINK_PASSWORD_PBKDF2_ITERATIONS
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as Uint8Array<ArrayBuffer>,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

export async function hashLinkPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveLinkPasswordKey(password, salt);
  return `pbkdf2_sha256$${LINK_PASSWORD_PBKDF2_ITERATIONS}$${bytesToBase64url(salt)}$${bytesToBase64url(hash)}`;
}

export async function verifyLinkPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256") return false;

  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1) return false;

  const salt = base64urlToBytes(parts[2]!);
  const expected = base64urlToBytes(parts[3]!);
  if (!salt || !expected) return false;

  const derived = await deriveLinkPasswordKey(password, salt, iterations);
  return timingSafeEqual(derived, expected);
}

export function linkHasPassword(link: { passwordHash: string | null }): boolean {
  return Boolean(link.passwordHash);
}
