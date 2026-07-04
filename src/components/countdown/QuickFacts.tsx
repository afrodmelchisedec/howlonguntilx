interface Props {
  days: number;
  weeks: number;
  months: number;
  hoursTotal: number;
  eventName: string;
  targetDate: Date | string;
  extra?: { label: string; value: string }[];
}

export function QuickFacts({ days, weeks, months, hoursTotal, eventName, targetDate, extra }: Props) {
  const dateLabel = new Date(targetDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const stats = [
    { val: days.toLocaleString(), label: 'Days' },
    { val: weeks.toLocaleString(), label: 'Weeks' },
    { val: months.toLocaleString(), label: 'Months' },
    { val: hoursTotal.toLocaleString(), label: 'Hours' },
    ...(extra ?? []).map(e => ({ val: e.value, label: e.label })),
  ];

  return (
    <div className="ios-card p-6">
      <h2 className="text-caption mb-4">By the numbers</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {stats.map(item => (
          <div key={item.label} className="ios-card-nested text-center p-3">
            <div className="text-2xl font-black tabular" style={{ color: 'rgb(var(--accent-brand))' }}>{item.val}</div>
            <div className="text-caption mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
      <p className="text-footnote">
        {eventName} is on <strong style={{ color: 'var(--text-primary)' }}>{dateLabel}</strong>. About {weeks} weeks or {months} months from now — {hoursTotal.toLocaleString()} total hours.
      </p>
    </div>
  );
}
