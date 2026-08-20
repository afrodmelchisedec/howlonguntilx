// FILE: src/app/api/blobs/[...key]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getImage } from '@/lib/blobStorage';

export async function GET(_req: NextRequest, { params }: { params: { key: string[] } }) {
  const key = params.key.join('/');
  const image = await getImage(key);
  if (!image) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return new NextResponse(image.data, {
    headers: {
      'Content-Type': image.contentType,
      // Images are content-addressed-ish (random key per upload, never
      // reused), so immutable caching is safe — a changed image gets a
      // new key rather than overwriting an old one.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
