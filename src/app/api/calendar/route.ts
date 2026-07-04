import { NextRequest, NextResponse } from 'next/server';
import { getCalendarMonth } from '@/lib/calendar';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get('year'));
  const month = Number(searchParams.get('month'));

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 });
  }

  const events = getCalendarMonth(year, month);
  return NextResponse.json({ year, month, events });
}
