import type { ClickEvent } from "@xaply/db";

export function buildClickEvent(
  linkId: string,
  request: Request<unknown, IncomingRequestCfProperties>
): ClickEvent {
  const ua = request.headers.get("User-Agent") ?? "";
  const cf = request.cf;

  return {
    linkId,
    timestamp: Date.now(),
    country: cf?.country as string | undefined,
    city: cf?.city as string | undefined,
    device: detectDevice(ua),
    os: detectOs(ua),
    browser: detectBrowser(ua),
    referrer: request.headers.get("Referer") ?? undefined,
  };
}

function detectDevice(ua: string): "mobile" | "desktop" | "tablet" {
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

function detectOs(ua: string): string | undefined {
  if (/iphone|ipad/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return undefined;
}

function detectBrowser(ua: string): string | undefined {
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  if (/firefox/i.test(ua)) return "Firefox";
  return undefined;
}
