import { APP_URL } from "@xaply/db";

export function renderMonthlyClickLimitPage(): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Link unavailable | Xaply</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #09090b;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 24px;
    }
    .card {
      max-width: 420px;
      width: 100%;
      background: #18181b;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 32px 28px;
      text-align: center;
    }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 12px; }
    p { font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; }
    a {
      display: inline-block;
      background: #fbbf24;
      color: #000;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 20px;
      border-radius: 10px;
    }
    .muted { margin-top: 20px; font-size: 12px; color: #71717a; }
  </style>
</head>
<body>
  <div class="card">
    <h1>This link is temporarily unavailable</h1>
    <p>
      The account owner has reached their free plan limit of 5,000 link visits this month.
      Links will work again next month, or after upgrading to Pro.
    </p>
    <a href="${APP_URL}/dashboard">Go to Xaply</a>
    <p class="muted">If you own this link, check your email. We sent a notice with upgrade options.</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 410,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
