// FILE: src/app/api/admin/seo/runs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { runDiscovery } from '@/lib/seoPipelineCore';

// Same shared-secret-or-session pattern as events/import/route.ts, kept
// local here rather than imported so this route has no coupling to that
// file's internals. If you introduce a shared `isAdminOrPipeline(req)`
// helper later, both routes can switch to it.
async function isAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (token && process.env.SEO_PIPELINE_TOKEN && token === process.env.SEO_PIPELINE_TOKEN) {
    return { user: { role: 'ADMIN', id: 'seo-pipeline' } };
  }
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

// Hard ceiling independent of whatever the client sends — protects against
// an accidental huge SERP bill from a malformed request, and keeps a
// dashboard-triggered run inside a typical serverless function's time
// budget. Raise only after moving this to a background/queued job.
const MAX_SERP_CALLS_CEILING = 30;

export async function GET(req: NextRequest) {
  const session = await isAdmin(req);
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const runs = await prisma.seoRun.findMany({
    orderBy: { startedAt: 'desc' },
    take: 20,
    include: {
      opportunities: {
        orderBy: { opportunityScore: 'desc' },
      },
    },
  });

  return NextResponse.json({ runs });
}

export async function POST(req: NextRequest) {
  const session = await isAdmin(req);
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: {
    seed?: string;
    country?: string;
    language?: string;
    minVolume?: number;
    maxKd?: number;
    maxSerpCalls?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!body.seed || !body.seed.trim()) {
    return NextResponse.json({ error: 'Missing required field: seed' }, { status: 400 });
  }

  const config = {
    seed: body.seed.trim(),
    country: body.country?.trim() || 'United States',
    language: body.language?.trim() || 'English',
    minVolume: body.minVolume ?? 300,
    maxKd: body.maxKd ?? 30,
    maxSerpCalls: Math.min(body.maxSerpCalls ?? 20, MAX_SERP_CALLS_CEILING),
  };

  const run = await prisma.seoRun.create({
    data: {
      seed: config.seed,
      country: config.country,
      language: config.language,
      minVolume: config.minVolume,
      maxKd: config.maxKd,
      status: 'running',
      triggeredBy: 'dashboard',
    },
  });

  try {
    const rows = await runDiscovery(config);

    if (rows.length > 0) {
      await prisma.seoOpportunity.createMany({
        data: rows.map(r => ({
          runId: run.id,
          keyword: r.keyword,
          volume: r.volume,
          kd: r.kd,
          trend: r.trend,
          opportunityScore: r.opportunityScore,
          template: r.template,
          entity: r.entity,
          clusterKey: r.clusterKey || null,
        })),
        skipDuplicates: true,
      });
    }

    const finished = await prisma.seoRun.update({
      where: { id: run.id },
      data: { status: 'completed', finishedAt: new Date() },
      include: { opportunities: { orderBy: { opportunityScore: 'desc' } } },
    });

    return NextResponse.json({ run: finished });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await prisma.seoRun.update({
      where: { id: run.id },
      data: { status: 'failed', finishedAt: new Date(), errorMessage: message },
    });
    return NextResponse.json({ error: message, runId: run.id }, { status: 500 });
  }
}
