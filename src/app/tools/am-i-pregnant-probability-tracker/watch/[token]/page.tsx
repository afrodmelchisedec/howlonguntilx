// FILE: src/app/tools/am-i-pregnant-probability-tracker/watch/[token]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { BumpWatchView } from '@/components/pro-tools/BumpWatchView';

export default async function BumpWatchPage({ params }: { params: { token: string } }) {
  const config = await prisma.amIPregnantTrackerConfig.findFirst({
    where: { shareLink: params.token },
  });
  if (!config) notFound();

  const history = Array.isArray(config.history)
    ? (config.history as any[]).map(h => ({ date: h.date, dpo: h.dpo, probability: h.probability }))
    : [];

  return (
    <main className="px-4 sm:px-6 py-10 sm:py-14">
      <BumpWatchView
        lastPeriod={config.lastPeriod.toISOString().slice(0, 10)}
        cycleLength={config.cycleLength}
        history={history}
      />
    </main>
  );
}
