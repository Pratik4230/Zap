const RESEND_API_URL = "https://api.resend.com/emails";

export interface SendResendEmailOptions {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}

export async function sendResendEmail({
  apiKey,
  from,
  to,
  subject,
  html,
}: SendResendEmailOptions): Promise<void> {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }
}
