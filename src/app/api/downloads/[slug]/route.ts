// FILE: src/app/api/downloads/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const release = await prisma.pluginRelease.findFirst({
    where: { slug: params.slug, isLatest: true },
  });
  if (!release) {
    return NextResponse.json({ error: 'No release found for this plugin' }, { status: 404 });
  }

  const absPath = path.join(process.cwd(), 'storage', 'plugin-releases', release.filePath);
  let fileBuffer: Buffer;
  try {
    fileBuffer = await readFile(absPath);
  } catch (err) {
    console.error('Plugin release file missing on disk:', absPath, err);
    return NextResponse.json({ error: 'File not found on server' }, { status: 500 });
  }

  await prisma.pluginRelease.update({
    where: { id: release.id },
    data: { downloadCount: { increment: 1 } },
  }).catch(err => console.error('Could not increment download count:', err));

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${release.slug}-${release.version}.zip"`,
      'Content-Length': String(fileBuffer.length),
      'Cache-Control': 'no-store',
    },
  });
}
