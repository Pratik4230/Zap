import { Resend } from "resend";

const FROM = "Zap <noreply@aixpense.in>";


interface SendOtpEmailOptions {
  to: string;
  otp: string;
  type: "email-verification" | "forget-password";
}

export async function sendOtpEmail({ to, otp, type }: SendOtpEmailOptions) {
  const isVerification = type === "email-verification";

  const subject = isVerification
    ? "Verify your Zap account"
    : "Reset your Zap password";

  const heading = isVerification
    ? "Verify your email"
    : "Reset your password";

  const body = isVerification
    ? "Enter the code below to verify your email address."
    : "Enter the code below to reset your password.";

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
              <!-- Logo -->
              <tr>
                <td style="padding-bottom:32px;text-align:center;">
                  <span style="font-size:28px;">⚡</span>
                  <span style="font-size:20px;font-weight:600;color:#fafafa;margin-left:8px;vertical-align:middle;">Zap</span>
                </td>
              </tr>
              <!-- Card -->
              <tr>
                <td style="background:#18181b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 36px;">
                  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fafafa;">${heading}</h1>
                  <p style="margin:0 0 32px;font-size:14px;color:#a1a1aa;">${body}</p>

                  <!-- OTP -->
                  <div style="background:#09090b;border:1px solid rgba(251,191,36,0.25);border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
                    <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#fbbf24;">${otp}</span>
                  </div>

                  <p style="margin:0 0 8px;font-size:13px;color:#71717a;">This code expires in <strong style="color:#a1a1aa;">5 minutes</strong>.</p>
                  <p style="margin:0;font-size:13px;color:#71717a;">If you didn't request this, you can safely ignore this email.</p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding-top:24px;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#52525b;">© ${new Date().getFullYear()} Zap. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });
}
