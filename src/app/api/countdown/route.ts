// FILE: src/app/api/countdown/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getEventBySlug } from '@/lib/events';
import { parseEventQuery } from '@/lib/parseEvent';
import { buildCountdownResponse } from '@/lib/countdown';
import { rateLimit } from '@/lib/rateLimit';
import { checkApiCredits, creditHeaders } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const eventParam = searchParams.get('event') ?? '';

  // Burst protection (per-minute), unchanged from before.
  const limited = await rateLimit(req);
  if (limited) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  // Monthly credit quota — Free tier by IP, or a paid tier via API key.
  const access = await checkApiCredits(req);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  let target: Date | null = null;
  let name = eventParam;

  const dbEvent = await getEventBySlug(eventParam.toLowerCase().replace(/\s+/g, '-'));
  if (dbEvent) {
    target = new Date(dbEvent.targetDate);
    name = dbEvent.name;
  } else {
    target = parseEventQuery(eventParam);
  }

  if (!target) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  return NextResponse.json(buildCountdownResponse(name, target), {
    headers: creditHeaders(access),
  });
}
