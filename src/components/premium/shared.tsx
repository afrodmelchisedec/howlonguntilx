export function MetricCard({ label, value, sub, color, className }: { label: string; value: string; sub?: string; color?: string; className?: string }) {
  return (
    <div className={`ios-card-nested p-4 ${className ?? ''}`}>
      <p className="text-caption mb-1">{label}</p>
      <p className="text-2xl font-bold tabular" style={color ? { color } : { color: 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-footnote mt-0.5">{sub}</p>}
    </div>
  );
}

export function ChartCard({ title, children, accentColor, className }: { title?: string; children: React.ReactNode; accentColor?: string; className?: string }) {
  return (
    <div className={`ios-card p-5 ${className ?? ''}`}
      style={accentColor ? { borderTop: `3px solid ${accentColor}` } : {}}>
      {title && <p className="text-headline mb-4">{title}</p>}
      {children}
    </div>
  );
}

export function PredictRow({ label, value, confidence, color }: { label: string; value: string; confidence: string; color: string }) {
  const confVar = confidence.startsWith('High') ? '--accent-green'
    : confidence.startsWith('Med') ? '--accent-orange'
    : '--accent-red';
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--border-hairline)' }}>
      <span className="text-callout" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-callout font-semibold" style={{ color }}>{value}</span>
        <span className="pill" style={{ background: `rgba(var(${confVar}),0.12)`, color: `rgb(var(${confVar}))` }}>{confidence}</span>
      </div>
    </div>
  );
}

export function BarRow({ label, pct, color, valLabel }: { label: string; pct: number; color: string; valLabel: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-footnote w-20 text-right flex-shrink-0">{label}</span>
      <div className="progress-track flex-1">
        <div className="progress-fill" style={{ width: pct+'%', background: color }} />
      </div>
      <span className="text-xs font-semibold w-10 flex-shrink-0" style={{ color }}>{valLabel}</span>
    </div>
  );
}

export function ProGate({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="opacity-30 pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="ios-card p-8 text-center max-w-xs mx-auto" style={{ boxShadow: 'var(--shadow-elevated)' }}>
          <div className="text-3xl mb-3">⭐</div>
          <p className="text-headline mb-1">{title}</p>
          <p className="text-footnote mb-5">{desc}</p>
          <button className="btn-filled w-full">
            Upgrade to Premium — $4/mo
          </button>
          <p className="text-footnote mt-2">Cancel anytime · No credit card trial</p>
        </div>
      </div>
    </div>
  );
}
