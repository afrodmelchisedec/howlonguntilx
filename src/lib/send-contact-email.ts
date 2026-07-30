// FILE: src/lib/send-contact-email.ts
import { resend } from '@/lib/resend';

// TODO: swap this to 'support@howlonguntilx.com' once Cloudflare Email Routing
// is set up to forward it to an inbox you actually check (same pattern as isxsafe.com).
const NOTIFY_TO = 'afrodmwine@gmail.com';

const CATEGORY_LABELS: Record<string, string> = {
  suggest_tool: 'Suggest a tool',
  report_bug: 'Report a bug',
  partnership: 'Partnerships',
  other: 'Something else',
};

type SendContactNotificationInput = {
  name: string;
  email: string;
  category: string;
  message: string;
};

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendContactNotification({ name, email, category, message }: SendContactNotificationInput) {
  const from = process.env.RESEND_FROM_EMAIL || 'How Long Until X <hello@howlonguntilx.com>';
  const categoryLabel = CATEGORY_LABELS[category] || 'Something else';
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');

  const html = `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
    <p style="font-size: 13px; color: #6b6b6b; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 16px;">New contact form message</p>
    <h1 style="font-size: 20px; margin: 0 0 20px;">${escapeHtml(categoryLabel)}</h1>
    <table style="width:100%; font-size: 14px; margin-bottom: 20px;">
      <tr><td style="color:#8a8a8a; padding: 4px 0; width: 70px;">From</td><td>${escapeHtml(name)}</td></tr>
      <tr><td style="color:#8a8a8a; padding: 4px 0;">Email</td><td><a href="mailto:${escapeHtml(email)}" style="color:#7c5cff;">${escapeHtml(email)}</a></td></tr>
    </table>
    <div style="background:#f7f7f8; border-radius: 8px; padding: 16px 18px; font-size: 15px; line-height: 1.6;">
      ${safeMessage}
    </div>
    <p style="font-size: 12px; color: #a0a0a0; margin: 24px 0 0;">
      Reply to this email to respond directly to ${escapeHtml(name)}.
    </p>
  </div>`;

  return resend.emails.send({
    from,
    to: NOTIFY_TO,
    replyTo: email,
    subject: `[Contact] ${categoryLabel} — ${name}`,
    html,
  });
}

export async function sendContactConfirmation({ name, email }: { name: string; email: string }) {
  const from = process.env.RESEND_FROM_EMAIL || 'How Long Until X <hello@howlonguntilx.com>';
  const firstName = name.trim().split(' ')[0] || 'there';

  const html = `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
    <p style="font-size: 13px; color: #6b6b6b; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 16px;">How Long Until X</p>
    <h1 style="font-size: 20px; margin: 0 0 16px;">Thanks, ${firstName} — we got your message</h1>
    <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
      We read every message ourselves and typically reply within a couple of business days.
      No need to reply to this email — it's just a confirmation.
    </p>
    <hr style="border:none; border-top:1px solid #eee; margin: 32px 0;" />
    <p style="font-size: 12px; color: #a0a0a0; margin:0;">
      Sent from the contact form at howlonguntilx.com.
    </p>
  </div>`;

  return resend.emails.send({
    from,
    to: email,
    subject: "We got your message",
    html,
  });
}
