import { NextRequest, NextResponse } from 'next/server';
import { getEventBySlug } from '@/lib/events';
import { parseEventQuery } from '@/lib/parseEvent';
import { buildCountdownResponse } from '@/lib/countdown';
import { rateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const eventParam = searchParams.get('event') ?? '';

  const limited = await rateLimit(req);
  if (limited) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

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

  return NextResponse.json(buildCountdownResponse(name, target));
}
