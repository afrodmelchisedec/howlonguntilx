interface Props {
  event: { name: string; slug: string; targetDate: Date | string };
  countdown: { days_left: number; hours_left: number; progress_percent: number };
}

export function FaqSchema({ event, countdown }: Props) {
  const dateStr = new Date(event.targetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const faqs = [
    {
      q: `How long until ${event.name}?`,
      a: `There are ${countdown.days_left} days and ${countdown.hours_left} hours until ${event.name} on ${dateStr}.`,
    },
    {
      q: `How many days until ${event.name}?`,
      a: `Exactly ${countdown.days_left} days until ${event.name}.`,
    },
    {
      q: `When is ${event.name}?`,
      a: `${event.name} is on ${dateStr}.`,
    },
    {
      q: `How many weeks until ${event.name}?`,
      a: `There are approximately ${Math.floor(countdown.days_left / 7)} weeks until ${event.name}.`,
    },
  ];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
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
    </>
  );
}
