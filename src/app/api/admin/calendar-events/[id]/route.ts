// FILE: src/app/api/admin/calendar-events/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { updateCalendarEvent, deleteCalendarEvent } from '@/lib/calendar-admin';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await isAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  try {
    const id = decodeURIComponent(params.id);
    const updated = updateCalendarEvent(id, body);
    revalidatePath('/');
    revalidatePath('/calendar');
    return NextResponse.json({ event: updated });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Update failed' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await isAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const id = decodeURIComponent(params.id);
    deleteCalendarEvent(id);
    revalidatePath('/');
    revalidatePath('/calendar');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Delete failed' }, { status: 400 });
  }
}
