// FILE: src/app/api/user-events/[id]/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadImage } from '@/lib/blobStorage';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB per image
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const FREE_IMAGE_CAP = 1;
const PRO_IMAGE_CAP = 4;

function randomKey(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const rand = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rand}.${ext}`;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const userEvent = await prisma.userEvent.findUnique({
    where: { id: params.id },
    select: { authorId: true, images: true },
  });
  if (!userEvent) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  if (userEvent.authorId !== session.user.id) {
    return NextResponse.json({ error: 'Not your event' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
  const plan = user?.plan ?? 'FREE';
  const imageCap = plan === 'PRO' ? PRO_IMAGE_CAP : FREE_IMAGE_CAP;

  const existingImages = Array.isArray(userEvent.images) ? (userEvent.images as string[]) : [];

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });

  const files = formData.getAll('images').filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: 'No images provided' }, { status: 400 });

  if (existingImages.length + files.length > imageCap) {
    return NextResponse.json(
      { error: `Your plan allows up to ${imageCap} image(s) per event. You already have ${existingImages.length}.` },
      { status: 403 }
    );
  }

  const uploadedUrls: string[] = [];
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type || 'unknown'}` }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `"${file.name}" is too large — 5MB max per image.` }, { status: 400 });
    }

    const key = `${params.id}/${randomKey(file.name)}`;
    const buffer = await file.arrayBuffer();
    const url = await uploadImage(key, buffer, file.type);
    uploadedUrls.push(url);
  }

  const updatedImages = [...existingImages, ...uploadedUrls];
  await prisma.userEvent.update({
    where: { id: params.id },
    data: { images: updatedImages },
  });

  return NextResponse.json({ images: updatedImages });
}
