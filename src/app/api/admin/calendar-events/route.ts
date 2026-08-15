// FILE: src/app/api/admin/calendar-events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { listCalendarAdminEvents, createCalendarEvent } from '@/lib/calendar-admin';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

export async function GET() {
  const session = await isAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const events = listCalendarAdminEvents();
    return NextResponse.json({ events });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to load events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await isAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  try {
    const created = createCalendarEvent(body);
    revalidatePath('/');
    revalidatePath('/calendar');
    return NextResponse.json({ event: created });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Create failed' }, { status: 400 });
  }
}
