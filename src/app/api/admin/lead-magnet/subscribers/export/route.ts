// FILE: src/app/api/admin/lead-magnet/subscribers/export/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// GET — downloads all lead magnet subscribers as a CSV file.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const subscribers = await prisma.leadMagnetSubscriber.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const header = ['Name', 'Email', 'Region', 'Source', 'Signed up'];
  const rows = subscribers.map(s =>
    [
      csvEscape(s.name),
      csvEscape(s.email),
      csvEscape(s.region),
      csvEscape(s.source),
      csvEscape(s.createdAt.toISOString()),
    ].join(',')
  );

  const csv = [header.join(','), ...rows].join('\n');
  const filename = `lead-magnet-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
