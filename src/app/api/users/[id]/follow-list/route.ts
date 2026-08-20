// FILE: src/app/api/users/[id]/follow-list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFollowList } from '@/lib/userFollow';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const mode = req.nextUrl.searchParams.get('mode');
  if (mode !== 'followers' && mode !== 'following') {
    return NextResponse.json({ error: "mode must be 'followers' or 'following'" }, { status: 400 });
  }
  const users = await getFollowList(params.id, mode);
  return NextResponse.json({ users });
}
