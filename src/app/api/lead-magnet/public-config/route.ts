// FILE: src/app/api/lead-magnet/public-config/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const SINGLETON_ID = 'lead-magnet-config';

// GET — public. Returns only display copy, never fileUrl (that's earned after signup).
export async function GET() {
  const config = await prisma.leadMagnetConfig.findUnique({ where: { id: SINGLETON_ID } });

  if (!config || !config.active) {
    return NextResponse.json({ config: null });
  }

  return NextResponse.json({
    config: {
      headline: config.headline,
      description: config.description,
      ctaLabel: config.ctaLabel,
      active: config.active,
    },
  });
}
