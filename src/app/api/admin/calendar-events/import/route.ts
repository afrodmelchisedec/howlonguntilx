// FILE: src/app/api/admin/calendar-events/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { importCalendarEvents } from '@/lib/calendar-admin';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

export async function POST(req: NextRequest) {
  const session = await isAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let items: any;
  try {
    const body = await req.json();
    items = Array.isArray(body) ? body : body.items;
    if (!Array.isArray(items)) {
      throw new Error('Payload must be an array of event items, or an object with an "items" array.');
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid JSON payload' }, { status: 400 });
  }

  try {
    const result = importCalendarEvents(items);
    revalidatePath('/');
    revalidatePath('/calendar');
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Import failed' }, { status: 500 });
  }
}
