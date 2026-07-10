const UNLOCK_COOKIE = "xaply_unlock";
const UNLOCK_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

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

async function signUnlockToken(
  linkId: string,
  exp: number,
  secret: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const payload = new TextEncoder().encode(`${linkId}.${exp}`);
  const signature = await crypto.subtle.sign("HMAC", key, payload);
  return bytesToBase64url(new Uint8Array(signature));
}

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey || rest.length === 0) continue;
    out[rawKey] = decodeURIComponent(rest.join("="));
  }
  return out;
}

export async function createUnlockCookie(
  linkId: string,
  slug: string,
  secret: string,
  isSecure: boolean
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + UNLOCK_MAX_AGE_SECONDS;
  const sig = await signUnlockToken(linkId, exp, secret);
  const value = `${linkId}.${exp}.${sig}`;
  const secure = isSecure ? "; Secure" : "";
  return `${UNLOCK_COOKIE}=${encodeURIComponent(value)}; HttpOnly; Path=/${encodeURIComponent(slug)}; Max-Age=${UNLOCK_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export async function isUnlockCookieValid(
  request: Request,
  linkId: string,
  secret: string
): Promise<boolean> {
  const cookies = parseCookies(request.headers.get("Cookie"));
  const raw = cookies[UNLOCK_COOKIE];
  if (!raw) return false;

  const parts = raw.split(".");
  if (parts.length !== 3) return false;

  const cookieLinkId = parts[0]!;
  const exp = Number(parts[1]);
  const sig = parts[2]!;
  if (cookieLinkId !== linkId || !Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = await signUnlockToken(linkId, exp, secret);
  const sigBytes = base64urlToBytes(sig);
  const expectedBytes = base64urlToBytes(expected);
  if (!sigBytes || !expectedBytes) return false;
  return timingSafeEqual(sigBytes, expectedBytes);
}

export function renderPasswordPage(opts: {
  slug: string;
  title?: string | null;
  error?: string;
}): Response {
  const { slug, title, error } = opts;
  const heading = title ? `“${escapeHtml(title)}” is protected` : "This link is password protected";
  const errorHtml = error
    ? `<p class="error" role="alert">${escapeHtml(error)}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Password required · Xaply</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: system-ui, -apple-system, sans-serif;
      background: #0a0a0a;
      color: #f5f5f5;
      padding: 1.5rem;
    }
    .card {
      width: 100%;
      max-width: 24rem;
      background: #141414;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 1rem;
      padding: 1.5rem;
    }
    h1 { font-size: 1.125rem; margin: 0 0 0.5rem; }
    p { margin: 0 0 1rem; color: #a3a3a3; font-size: 0.875rem; line-height: 1.5; }
    label { display: block; font-size: 0.8125rem; margin-bottom: 0.375rem; color: #d4d4d4; }
    input[type="password"] {
      width: 100%;
      border: 1px solid rgba(255,255,255,0.12);
      background: #0a0a0a;
      color: #f5f5f5;
      border-radius: 0.5rem;
      padding: 0.625rem 0.75rem;
      font-size: 0.9375rem;
      margin-bottom: 1rem;
    }
    input[type="password"]:focus {
      outline: 2px solid rgba(245, 158, 11, 0.45);
      outline-offset: 1px;
    }
    button {
      width: 100%;
      border: 0;
      border-radius: 0.5rem;
      padding: 0.625rem 0.75rem;
      font-size: 0.9375rem;
      font-weight: 600;
      background: #f59e0b;
      color: #0a0a0a;
      cursor: pointer;
    }
    .error {
      margin: 0 0 1rem;
      padding: 0.625rem 0.75rem;
      border-radius: 0.5rem;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #fca5a5;
      font-size: 0.8125rem;
    }
    .slug {
      font-family: ui-monospace, monospace;
      color: #f59e0b;
      font-size: 0.8125rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <main class="card">
    <div class="slug">go.xaply.in/${escapeHtml(slug)}</div>
    <h1>${heading}</h1>
    <p>Enter the password to continue to the destination.</p>
    ${errorHtml}
    <form method="post" action="/${escapeHtml(slug)}">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required autofocus />
      <button type="submit">Continue</button>
    </form>
  </main>
</body>
</html>`;

  return new Response(html, {
    status: error ? 401 : 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
