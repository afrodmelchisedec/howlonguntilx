import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { autoFollowDefaultForNewUser } from '@/lib/userFollow';
import { assignUsernameForNewUser } from '@/lib/username';

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name: name || null, email, passwordHash, emailVerified: new Date() },
  });

  // Credentials signup doesn't go through PrismaAdapter's createUser, so
  // it needs its own direct auto-follow call — the OAuth/Email paths get
  // this via the events.createUser hook in auth.ts instead.
  await assignUsernameForNewUser(user.id, user.name, user.email);
  await autoFollowDefaultForNewUser(user.id);

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
