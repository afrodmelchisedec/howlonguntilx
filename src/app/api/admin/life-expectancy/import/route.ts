import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

const VALID_REGIONS = ['US', 'EUROPE', 'AFRICA', 'MIDDLE_EAST', 'CHINA', 'INDIA'];

interface ImportRow {
  region: string;
  countryLabel: string;
  sex: 'MALE' | 'FEMALE';
  age: number;
  remainingYears: number;
  source: string;
  sourceUrl?: string;
  sourceYear: number;
}

export async function POST(req: NextRequest) {
  const session = await isAdmin();
  if (!session) {
    console.warn('[life-expectancy/import] POST rejected — not an admin session');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let items: ImportRow[];
  try {
    const body = await req.json();
    items = Array.isArray(body) ? body : body.items;
    if (!Array.isArray(items)) throw new Error('Payload must be an array, or an object with an "items" array.');
  } catch (e) {
    console.error('[life-expectancy/import] POST bad payload:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid JSON payload' }, { status: 400 });
  }

  console.log(`[life-expectancy/import] POST received ${items.length} rows`);

  const results: { index: number; status: 'upserted' | 'error'; error?: string }[] = [];

  for (let i = 0; i < items.length; i++) {
    const row = items[i];
    if (!VALID_REGIONS.includes(row.region)) {
      results.push({ index: i, status: 'error', error: `region must be one of ${VALID_REGIONS.join(', ')}, got "${row.region}"` });
      continue;
    }
    if (row.sex !== 'MALE' && row.sex !== 'FEMALE') {
      results.push({ index: i, status: 'error', error: `sex must be MALE or FEMALE, got "${row.sex}"` });
      continue;
    }
    if (!Number.isFinite(row.age) || row.age < 0 || row.age > 110) {
      results.push({ index: i, status: 'error', error: `age must be 0–110, got "${row.age}"` });
      continue;
    }
    if (!Number.isFinite(row.remainingYears) || row.remainingYears < 0) {
      results.push({ index: i, status: 'error', error: `remainingYears must be a positive number, got "${row.remainingYears}"` });
      continue;
    }
    if (!row.source || !row.sourceYear) {
      results.push({ index: i, status: 'error', error: 'source and sourceYear are required for credibility display.' });
      continue;
    }

    try {
      await prisma.lifeExpectancyTable.upsert({
        where: { region_sex_age_sourceYear: { region: row.region, sex: row.sex, age: row.age, sourceYear: row.sourceYear } },
        create: {
          region: row.region, countryLabel: row.countryLabel, sex: row.sex, age: row.age,
          remainingYears: row.remainingYears, source: row.source, sourceUrl: row.sourceUrl, sourceYear: row.sourceYear,
        },
        update: {
          countryLabel: row.countryLabel, remainingYears: row.remainingYears,
          source: row.source, sourceUrl: row.sourceUrl,
        },
      });
      results.push({ index: i, status: 'upserted' });
    } catch (err) {
      results.push({ index: i, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  const upserted = results.filter(r => r.status === 'upserted').length;
  const failed = results.filter(r => r.status === 'error');
  console.log(`[life-expectancy/import] POST done — upserted=${upserted} failed=${failed.length} total=${items.length}`);
  if (failed.length) console.log('[life-expectancy/import] failures:', failed);

  return NextResponse.json(
    { upserted, failed, total: items.length },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}

export async function GET(req: NextRequest) {
  // Wrap entire handler in try/catch so we always return JSON and see the error
  try {
    const session = await isAdmin();
    if (!session) {
      console.warn('[life-expectancy/import] GET rejected — not an admin session');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = req.nextUrl.searchParams;
    console.log('[life-expectancy/import] GET query:', Object.fromEntries(params.entries()));
    const region = params.get('region');
    const sex = params.get('sex');
    const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(params.get('pageSize') ?? '25', 10) || 25));
    const sortField = params.get('sort') ?? 'region';
    const sortOrder: 'asc' | 'desc' = params.get('order') === 'desc' ? 'desc' : 'asc';
    const SORTABLE = ['region', 'sex', 'age', 'remainingYears', 'sourceYear', 'updatedAt'];
    const sort = SORTABLE.includes(sortField) ? sortField : 'region';

    const where: any = {};
    if (region) where.region = region;
    if (sex) where.sex = sex as 'MALE' | 'FEMALE';

    console.log('[life-expectancy/import] GET where clause:', where);

    const [total, rows, allForCoverage] = await Promise.all([
      prisma.lifeExpectancyTable.count({ where }),
      prisma.lifeExpectancyTable.findMany({
        where,
        orderBy: [{ [sort]: sortOrder }, { age: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.lifeExpectancyTable.findMany({
        select: { region: true, sex: true, sourceYear: true, published: true, updatedAt: true, source: true },
      }),
    ]);

    console.log('[life-expectancy/import] GET counts — total:', total, 'rows.length:', rows.length, 'allForCoverage:', allForCoverage.length);

    const coverage = VALID_REGIONS.map(r => {
      const male = allForCoverage.filter(x => x.region === r && x.sex === 'MALE' && x.published);
      const female = allForCoverage.filter(x => x.region === r && x.sex === 'FEMALE' && x.published);
      const allPublished = allForCoverage.filter(x => x.region === r && x.published);
      return {
        region: r,
        MALE: male.length,
        FEMALE: female.length,
        latestSourceYear: allPublished.reduce((max, x) => Math.max(max, x.sourceYear), 0) || null,
      };
    });

    const datasetMap = new Map<string, { region: string; sex: string; sourceYear: number; source: string; count: number; published: boolean; updatedAt: string }>();
    allForCoverage.forEach(r => {
      const key = `${r.region}__${r.sex}__${r.sourceYear}`;
      const existing = datasetMap.get(key);
      if (existing) {
        existing.count += 1;
        if (r.updatedAt.toISOString() > existing.updatedAt) existing.updatedAt = r.updatedAt.toISOString();
      } else {
        datasetMap.set(key, {
          region: r.region, sex: r.sex, sourceYear: r.sourceYear, source: r.source,
          count: 1, published: r.published, updatedAt: r.updatedAt.toISOString(),
        });
      }
    });
    const datasets = Array.from(datasetMap.values()).sort((a, b) =>
      a.region.localeCompare(b.region) || a.sex.localeCompare(b.sex) || b.sourceYear - a.sourceYear
    );

    return NextResponse.json(
      { rows, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)), coverage, datasets },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch (err) {
    console.error('[life-expectancy/import] GET ERROR:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown server error', stack: err instanceof Error ? err.stack : undefined },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await isAdmin();
  if (!session) {
    console.warn('[life-expectancy/import] PATCH rejected — not an admin session');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  if (body.id) {
    const { id, remainingYears, countryLabel, source, sourceUrl } = body;
    try {
      const data: any = {};
      if (remainingYears !== undefined) data.remainingYears = remainingYears;
      if (countryLabel !== undefined) data.countryLabel = countryLabel;
      if (source !== undefined) data.source = source;
      if (sourceUrl !== undefined) data.sourceUrl = sourceUrl;

      const updated = await prisma.lifeExpectancyTable.update({ where: { id }, data });
      console.log(`[life-expectancy/import] PATCH row edit — id=${id}`, data);
      return NextResponse.json({ row: updated });
    } catch (err) {
      console.error('[life-expectancy/import] PATCH row edit failed:', err);
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Update failed' }, { status: 500 });
    }
  }

  const { region, sex, sourceYear, published } = body;
  if (!region || !sex || !Number.isFinite(sourceYear) || typeof published !== 'boolean') {
    return NextResponse.json({ error: 'For a dataset toggle, provide region, sex, sourceYear, and published (boolean). For a row edit, provide id.' }, { status: 400 });
  }

  try {
    if (published) {
      await prisma.lifeExpectancyTable.updateMany({
        where: { region, sex, sourceYear: { not: sourceYear } },
        data: { published: false },
      });
    }
    const result = await prisma.lifeExpectancyTable.updateMany({
      where: { region, sex, sourceYear },
      data: { published },
    });
    console.log(`[life-expectancy/import] PATCH dataset toggle — ${region}/${sex}/${sourceYear} -> published=${published}, updatedCount=${result.count}`);
    return NextResponse.json({ updatedCount: result.count });
  } catch (err) {
    console.error('[life-expectancy/import] PATCH dataset toggle failed:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Toggle failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await isAdmin();
  if (!session) {
    console.warn('[life-expectancy/import] DELETE rejected — not an admin session');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id query param is required' }, { status: 400 });

  try {
    await prisma.lifeExpectancyTable.delete({ where: { id } });
    console.log(`[life-expectancy/import] DELETE row — id=${id}`);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error('[life-expectancy/import] DELETE failed:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Delete failed' }, { status: 500 });
  }
}
