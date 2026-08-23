// FILE: src/app/api/questions/feed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getQuestionsFeed, type QuestionsSort } from '@/lib/questionsFeed';

const VALID_SORTS: QuestionsSort[] = ['recent', 'engagement'];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') ?? undefined;
  const cursor = searchParams.get('cursor') ?? undefined;
  const q = searchParams.get('q') ?? undefined;
  const sortParam = searchParams.get('sort') ?? 'recent';
  const sort: QuestionsSort = VALID_SORTS.includes(sortParam as QuestionsSort) ? (sortParam as QuestionsSort) : 'recent';
  const takeParam = searchParams.get('take');
  const take = takeParam ? Math.min(Math.max(parseInt(takeParam, 10) || 9, 1), 24) : undefined;

  const { items, nextCursor } = await getQuestionsFeed({ category, cursor, sort, q, take });
  return NextResponse.json({ items, nextCursor });
}
