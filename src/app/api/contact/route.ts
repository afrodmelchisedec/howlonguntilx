// FILE: src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendContactNotification, sendContactConfirmation } from '@/lib/send-contact-email';

const VALID_CATEGORIES = ['suggest_tool', 'report_bug', 'partnership', 'other'];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const submissions = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip: string) {
  const now = Date.now();
  const timestamps = (submissions.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  submissions.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const { name, email, category, message, company, formRenderedAt } = body;

  if (typeof company === 'string' && company.trim().length > 0) {
    return NextResponse.json({ success: true });
  }

  if (typeof formRenderedAt === 'number' && Date.now() - formRenderedAt < 2000) {
    return NextResponse.json({ success: true });
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  }
  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Please select a topic.' }, { status: 400 });
  }
  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    return NextResponse.json({ error: 'Please write a bit more detail in your message.' }, { status: 400 });
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: 'Message is too long.' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many messages sent recently. Please try again later.' }, { status: 429 });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    await sendContactNotification({
      name: name.trim(),
      email: cleanEmail,
      category,
      message: message.trim(),
    });
  } catch (err) {
    console.error('Failed to send contact notification email:', err);
    return NextResponse.json(
      { error: "We couldn't send your message right now. Please email us directly at hello@howlonguntilx.com." },
      { status: 502 }
    );
  }

  sendContactConfirmation({ name: name.trim(), email: cleanEmail }).catch(err => {
    console.error('Failed to send contact confirmation email:', err);
  });

  return NextResponse.json({ success: true });
}
