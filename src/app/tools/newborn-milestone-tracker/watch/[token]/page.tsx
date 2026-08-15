// FILE: src/app/tools/newborn-milestone-tracker/watch/[token]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { MilestoneWatchView } from '@/components/pro-tools/MilestoneWatchView';

export default async function MilestoneWatchPage({ params }: { params: { token: string } }) {
  const config = await prisma.newbornMilestoneTrackerConfig.findFirst({
    where: { shareLink: params.token },
  });
  if (!config) notFound();

  const notes = Array.isArray(config.milestoneNotes) ? config.milestoneNotes as any[] : [];

  return (
    <main className="px-4 sm:px-6 py-10 sm:py-14">
      <MilestoneWatchView
        birthDate={config.birthDate?.toISOString().slice(0, 10) ?? null}
        notes={notes}
      />
    </main>
  );
}
