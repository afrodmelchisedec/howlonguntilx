// FILE: src/app/api/admin/seo/runs/[id]/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ExcelJS from 'exceljs';

async function isAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (token && process.env.SEO_PIPELINE_TOKEN && token === process.env.SEO_PIPELINE_TOKEN) {
    return { user: { role: 'ADMIN', id: 'seo-pipeline' } };
  }
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

// Same palette already used elsewhere in the admin panel (STAT_COLORS in
// AdminClient.tsx) and in the panel's own STATUS_COLORS — kept in sync by
// hand since this file can't import a 'use client' component's constants.
const STATUS_FILL: Record<string, string> = {
  DISCOVERED: 'FF94A3B8',
  REVIEWED: 'FF378ADD',
  APPROVED: 'FF1D9E75',
  REJECTED: 'FFD85A30',
  PUBLISHED: 'FF639922',
};

function scoreColor(score: number): string {
  if (score >= 80) return 'FF1D9E75';
  if (score >= 60) return 'FFBA7517';
  return 'FF94A3B8';
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await isAdmin(req);
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const run = await prisma.seoRun.findUnique({
    where: { id: params.id },
    include: { opportunities: { orderBy: { opportunityScore: 'desc' } } },
  });
  if (!run) {
    return NextResponse.json({ error: `No SeoRun found with id "${params.id}"` }, { status: 404 });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'HowLongUntilX SEO Pipeline';
  const ws = wb.addWorksheet('SEO Opportunities');

  ws.columns = [
    { header: 'Keyword', key: 'keyword', width: 45 },
    { header: 'Volume', key: 'volume', width: 12 },
    { header: 'KD', key: 'kd', width: 8 },
    { header: 'Trend', key: 'trend', width: 10 },
    { header: 'Score', key: 'score', width: 10 },
    { header: 'Template', key: 'template', width: 18 },
    { header: 'Entity', key: 'entity', width: 20 },
    { header: 'Cluster', key: 'cluster', width: 10 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Event Slug', key: 'eventSlug', width: 24 },
    { header: 'Review Notes', key: 'reviewNotes', width: 30 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
  });
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  // Sort so keywords in the same SERP-overlap cluster sit together, primary
  // (highest score) first within each cluster — mirrors the grouped view
  // in the dashboard panel.
  const byCluster = new Map<string, typeof run.opportunities>();
  for (const o of run.opportunities) {
    const key = o.clusterKey ?? `__none__${o.id}`;
    if (!byCluster.has(key)) byCluster.set(key, []);
    byCluster.get(key)!.push(o);
  }
  const clusterOrder = [...byCluster.entries()].sort(
    (a, b) => Math.max(...b[1].map(o => o.opportunityScore)) - Math.max(...a[1].map(o => o.opportunityScore))
  );

  for (const [, items] of clusterOrder) {
    items.sort((a, b) => b.opportunityScore - a.opportunityScore);
    for (const o of items) {
      const row = ws.addRow({
        keyword: o.keyword,
        volume: o.volume,
        kd: o.kd ?? '',
        trend: o.trend ?? '',
        score: o.opportunityScore,
        template: o.template ?? '',
        entity: o.entity ?? '',
        cluster: o.clusterKey ?? '',
        status: o.status,
        eventSlug: o.eventSlug ?? '',
        reviewNotes: o.reviewNotes ?? '',
      });
      const statusCell = row.getCell('status');
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STATUS_FILL[o.status] ?? 'FF94A3B8' } };
      statusCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      row.getCell('score').font = { color: { argb: scoreColor(o.opportunityScore) }, bold: true };
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `seo-opportunities-${run.seed.replace(/[^a-z0-9]+/gi, '-')}-${run.id.slice(0, 8)}.xlsx`;

  return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
