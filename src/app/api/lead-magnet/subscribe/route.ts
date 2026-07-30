// FILE: src/app/api/lead-magnet/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendLeadMagnetEmail } from '@/lib/send-lead-magnet-email';

const VALID_REGIONS = ['AMERICAS', 'EUROPE', 'ASIA', 'AFRICA', 'MIDDLE_EAST', 'AUSTRALIA'];
const SINGLETON_ID = 'lead-magnet-config';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST — public sign-up for the sitewide lead magnet.
// Body: { name, email, region, source? }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const { name, email, region, source } = body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  }
  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });
  }
  if (!region || !VALID_REGIONS.includes(region)) {
    return NextResponse.json({ error: 'Please select your region.' }, { status: 400 });
  }

  const config = await prisma.leadMagnetConfig.findUnique({ where: { id: SINGLETON_ID } });
  if (!config || !config.active || !config.fileUrl) {
    return NextResponse.json({ error: 'This offer is not currently available.' }, { status: 404 });
  }

  const cleanEmail = email.toLowerCase().trim();
  const leadSource = source || 'global_banner';

  await prisma.leadMagnetSubscriber.upsert({
    where: { email_source: { email: cleanEmail, source: leadSource } },
    update: { name: name.trim(), region },
    create: { name: name.trim(), email: cleanEmail, region, source: leadSource },
  });

  try {
    await sendLeadMagnetEmail({
      to: cleanEmail,
      name,
      headline: config.headline,
      fileUrl: config.fileUrl,
    });
  } catch (err) {
    console.error('Failed to send lead magnet email:', err);
    return NextResponse.json(
      { error: "You're on the list, but we hit a snag sending the email. Please contact us." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
