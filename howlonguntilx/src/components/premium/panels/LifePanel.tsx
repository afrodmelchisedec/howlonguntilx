'use client';
import { useEffect, useRef } from 'react';
import { MetricCard, ChartCard } from '../shared';
import { ProGate } from '../shared';

function themeColor(varName: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || fallback;
}

export function LifePanel({ isPremium }: { isPremium: boolean }) {
  const regionRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!regionRef.current) return;
    const tickColor = themeColor('--text-tertiary', '#94a3b8');
    const gridColor = themeColor('--border-hairline', 'rgba(148,163,184,0.1)');

    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      const existing = Chart.getChart(regionRef.current!);
      if (existing) existing.destroy();
      new Chart(regionRef.current!, {
        type:'bar', indexAxis:'y',
        data:{
          labels:['Japan','W. Europe','World avg','E. Africa','Uganda'],
          datasets:[{
            data:[84,78,73,65,68],
            backgroundColor:['#534AB7','#7F77DD','#AFA9EC','#F0997B','#D85A30'],
            borderRadius: 12, barPercentage: 0.7, categoryPercentage: 0.8,
          }]
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ display:false } },
          scales:{
            x:{ ticks:{ font:{ size:11, weight:'bold' }, color:tickColor, callback:(v:any)=>v+'y' }, grid:{ color:gridColor }, min:55 },
            y:{ ticks:{ font:{ size:11 }, color:tickColor }, grid:{ display:false } },
          }
        }
      });
    });
  }, []);

  const milestones = [
    { label: 'Retirement (65)', val: '~30 years', days: '10,950 days', varName: '--accent-brand', progress: 65, category: 'Personal' },
    { label: 'Life expectancy', val: '~37 years', days: '13,505 days', varName: '--accent-green', progress: 100, category: 'Health' },
    { label: 'Healthy years end', val: '~28 years', days: '10,220 days', varName: '--accent-orange', progress: 76, category: 'Wellness' },
    { label: 'Global avg 80y', val: '~45 years', days: '16,425 days', varName: '--accent-pink', progress: 122, category: 'Statistics' },
  ];
  const lifestyleItems = [
    { label: 'No smoking', pct: 85, gain: '+4.1y' },
    { label: 'Exercise', pct: 70, gain: '+3.2y' },
    { label: 'Diet', pct: 55, gain: '+2.5y' },
    { label: 'Sleep', pct: 40, gain: '+1.8y' },
  ];

  const content = (
    <div className="anim-fade-in">
      <div className="mb-6 px-1">
        <h2 className="text-title2">Life longevity insights</h2>
        <p className="text-footnote mt-0.5">Your health trajectory & predicted milestones</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Region avg", value: "68y", sub: "East Africa", varName: '--accent-orange' },
          { label: "Your profile", value: "72y", sub: "+4y above avg", varName: '--accent-pink' },
          { label: "Years lived", value: "35y", sub: "estimated", varName: '--accent-brand' },
          { label: "Years left", value: "37y", sub: "~13,505 days", varName: '--accent-brand' },
        ].map((m, i) => (
          <div key={i} className="ios-card anim-fade-up" style={{ animationDelay: `${i*60}ms` }}>
            <MetricCard label={m.label} value={m.value} sub={m.sub} color={`rgb(var(${m.varName}))`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* gauge */}
        <div className="ios-card glow gc-brand overflow-hidden">
          <div className="p-6">
            <h3 className="text-headline mb-4 flex items-center gap-2">
              <span className="pulse-dot w-1.5 h-1.5" style={{ background: 'rgb(var(--accent-brand))' }} />
              Life progress
            </h3>
            <div className="flex justify-center my-4">
              <div className="relative">
                <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                  <defs>
                    <linearGradient id="lifeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#534AB7" />
                      <stop offset="100%" stopColor="#D4537E" />
                    </linearGradient>
                  </defs>
                  <circle cx="80" cy="80" r="65" fill="none" stroke="var(--border-hairline)" strokeWidth="14" />
                  <circle cx="80" cy="80" r="65" fill="none" stroke="url(#lifeGradient)" strokeWidth="14"
                    strokeDasharray="408.4" strokeDashoffset="208.3" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col" style={{ transform: 'rotate(90deg)' }}>
                  <span className="text-3xl font-black gradient-text">49%</span>
                  <span className="text-caption mt-0.5">elapsed</span>
                </div>
              </div>
            </div>
            <p className="text-footnote text-center mt-2">of estimated life expectancy</p>
          </div>
        </div>

        {/* regional bar chart */}
        <div className="ios-card glow gc-personal overflow-hidden">
          <div className="p-6">
            <h3 className="text-headline mb-4 flex items-center gap-2">
              <span className="pulse-dot w-1.5 h-1.5" style={{ background: 'rgb(var(--accent-pink))' }} />
              Regional comparison
            </h3>
            <div style={{ height: 180 }} className="px-2">
              <canvas ref={regionRef} />
            </div>
          </div>
        </div>
      </div>

      {/* milestones */}
      <div className="ios-card glow gc-sports mb-6">
        <ChartCard title={`Life milestones (${milestones.length})`} className="!border-none !shadow-none">
          <div className="space-y-1">
            {milestones.map((m, i) => {
              const weeks = Math.floor(parseInt(m.val) * 52);
              return (
                <div key={m.label} className="flex gap-4 press rounded-2xl p-3 transition-colors anim-fade-up"
                  style={{ animationDelay: `${i*60}ms` }}>
                  <div className="flex flex-col items-center flex-shrink-0 w-6">
                    <div className="w-3.5 h-3.5 rounded-full mt-2.5 flex-shrink-0 z-10"
                      style={{ background: `rgb(var(${m.varName}))`, border: '3px solid var(--bg-elevated)' }} />
                    {i < milestones.length - 1 && <div className="w-0.5 flex-1 mt-1 rounded-full" style={{ background: 'var(--border-hairline)' }} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-headline">{m.label}</p>
                        <p className="text-caption mt-0.5">{m.category} · {m.days}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black tabular" style={{ color: `rgb(var(${m.varName}))` }}>{m.val}</p>
                        <p className="text-caption">{weeks > 0 ? `${weeks.toLocaleString()} weeks` : 'Critical'}</p>
                      </div>
                    </div>
                    <div className="progress-track mt-3">
                      <div className="progress-fill" style={{ width: Math.min(m.progress, 100) + '%', background: `rgb(var(${m.varName}))` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* lifestyle */}
      <div className="ios-card glow gc-personal">
        <ChartCard title="Lifestyle improvement potential" className="!border-none !shadow-none">
          <div className="space-y-3">
            {lifestyleItems.map((item, idx) => (
              <div key={idx} className="press rounded-xl p-2 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-callout font-semibold">{item.label}</span>
                  <span className="text-callout font-black" style={{ color: 'rgb(var(--accent-pink))' }}>{item.gain}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${item.pct}%`, background: 'rgb(var(--accent-pink))' }} />
                </div>
              </div>
            ))}
            <div className="ios-card-nested mt-4 p-3">
              <p className="text-footnote text-center">
                💪 Potential gain: <span className="font-black" style={{ color: 'rgb(var(--accent-pink))' }}>+12.4 years</span> with all improvements
              </p>
            </div>
          </div>
          <p className="text-footnote text-center mt-4 italic opacity-70">
            Based on WHO data & actuarial models. Not medical advice.
          </p>
        </ChartCard>
      </div>
    </div>
  );

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="text-title1 uppercase italic">Life Longevity</h2>
          <p className="text-caption">Predictive Health Analytics</p>
        </div>
        <span className="pill" style={{ background: 'linear-gradient(135deg, rgb(var(--accent-pink)), rgb(var(--accent-orange)))', color: '#fff' }}>
          Premium Health
        </span>
      </div>
      {isPremium ? content : <ProGate title="Life analytics — Premium" desc="See your predicted life milestones, regional comparisons, and how lifestyle choices affect how long you have.">{content}</ProGate>}
    </div>
  );
}
