import { APP_URL } from "./constants";
import { sendResendEmail } from "./resend";

const FROM = "Xaply <noreply@aixpense.in>";

export async function sendWorkspaceInviteEmail(options: {
  apiKey: string;
  to: string;
  workspaceName: string;
  inviterName: string;
  token: string;
  appUrl?: string;
}): Promise<void> {
  const appUrl = options.appUrl ?? APP_URL;
  const acceptUrl = `${appUrl}/invite/${options.token}`;

  const html = `
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
                  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fafafa;">You're invited</h1>
                  <p style="margin:0 0 24px;font-size:14px;color:#a1a1aa;line-height:1.6;">
                    <strong style="color:#fafafa;">${escapeHtml(options.inviterName)}</strong>
                    invited you to the
                    <strong style="color:#fafafa;">${escapeHtml(options.workspaceName)}</strong>
                    workspace on Xaply.
                  </p>
                  <a href="${acceptUrl}" style="display:inline-block;background:#fbbf24;color:#000;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;">
                    Accept invite
                  </a>
                  <p style="margin:24px 0 0;font-size:13px;color:#71717a;line-height:1.5;">
                    This invite expires in 7 days. Sign in with ${escapeHtml(options.to)} to join.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await sendResendEmail({
    apiKey: options.apiKey,
    from: FROM,
    to: options.to,
    subject: `Join ${options.workspaceName} on Xaply`,
    html,
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
