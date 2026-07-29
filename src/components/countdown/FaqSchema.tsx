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
  
  // Safely get FAQs - ensure we have an array
  let faqs: { q: string; a: string }[] = [];
  try {
    faqs = buildFaqList(event, countdown, content.faqs);
  } catch (e) {
    console.warn('Failed to build FAQ list:', e);
    // Fallback to basic FAQs
    const days = countdown.days_left;
    faqs = [
      { q: `How long until ${event.name}?`, a: `${days} days` },
      { q: `When is ${event.name}?`, a: new Date(event.targetDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) },
    ];
  }

  // Filter out any invalid FAQ items
  const validFaqs = faqs.filter(f => f && f.q && typeof f.q === 'string' && f.q.trim().length > 0);

  if (validFaqs.length === 0) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-8 text-left">
      <h2 className="text-title3 mb-4">Frequently asked</h2>
      <div className="space-y-2">
        {validFaqs.map((f, idx) => (
          <details key={idx} className="ios-card-nested group" style={{ border: '1px solid var(--border-hairline)' }}>
            <summary className="px-4 py-3 cursor-pointer text-headline list-none flex items-center justify-between">
              {f.q}
              <span className="group-open:rotate-180 transition-transform" style={{ color: 'var(--text-tertiary)' }}>▾</span>
            </summary>
            <div className="px-4 pb-3 text-footnote" style={{ color: 'var(--text-secondary)' }}>
              {f.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
