import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createUserEvent, getUserEvents, UserEventLimitError } from '@/lib/userEvents';
import { userEventCreateSchema } from '@/lib/validators';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const events = await getUserEvents(session.user.id);
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = userEventCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const isAdmin = session.user.role === 'ADMIN';
    const event = await createUserEvent(session.user.id, parsed.data, isAdmin);
    return NextResponse.json(event, { status: 201 });
  } catch (e) {
    if (e instanceof UserEventLimitError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }
}
