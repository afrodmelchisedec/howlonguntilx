// FILE: src/app/api/admin/events/bulk-upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { upsertEventFromJson, EventUploadItem } from '@/lib/events-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key');
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { events?: EventUploadItem[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const events = body?.events;
  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: 'Body must be { events: [...] }' }, { status: 400 });
  }

  const results = await Promise.all(events.map(upsertEventFromJson));
  const created = results.filter(r => r.status === 'created').length;
  const updated = results.filter(r => r.status === 'updated').length;
  const errors  = results.filter(r => r.status === 'error');

  return NextResponse.json({ created, updated, errors, results });
}
