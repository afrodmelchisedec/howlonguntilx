// FILE: src/app/tools/birth-control-effectiveness-countdown/watch/[token]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { CoverageWatchView } from '@/components/pro-tools/CoverageWatchView';

export default async function CoverageWatchPage({ params }: { params: { token: string } }) {
  const config = await prisma.birthControlEffectivenessConfig.findFirst({
    where: { shareLink: params.token },
  });
  if (!config) notFound();

  return (
    <main className="px-4 sm:px-6 py-10 sm:py-14">
      <CoverageWatchView
        method={config.method as any}
        startDate={config.startDate?.toISOString().slice(0, 10) ?? null}
        cycleDayAtStart={config.cycleDayAtStart ?? 1}
      />
    </main>
  );
}
