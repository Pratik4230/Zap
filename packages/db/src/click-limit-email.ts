import { APP_URL } from "./constants";
import { sendResendEmail } from "./resend";

const FROM = "Xaply <noreply@aixpense.in>";

export interface SendMonthlyClickLimitEmailOptions {
  apiKey: string;
  to: string;
  limit: number;
  appUrl?: string;
}

export async function sendMonthlyClickLimitEmail({
  apiKey,
  to,
  limit,
  appUrl = APP_URL,
}: SendMonthlyClickLimitEmailOptions): Promise<void> {
  const formattedLimit = limit.toLocaleString("en-US");
  const upgradeUrl = `${appUrl}/dashboard`;

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
                  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fafafa;">Monthly click limit reached</h1>
                  <p style="margin:0 0 24px;font-size:14px;color:#a1a1aa;line-height:1.6;">
                    Your free plan has reached <strong style="color:#fafafa;">${formattedLimit} link visits</strong> this month.
                    All of your short links are paused until next month or you upgrade to Pro.
                  </p>
                  <a href="${upgradeUrl}" style="display:inline-block;background:#fbbf24;color:#000;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;">
                    Upgrade to Pro
                  </a>
                  <p style="margin:24px 0 0;font-size:13px;color:#71717a;line-height:1.5;">
                    Your limit resets at the start of next month (UTC). Pro gives you a higher monthly allowance and longer click history.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding-top:24px;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#52525b;">© ${new Date().getFullYear()} Xaply</p>
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
    apiKey,
    from: FROM,
    to,
    subject: "Your Xaply links are paused: monthly limit reached",
    html,
  });
}
