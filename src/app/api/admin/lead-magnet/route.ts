// FILE: src/app/api/admin/lead-magnet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const SINGLETON_ID = 'lead-magnet-config';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

// GET — current config (auto-creates a default row on first load) + subscriber count.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const config = await prisma.leadMagnetConfig.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });

  const subscriberCount = await prisma.leadMagnetSubscriber.count();

  return NextResponse.json({ config, subscriberCount });
}

// PATCH — update the sitewide lead magnet banner.
// Body: { headline, description, ctaLabel?, fileUrl, active? }
export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  if (!body.headline || !body.description || !body.fileUrl) {
    return NextResponse.json({ error: 'headline, description, and fileUrl are required' }, { status: 400 });
  }

  const data = {
    headline: body.headline,
    description: body.description,
    ctaLabel: body.ctaLabel || 'Send me the calendar',
    fileUrl: body.fileUrl,
    active: typeof body.active === 'boolean' ? body.active : true,
  };

  const config = await prisma.leadMagnetConfig.upsert({
    where: { id: SINGLETON_ID },
    update: data,
    create: { id: SINGLETON_ID, ...data },
  });

  // Sitewide banner — every page needs the fresh copy, not just one section.
  revalidatePath('/', 'layout');
  revalidatePath('/admin');
  return NextResponse.json(config);
}
