/**
 * Pluggable, dependency-free mailer.
 *
 * With RESEND_API_KEY set, mail is sent via the Resend HTTP API (plain fetch —
 * no SDK dependency). Without it, the message (including any links) is logged to
 * the server console so a single admin can still retrieve e.g. password-reset
 * links from the logs. Sending never throws: on any failure we return
 * `{ delivered: false }` so callers can proceed regardless.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<{ delivered: boolean }> {
  const from = process.env.EMAIL_FROM || 'HRMS <onboarding@resend.dev>';

  if (!isEmailConfigured()) {
    // No provider configured: log the full message so links are recoverable.
    console.warn(
      `[mailer] RESEND_API_KEY not set — email NOT delivered.\n` +
        `  From: ${from}\n` +
        `  To: ${to}\n` +
        `  Subject: ${subject}\n` +
        `  Text: ${text || '(none)'}\n` +
        `  HTML: ${html}`,
    );
    return { delivered: false };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[mailer] Resend send failed (${res.status}): ${detail}`);
      return { delivered: false };
    }

    return { delivered: true };
  } catch (err) {
    console.error('[mailer] Resend send threw — email not delivered:', err);
    return { delivered: false };
  }
}
