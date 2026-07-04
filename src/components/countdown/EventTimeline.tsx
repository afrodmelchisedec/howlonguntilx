'use client';
import { useState } from 'react';

interface Props {
  items: { label: string; offset: string; note?: string }[];
}

export function EventTimeline({ items }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (!items?.length) return null;

  return (
    <div className="ios-card p-6 text-left">
      <h2 className="text-title3 mb-1">Timeline</h2>
      <p className="text-footnote mb-5">Tap a stage for more detail.</p>

      <div className="relative pl-6">
        <div className="absolute left-[7px] top-1 bottom-1 w-px" style={{ background: 'var(--border-hairline)' }} />
        <div className="absolute left-[7px] top-1 w-px timeline-fill" style={{ background: 'rgb(var(--accent-brand))' }} />

        <div className="space-y-1">
          {items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="relative anim-fade-up" style={{ animationDelay: (i * 120) + 'ms' }}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full text-left press"
                  style={{ background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer' }}
                >
                  <span
                    className="absolute -left-6 top-3 timeline-dot"
                    style={{ background: 'rgb(var(--accent-brand))', animationDelay: (i * 200) + 'ms' }}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-headline">{item.offset}</div>
                      <div className="text-callout" style={{ color: 'var(--text-secondary)' }}>{item.label}</div>
                    </div>
                    {item.note && (
                      <span
                        className="transition-transform flex-shrink-0"
                        style={{ color: 'var(--text-tertiary)', transform: isOpen ? 'rotate(180deg)' : 'none' }}
                      >
                        ▾
                      </span>
                    )}
                  </div>
                  {item.note && isOpen && (
                    <p className="text-footnote mt-2 anim-fade-up" style={{ color: 'var(--text-secondary)' }}>
                      {item.note}
                    </p>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .timeline-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: timelinePulse 2s ease-out infinite;
        }
        @keyframes timelinePulse {
          0%   { box-shadow: 0 0 0 0 rgba(var(--accent-brand), 0.45); }
          70%  { box-shadow: 0 0 0 9px rgba(var(--accent-brand), 0); }
          100% { box-shadow: 0 0 0 0 rgba(var(--accent-brand), 0); }
        }
        .timeline-fill {
          height: 100%;
          transform: scaleY(0);
          transform-origin: top;
          animation: timelineGrow 1.1s ease-out forwards;
          animation-delay: 0.15s;
        }
        @keyframes timelineGrow {
          to { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
