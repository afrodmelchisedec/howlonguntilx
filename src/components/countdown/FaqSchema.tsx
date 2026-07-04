import { buildFaqList, type EventContent } from '@/lib/seo';

interface Props {
  event: {
    name: string;
    targetDate: Date | string;
    type?: 'COUNTDOWN' | 'ELAPSED' | 'RELATIVE';
    content?: unknown;
  };
  countdown: { days_left: number; hours_left: number };
}

export function FaqSchema({ event, countdown }: Props) {
  const content = (event.content ?? {}) as EventContent;
  const faqs = buildFaqList(event, countdown, content.faqs);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-8 text-left">
      <h2 className="text-title3 mb-4">Frequently asked</h2>
      <div className="space-y-2">
        {faqs.map(f => (
          <details key={f.q} className="ios-card-nested group" style={{ border: '1px solid var(--border-hairline)' }}>
            <summary className="px-4 py-3 cursor-pointer text-headline list-none flex items-center justify-between">
              {f.q}
              <span className="group-open:rotate-180 transition-transform" style={{ color: 'var(--text-tertiary)' }}>▾</span>
            </summary>
            <p className="px-4 pb-3 text-footnote">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
