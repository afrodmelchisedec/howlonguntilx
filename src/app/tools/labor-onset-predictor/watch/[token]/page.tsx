// FILE: src/app/tools/labor-onset-predictor/watch/[token]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { LaborWatchView } from '@/components/pro-tools/LaborWatchView';

export default async function LaborWatchPage({ params }: { params: { token: string } }) {
  const config = await prisma.laborOnsetPredictorConfig.findFirst({
    where: { shareLink: params.token },
  });
  if (!config) notFound();

  return (
    <main className="px-4 sm:px-6 py-10 sm:py-14">
      <LaborWatchView
        mucusPlugDate={config.mucusPlugDate?.toISOString().slice(0, 10) ?? null}
        babyDropped={config.babyDropped}
        babyDroppedDate={config.babyDroppedDate?.toISOString().slice(0, 10) ?? null}
        waterBroke={config.waterBroke}
      />
    </main>
  );
}
