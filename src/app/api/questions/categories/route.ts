// FILE: src/app/api/questions/categories/route.ts
import { NextResponse } from 'next/server';
import { getQuestionsCategories } from '@/lib/questionsFeed';

export async function GET() {
  const categories = await getQuestionsCategories();
  return NextResponse.json(categories);
}
