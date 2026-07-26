// FILE: src/app/api/admin/events/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { upsertEventFromJson, type EventUploadItem } from '@/lib/events-admin';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let items: EventUploadItem[];
  try {
    const body = await req.json();
    items = Array.isArray(body) ? body : body.items;
    if (!Array.isArray(items)) throw new Error('Payload must be an array of event items, or an object with an "items" array.');
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid JSON payload' }, { status: 400 });
  }

  const results = [];
  for (const item of items) {
    const result = await upsertEventFromJson(item);
    results.push(result);
  }

  revalidatePath('/admin');
  revalidatePath('/categories');
  revalidatePath('/sitemap.xml');

  const created = results.filter(r => r.status === 'created').length;
  const updated = results.filter(r => r.status === 'updated').length;
  const failed = results.filter(r => r.status === 'error');

  return NextResponse.json({ created, updated, failed, errors: failed });
}
