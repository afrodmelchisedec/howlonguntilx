import { NextRequest, NextResponse } from 'next/server';
import { getArchivedFaqs } from '@/lib/faqs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10) || 10));

  try {
    const data = await getArchivedFaqs(page, limit);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load archived FAQs' }, { status: 500 });
  }
}
