'use client';
import { buildCountdownResponse } from '@/lib/countdown';
import Link from 'next/link';

interface Timer { id: string; name: string; targetDate: Date|string; category: string }

const CATS = [
  { id: 'holidays',      label: 'Holidays',      cls: 'gc-holidays' },
  { id: 'sports',        label: 'Sports',         cls: 'gc-sports' },
  { id: 'finance',       label: 'Finance',        cls: 'gc-finance' },
  { id: 'personal',      label: 'Personal',       cls: 'gc-personal' },
  { id: 'tech',          label: 'Tech',           cls: 'gc-tech' },
  { id: 'nature',        label: 'Nature',         cls: 'gc-nature' },
  { id: 'entertainment', label: 'Entertainment',  cls: 'gc-entertainment' },
  { id: 'shopping',      label: 'Shopping',       cls: 'gc-shopping' },
];

export function CategoriesPanel({ timers }: { timers: Timer[] }) {
  const groups = CATS.map(cat => ({
    ...cat,
    timers: timers
      .filter(t => t.category === cat.id)
      .map(t => ({ ...t, ...buildCountdownResponse(t.name, new Date(t.targetDate)) }))
      .sort((a,b) => a.days_left - b.days_left)
  })).filter(g => g.timers.length > 0);

  return (
    <div className="anim-fade-in">
      <div className="mb-8 px-1">
        <h2 className="text-title1">Category breakdown</h2>
        <p className="text-footnote mt-1">Smart groupings with adaptive themes</p>
      </div>

      {groups.length === 0 ? (
        <div className="p-20 rounded-[28px] text-center" style={{ border: '2px dashed var(--border-hairline)' }}>
          <p className="text-footnote">No countdowns yet. Add some to see your breakdown.</p>
          <Link href="#" className="btn-plain text-sm mt-4 inline-block">← Go to overview</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((group, idx) => (
            <div key={group.id}
              className={`ios-card glow ${group.cls} anim-fade-up overflow-hidden`}
              style={{ animationDelay: `${idx * 80}ms` }}>

              {/* header */}
              <div className="px-6 py-5 flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'rgb(var(--glow))' }} />
                <span className="text-caption">{group.label}</span>
                <span className="pill" style={{ background: 'rgba(var(--glow),0.12)', color: 'rgb(var(--glow))' }}>
                  {group.timers.length} Active
                </span>
              </div>

              <div className="px-6 pb-6 space-y-5">
                {group.timers.map(t => (
                  <div key={t.id} className="group/item">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-headline">{t.name}</p>
                        <p className="text-caption mt-0.5">{t.progress_percent}% complete</p>
                      </div>
                      <span className="text-lg font-black tabular" style={{ color: 'rgb(var(--glow))' }}>
                        {t.days_left}<span className="text-[10px] opacity-60 ml-0.5">D</span>
                      </span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: t.progress_percent + '%', background: 'rgb(var(--glow))' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* discover */}
      <div className="mt-12 mb-10">
        <p className="text-caption mb-5 px-1">Discover categories</p>
        <div className="flex flex-wrap gap-3">
          {CATS.map(c => (
            <Link key={c.id} href={`/categories/${c.id}`}
              className={`ios-card interactive glow ${c.cls} text-xs font-bold px-5 py-2.5 rounded-full capitalize`}>
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
