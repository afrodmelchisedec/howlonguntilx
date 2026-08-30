// FILE: src/app/api/admin/seo/voice/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function isAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (token && process.env.SEO_PIPELINE_TOKEN && token === process.env.SEO_PIPELINE_TOKEN) {
    return { user: { role: 'ADMIN', id: 'seo-pipeline' } };
  }
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

export async function GET(req: NextRequest) {
  const session = await isAdmin(req);
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const voice = await prisma.contentVoice.findFirst({
    where: { active: true },
    orderBy: { updatedAt: 'desc' },
  });

  if (!voice) {
    return NextResponse.json({ voice: null });
  }

  return NextResponse.json({
    voice: { name: voice.name, systemPrompt: voice.systemPrompt },
  });
}
