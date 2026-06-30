import { EmbedGenerator } from '@/components/embed/EmbedGenerator';

export const metadata = { title: 'Embed a Countdown Widget' };

export default function EmbedPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-medium mb-6">Embed a countdown</h1>
      <EmbedGenerator />
    </div>
  );
}
