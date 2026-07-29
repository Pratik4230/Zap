import { sendResendEmail } from "./resend";

const FROM = "Xaply <noreply@aixpense.in>";

export interface SendDowntimeAlertEmailOptions {
  apiKey: string;
  to: string;
  service: string;
  details: string;
  appUrl: string;
}

export interface SendRecoveryAlertEmailOptions {
  apiKey: string;
  to: string;
  service: string;
  appUrl: string;
}

function alertShell(title: string, body: string, appUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;background:#09090b;">
        <tr>
          <td align="center" style="padding:48px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
              <tr>
                <td style="padding-bottom:32px;text-align:center;">
                  <span style="font-size:20px;font-weight:600;color:#fafafa;">Xaply</span>
                </td>
              </tr>
              <tr>
                <td style="background:#18181b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 36px;">
                  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fafafa;">${title}</h1>
                  <p style="margin:0 0 24px;font-size:14px;color:#a1a1aa;line-height:1.6;">${body}</p>
                  <a href="${appUrl}/api/health" style="display:inline-block;background:#fbbf24;color:#000;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;">
                    Check health endpoint
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding-top:24px;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#52525b;">© ${new Date().getFullYear()} Xaply · Admin alert</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function sendDowntimeAlertEmail({
  apiKey,
  to,
  service,
  details,
  appUrl,
}: SendDowntimeAlertEmailOptions): Promise<void> {
  const title = `${service} is down`;
  const body = `A health check detected an issue with <strong style="color:#fafafa;">${service}</strong>.<br/><br/>${details}`;

  await sendResendEmail({
    apiKey,
    from: FROM,
    to,
    subject: `[Xaply Alert] ${service} is down`,
    html: alertShell(title, body, appUrl),
  });
}

export async function sendRecoveryAlertEmail({
  apiKey,
  to,
  service,
  appUrl,
}: SendRecoveryAlertEmailOptions): Promise<void> {
  const title = `${service} recovered`;
  const body = `<strong style="color:#fafafa;">${service}</strong> is healthy again. No action needed.`;

  await sendResendEmail({
    apiKey,
    from: FROM,
    to,
    subject: `[Xaply Alert] ${service} recovered`,
    html: alertShell(title, body, appUrl),
  });
}
