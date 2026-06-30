'use client';
import { useEffect, useRef } from 'react';
import { MetricCard, ChartCard, ProGate } from '../shared';

function themeColor(varName: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || fallback;
}

export function CryptoPanel({ isPremium }: { isPremium: boolean }) {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const tickColor = themeColor('--text-tertiary', '#94a3b8');
    const gridColor = themeColor('--border-hairline', 'rgba(148,163,184,0.15)');

    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      const existing = Chart.getChart(chartRef.current!);
      if (existing) existing.destroy();
      new Chart(chartRef.current!, {
        type: 'line',
        data: {
          labels: ['Now','1mo','2mo','3mo','4mo','5mo','6mo','9mo','12mo'],
          datasets: [
            { label: 'Base', data: [96,99,104,108,115,122,118,135,148], borderColor:'#BA7517', backgroundColor:'rgba(186,117,23,0.08)', fill:true, tension:0.4, borderWidth:3, pointRadius:0, pointHoverRadius:6 },
            { label: 'Bull', data: [96,102,112,122,135,150,155,175,200], borderColor:'#1D9E75', borderDash:[5,5], fill:false, tension:0.4, borderWidth:1.5, pointRadius:0 },
            { label: 'Bear', data: [96,91,88,85,90,95,88,92,98],  borderColor:'#E24B4A', borderDash:[5,5], fill:false, tension:0.4, borderWidth:1.5, pointRadius:0 },
          ]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ display:false } },
          scales:{
            x:{ ticks:{font:{size:10, weight:'bold'},color:tickColor}, grid:{display:false} },
            y:{ ticks:{font:{size:10},color:tickColor,callback:(v:any)=>'$'+v+'k'}, grid:{color:gridColor}, min:70 }
          }
        }
      });
    });
  }, []);

  const content = (
    <div className="anim-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "BTC now", value: "$96k", sub: "+2.1% today", varName: '--accent-green' },
          { label: "Next halving", value: "2028", sub: "~700 days", varName: '--accent-brand' },
          { label: "Model confidence", value: "71%", sub: "accuracy", varName: '--accent-orange' },
          { label: "Cycle phase", value: "Bull", sub: "mid-cycle", varName: '--accent-orange' },
        ].map((m, i) => (
          <div key={i} className="ios-card anim-fade-up" style={{ animationDelay: `${i*60}ms` }}>
            <MetricCard label={m.label} value={m.value} sub={m.sub} color={`rgb(var(${m.varName}))`} />
          </div>
        ))}
      </div>

      <div className="ios-card glow gc-finance mb-6 overflow-hidden">
        <ChartCard title="Bitcoin price trajectory — base / bull / bear cases" className="!border-none !shadow-none">
          <div className="flex gap-6 text-caption mb-6 px-1">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: '#BA7517' }}></span>Base Case</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2" style={{ borderColor: '#1D9E75' }}></span>Bull Run</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2" style={{ borderColor: '#E24B4A' }}></span>Correction</span>
          </div>
          <div style={{ height: 240 }} className="px-2"><canvas ref={chartRef} /></div>
        </ChartCard>
      </div>

      <div className="ios-card glow gc-brand p-2">
        <ChartCard title="Price target milestones" className="!border-none !shadow-none">
          <div className="space-y-1">
            {[
              { label: "$100,000", value: "~47 days", conf: "High 81%", varName: '--accent-green' },
              { label: "$120,000", value: "~110 days", conf: "Med 64%", varName: '--accent-orange' },
              { label: "$150,000", value: "~200 days", conf: "Med 51%", varName: '--accent-orange' },
              { label: "$200,000", value: "~380 days", conf: "Low 29%", varName: '--accent-red' },
              { label: "ETH $5,000", value: "~85 days", conf: "High 72%", varName: '--accent-green' },
            ].map((row, i) => (
              <div key={i} className="press flex items-center justify-between p-4 rounded-2xl transition-colors anim-fade-up"
                style={{ animationDelay: `${i*60}ms` }}>
                <div>
                  <p className="text-headline">{row.label}</p>
                  <p className="text-caption mt-0.5">{row.conf} confidence</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black tabular" style={{ color: `rgb(var(${row.varName}))` }}>{row.value}</p>
                  <div className="progress-track mt-1.5" style={{ width: 64, height: 4, marginLeft: 'auto' }}>
                    <div className="progress-fill" style={{ width: row.conf.split(' ')[1], background: `rgb(var(${row.varName}))` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-footnote text-center mt-4 italic opacity-70">
            Cycle analysis + ML models. Past performance ≠ future results.
          </p>
        </ChartCard>
      </div>
    </div>
  );

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-8 px-1">
        <div>
          <h2 className="text-title1 uppercase italic">Market Intelligence</h2>
          <p className="text-caption">Predictive Crypto Analytics</p>
        </div>
        <span className="pill" style={{ background: 'rgb(var(--accent-orange))', color: '#fff' }}>
          Tier 1 Access
        </span>
      </div>
      {isPremium ? content : <ProGate title="Crypto predictions — Premium" desc="Upgrade to see AI-powered Bitcoin & Ethereum price target timelines.">{content}</ProGate>}
    </div>
  );
}
