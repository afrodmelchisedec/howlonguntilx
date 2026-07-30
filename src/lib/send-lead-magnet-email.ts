// FILE: src/lib/send-lead-magnet-email.ts
import { resend } from '@/lib/resend';

type SendLeadMagnetEmailInput = {
  to: string;
  name: string;
  headline: string;
  fileUrl: string;
};

export async function sendLeadMagnetEmail({ to, name, headline, fileUrl }: SendLeadMagnetEmailInput) {
  const from = process.env.RESEND_FROM_EMAIL || 'How Long Until X <hello@howlonguntilx.com>';
  const firstName = name.trim().split(' ')[0] || 'there';

  const html = `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
    <p style="font-size: 13px; color: #6b6b6b; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 16px;">How Long Until X</p>
    <h1 style="font-size: 22px; margin: 0 0 16px;">Hey ${firstName}, here's your download 🎉</h1>
    <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
      Thanks for signing up! As promised, here's your copy of <strong>${headline}</strong>.
    </p>
    <a href="${fileUrl}"
       style="display:inline-block; background:#7c5cff; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:8px; font-weight:600; font-size:15px;">
      Download your file →
    </a>
    <p style="font-size: 13px; line-height: 1.6; color: #8a8a8a; margin: 28px 0 0;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${fileUrl}" style="color:#7c5cff;">${fileUrl}</a>
    </p>
    <hr style="border:none; border-top:1px solid #eee; margin: 32px 0;" />
    <p style="font-size: 12px; color: #a0a0a0; margin:0;">
      You're receiving this because you requested a download at howlonguntilx.com.
      We'll only email you about things worth knowing — no spam.
    </p>
  </div>`;

  return resend.emails.send({
    from,
    to,
    subject: `Your download: ${headline}`,
    html,
  });
}
