// FILE: src/app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCommentsForSubject, createComment } from '@/lib/comments';
import { commentCreateSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subjectType = searchParams.get('subjectType');
  const subjectId = searchParams.get('subjectId');
  if (!subjectType || !subjectId) {
    return NextResponse.json({ error: 'subjectType and subjectId are required' }, { status: 400 });
  }
  const session = await getServerSession(authOptions);
  const comments = await getCommentsForSubject(subjectType, subjectId, session?.user?.id);
  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }
  const body = await req.json();
  const parsed = commentCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const comment = await createComment(session.user.id, parsed.data);
  return NextResponse.json(comment, { status: 201 });
}
