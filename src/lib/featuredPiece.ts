// FILE: src/lib/featuredPiece.ts
import { prisma } from '@/lib/db';

function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function startOfIsoWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day + 1); // Monday
  return d;
}

export async function getWeeklyFeaturedPiece() {
  const now = new Date();
  const weekStart = startOfIsoWeek(now);

  // 1. Check for an explicit override pinned to this exact week
  const override = await prisma.featuredPiece.findFirst({
    where: { active: true, weekOf: weekStart },
  });
  if (override) return override;

  // 2. Fall back to the deterministic rotation pool (weekOf: null)
  const pool = await prisma.featuredPiece.findMany({
    where: { active: true, weekOf: null },
    orderBy: { createdAt: 'asc' },
  });
  if (pool.length === 0) return null;

  const idx = isoWeekNumber(now) % pool.length;
  return pool[idx];
}
