// FILE: src/app/api/share/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type ShareTargetType = 'event' | 'userEvent' | 'article';
type SharePlatform = 'twitter' | 'facebook' | 'whatsapp' | 'linkedin' | 'copy' | 'embed';

const VALID_TYPES: ShareTargetType[] = ['event', 'userEvent', 'article'];
const VALID_PLATFORMS: SharePlatform[] = ['twitter', 'facebook', 'whatsapp', 'linkedin', 'copy', 'embed'];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const type = body?.type as ShareTargetType | undefined;
  const id = body?.id as string | undefined;
  const platform = body?.platform as SharePlatform | undefined;

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid or missing type' }, { status: 400 });
  }
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  if (!platform || !VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: 'Invalid or missing platform' }, { status: 400 });
  }

  // Read-modify-write on the JSON breakdown rather than an atomic DB-level
  // increment — Prisma has no built-in "increment this key inside a JSON
  // column" operation. This is share-tracking data for analytics/ranking,
  // not a security- or money-relevant counter, so the small race-condition
  // window is an acceptable tradeoff against schema complexity.
  try {
    const model = type === 'event' ? prisma.event : type === 'userEvent' ? prisma.userEvent : prisma.article;
    const current = await (model as any).findUnique({ where: { id }, select: { shareBreakdown: true } });
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const breakdown = (current.shareBreakdown as Record<string, number>) ?? {};
    breakdown[platform] = (breakdown[platform] ?? 0) + 1;
    const updated = await (model as any).update({
      where: { id },
      data: { shareCount: { increment: 1 }, shareBreakdown: breakdown },
      select: { shareCount: true },
    });
    return NextResponse.json({ shareCount: updated.shareCount });
  } catch {
    return NextResponse.json({ error: 'Could not record share' }, { status: 500 });
  }
}
