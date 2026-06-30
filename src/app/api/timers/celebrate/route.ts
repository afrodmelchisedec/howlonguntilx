import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createTransport } from 'nodemailer';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { timerName } = await req.json();
  const email = session.user.email;
  if (!email) return NextResponse.json({ ok: true }); // no email, skip silently

  // Only send if email provider configured
  const host = process.env.EMAIL_SERVER_HOST;
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;
  const from = process.env.EMAIL_FROM ?? 'noreply@howlonguntilx.com';
  if (!host || !user || !pass) return NextResponse.json({ ok: true });

  try {
    const transport = createTransport({
      host, port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
      secure: false, auth: { user, pass },
    });

    await transport.sendMail({
      to: email,
      from: 'HowLongUntil <' + from + '>',
      subject: '🎉 You reached your countdown: ' + timerName,
      html: `
        <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.1)">
          <div style="background:linear-gradient(135deg,#534AB7,#8B7CF8);padding:40px 32px;text-align:center">
            <div style="width:80px;height:80px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:40px">🎉</div>
            <h1 style="color:white;font-size:24px;font-weight:800;margin:0">You made it!</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">Milestone reached</p>
          </div>
          <div style="padding:32px">
            <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:16px;padding:20px;text-align:center;margin-bottom:24px">
              <div style="font-size:48px;margin-bottom:8px">✅</div>
              <p style="font-size:18px;font-weight:700;color:#166534;margin:0">"' + timerName + '"</p>
              <p style="font-size:13px;color:#4ade80;margin:6px 0 0">100% complete</p>
            </div>
            <p style="color:#374151;font-size:14px;line-height:1.6;margin-bottom:20px">
              Congratulations! You successfully tracked and reached your countdown for <strong>' + timerName + '</strong>.
              Every milestone you hit builds momentum — keep adding new goals!
            </p>
            <a href="' + (process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com') + '/dashboard"
              style="display:block;background:#534AB7;color:white;text-align:center;padding:14px 24px;border-radius:14px;text-decoration:none;font-weight:700;font-size:14px">
              Add your next countdown →
            </a>
          </div>
          <div style="padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center">
            <p style="color:#9ca3af;font-size:12px;margin:0">HowLongUntil · <a href="' + (process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com') + '" style="color:#534AB7">howlonguntilx.com</a></p>
          </div>
        </div>
      `,
    });
  } catch (e) {
    console.error('[celebrate email]', e);
  }

  return NextResponse.json({ ok: true });
}
