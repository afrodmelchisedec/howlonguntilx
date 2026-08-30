// FILE: src/app/api/admin/seo/opportunities/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { upsertEventFromJson } from '@/lib/events-admin';
import type { EventContent } from '@/lib/seo';

async function isAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (token && process.env.SEO_PIPELINE_TOKEN && token === process.env.SEO_PIPELINE_TOKEN) {
    return { user: { role: 'ADMIN', id: 'seo-pipeline' } };
  }
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

interface PatchBody {
  status?: 'DISCOVERED' | 'REVIEWED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  reviewNotes?: string;
  // Only required when status is 'PUBLISHED' — this is what actually
  // creates/updates the Event record that the site renders.
  publish?: {
    slug: string;
    name: string;
    targetDate: string; // ISO date
    categorySlug: string;
    description?: string;
    content?: EventContent;
  };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await isAdmin(req);
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const opportunity = await prisma.seoOpportunity.findUnique({ where: { id: params.id } });
  if (!opportunity) {
    return NextResponse.json({ error: `No SeoOpportunity found with id "${params.id}"` }, { status: 404 });
  }

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (body.status === 'PUBLISHED') {
    if (!body.publish) {
      return NextResponse.json(
        { error: 'status "PUBLISHED" requires a "publish" object: { slug, name, targetDate, categorySlug, description?, content? }' },
        { status: 400 }
      );
    }
    const result = await upsertEventFromJson({
      slug: body.publish.slug,
      name: body.publish.name,
      targetDate: body.publish.targetDate,
      categorySlug: body.publish.categorySlug,
      description: body.publish.description,
      content: body.publish.content as Record<string, unknown> | undefined,
      published: true,
    });

    if (result.status === 'error') {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const updated = await prisma.seoOpportunity.update({
      where: { id: params.id },
      data: {
        status: 'PUBLISHED',
        eventSlug: body.publish.slug,
        reviewNotes: body.reviewNotes ?? opportunity.reviewNotes,
      },
    });
    return NextResponse.json({ opportunity: updated, event: result });
  }

  const updated = await prisma.seoOpportunity.update({
    where: { id: params.id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.reviewNotes !== undefined ? { reviewNotes: body.reviewNotes } : {}),
    },
  });

  return NextResponse.json({ opportunity: updated });
}
