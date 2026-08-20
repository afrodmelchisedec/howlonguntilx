import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { flagComment, unflagComment, softDeleteComment } from '@/lib/comments';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: { action?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.action === 'flag') {
    const comment = await flagComment(session.user.id, params.id, body.reason);
    return NextResponse.json(comment);
  }
  if (body.action === 'unflag') {
    const comment = await unflagComment(params.id);
    return NextResponse.json(comment);
  }
  if (body.action === 'remove') {
    // Reuses the existing soft-delete path (isAdmin=true bypasses the
    // author-ownership check) rather than a parallel delete implementation.
    const comment = await softDeleteComment(session.user.id, params.id, true);
    if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(comment);
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
