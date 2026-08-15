// FILE: src/app/tools/garden-growth-bloom-tracker/watch/[token]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { GardenWatchView } from '@/components/pro-tools/GardenWatchView';

export default async function GardenWatchPage({ params }: { params: { token: string } }) {
  const config = await prisma.gardenGrowthTrackerConfig.findFirst({
    where: { shareLink: params.token },
  });
  if (!config) notFound();

  const beds = Array.isArray(config.beds) ? config.beds as any[] : [];

  return (
    <main className="px-4 sm:px-6 py-10 sm:py-14">
      <GardenWatchView beds={beds} />
    </main>
  );
}
