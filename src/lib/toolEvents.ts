// FILE: src/lib/toolEvents.ts
// Server-only — reads tech/tax tool events (tagged via content.kind) via Prisma.
// Never import this from a 'use client' file.
import { prisma } from './db';

export interface ToolEventDTO {
  slug: string;
  name: string;
  description: string | null;
  emoji: string | null;
  targetDate: string; // ISO
  content: any;
}

export async function getToolEvents(kind: 'tech' | 'tax'): Promise<ToolEventDTO[]> {
  const rows = await prisma.event.findMany({
    where: {
      isCalendar: true,
      published: true,
      content: { path: ['kind'], equals: kind },
    },
    orderBy: { targetDate: 'asc' },
  });
  return rows.map(r => ({
    slug: r.slug,
    name: r.name,
    description: r.description,
    emoji: r.emoji,
    targetDate: r.targetDate.toISOString(),
    content: r.content as any,
  }));
}
