'use client';
import { useEffect, useRef, useState } from 'react';
import { ChartCard, PredictRow, ProGate } from '../shared';

export function WorldPanel({ isPremium }: { isPremium: boolean }) {
  const climateRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!climateRef.current) return;
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      new Chart(climateRef.current!, {
        type: 'line',
        data: {
          labels: ['2025', '2027', '2029', '2031', '2033', '2035', '2040', '2045', '2050'],
          datasets: [
            { 
              label: '1.5°C target', 
              data: [1.2, 1.25, 1.28, 1.3, 1.32, 1.35, 1.42, 1.48, 1.5], 
              borderColor: '#1D9E75', 
              borderDash: [5, 5], 
              fill: false, 
              tension: 0.3, 
              borderWidth: 2, 
              pointRadius: 0,
              pointHoverRadius: 6,
              pointHoverBackgroundColor: '#1D9E75'
            },
            { 
              label: 'Current trajectory',
              data: [1.2, 1.27, 1.35, 1.44, 1.54, 1.65, 1.9, 2.1, 2.3], 
              borderColor: '#D85A30', 
              backgroundColor: 'rgba(216,90,48,0.08)', 
              fill: true, 
              tension: 0.4, 
              borderWidth: 2.5, 
              pointRadius: 0,
              pointHoverRadius: 6,
              pointHoverBackgroundColor: '#D85A30'
            },
          ]
        },
        options: {
          responsive: true, 
          maintainAspectRatio: false,
          plugins: { 
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(255,255,255,0.95)',
              titleColor: '#1e293b',
              bodyColor: '#64748b',
              borderColor: 'rgba(216,90,48,0.2)',
              borderWidth: 1,
              cornerRadius: 12,
              callbacks: {
                label: (context: any) => `${context.dataset.label}: +${context.raw}°C`
              }
            }
          },
          scales: {
            x: { 
              ticks: { font: { size: 11, weight: 'bold' }, color: '#94a3b8' }, 
              grid: { color: 'rgba(226, 232, 240, 0.08)' },
              border: { dash: [4, 4] }
            },
            y: { 
              ticks: { 
                font: { size: 11, weight: 500 }, 
                color: '#94a3b8',
                callback: (v: any) => '+' + Number(v).toFixed(1) + '°C'
              }, 
              grid: { color: 'rgba(226, 232, 240, 0.08)' },
              border: { dash: [4, 4] },
              min: 1.1 
            }
          }
        }
      });
    });
  }, []);

  const techMilestones = [
    { label: 'AGI achieved (Metaculus consensus)', val: '~6-12 years', confidence: 'Med 58%', color: '#378ADD', rgb: '55,138,221', category: 'AI', progress: 58 },
    { label: 'Personal AI chip (1M params)', val: '~2-4 years', confidence: 'High 76%', color: '#1D9E75', rgb: '29,158,117', category: 'Tech', progress: 76 },
    { label: 'First human on Mars', val: '~7-12 years', confidence: 'Low 38%', color: '#BA7517', rgb: '186,117,23', category: 'Space', progress: 38 },
    { label: 'Quantum supremacy (commercial)', val: '~3-6 years', confidence: 'Med 61%', color: '#378ADD', rgb: '55,138,221', category: 'Quantum', progress: 61 },
    { label: 'Nuclear fusion (grid-scale)', val: '~10-20 years', confidence: 'Low 32%', color: '#A32D2D', rgb: '163,45,45', category: 'Energy', progress: 32 },
  ];

  const financeMilestones = [
    { label: 'Next US recession', val: '~1-2 years', confidence: 'Med 52%', color: '#A32D2D', rgb: '163,45,45', category: 'Economy', progress: 52 },
    { label: 'USD loses reserve status', val: '~20-40 years', confidence: 'Low 22%', color: '#BA7517', rgb: '186,117,23', category: 'Geopolitics', progress: 22 },
    { label: 'Africa GDP surpasses Europe', val: '~30-50 years', confidence: 'Med 55%', color: '#1D9E75', rgb: '29,158,117', category: 'Economy', progress: 55 },
    { label: 'First $1T African company', val: '~8-15 years', confidence: 'Med 48%', color: '#378ADD', rgb: '55,138,221', category: 'Business', progress: 48 },
    { label: 'Global debt crisis resolution', val: '~5-10 years', confidence: 'Low 35%', color: '#BA7517', rgb: '186,117,23', category: 'Finance', progress: 35 },
  ];

  const getConfidenceColor = (confidence: string) => {
    if (confidence.startsWith('High')) return { bg: '#E1F5EE', text: '#0F6E56', border: '#1D9E75' };
    if (confidence.startsWith('Med')) return { bg: '#FAEEDA', text: '#854F0B', border: '#BA7517' };
    return { bg: '#FCEBEB', text: '#A32D2D', border: '#D85A30' };
  };

  const content = (
    <div className="anim-fade-in">
      {/* Header */}
      <div className="mb-6 px-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          World event predictions
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">AI forecasts on tech breakthroughs & geopolitical shifts</p>
      </div>

      {/* Technology Milestones - Main Liquid Container */}
      <div className="float glow p-1 rounded-[2.5rem] bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 shadow-2xl mb-6"
           style={{ '--glow': '55,138,221' } as React.CSSProperties}>
        
        <ChartCard title={`Technology milestones (${techMilestones.length})`} className="!bg-transparent !border-none !shadow-none">
          <div className="space-y-1">
            {techMilestones.map((m, i) => {
              const confColor = getConfidenceColor(m.confidence);
              const weeks = parseInt(m.val) * 52;
              
              return (
                <div 
                  key={m.label} 
                  className="flex gap-4 group press rounded-2xl p-3 transition-all duration-500 hover:bg-white/80 dark:hover:bg-slate-800/50 anim-cascade"
                  style={{ '--delay': `${i * 0.1}s` } as React.CSSProperties}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Animated Timeline Spine */}
                  <div className="flex flex-col items-center flex-shrink-0 w-6">
                    <div className="w-3.5 h-3.5 rounded-full border-4 border-white dark:border-slate-900 mt-2.5 flex-shrink-0 z-10 shadow-sm transition-transform group-hover:scale-125" 
                         style={{ background: m.color }} />
                    {i < techMilestones.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-slate-200 to-transparent dark:from-slate-700 mt-1 rounded-full" />
                    )}
                  </div>

                  {/* Content Block */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-[15px] text-slate-800 dark:text-slate-100 tracking-tight">{m.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            {m.category}
                          </span>
                          <span 
                            className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: confColor.bg, color: confColor.text }}
                          >
                            {m.confidence}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black tabular-nums transition-transform group-hover:translate-x-[-4px]" style={{ color: m.color }}>
                          {m.val}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          {weeks > 0 ? `${weeks.toLocaleString()} weeks` : 'Imminent'}
                        </p>
                      </div>
                    </div>

                    {/* Liquid Progress Bar - representing confidence */}
                    <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)]" 
                        style={{ 
                          width: m.progress + '%', 
                          background: `linear-gradient(90deg, ${m.color}CC, ${m.color})` 
                        }} 
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* Climate Chart Container */}
      <div className="float glow p-1 rounded-[2.5rem] bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 shadow-2xl mb-6"
           style={{ '--glow': '216,90,48' } as React.CSSProperties}>
        
        <ChartCard title="Climate — global temperature projection" className="!bg-transparent !border-none !shadow-none">
          <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5 px-1">
            <span className="flex items-center gap-2">
              <span className="w-4 h-0.5 inline-block bg-[#1D9E75] border-t-2 border-dashed border-[#1D9E75]"></span>
              1.5°C target
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-0.5 inline-block bg-[#D85A30]" style={{ boxShadow: '0 0 4px rgba(216,90,48,0.5)' }}></span>
              Current path
            </span>
          </div>
          <div style={{ height: 220 }} className="px-2">
            <canvas ref={climateRef} />
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3 opacity-60 italic text-center">
            ⚠️ Current trajectory exceeds 1.5°C target by ~2035
          </p>
        </ChartCard>
      </div>

      {/* Finance & Geopolitics - Second Liquid Container */}
      <div className="float glow p-1 rounded-[2.5rem] bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 shadow-2xl mb-6"
           style={{ '--glow': '163,45,45' } as React.CSSProperties}>
        
        <ChartCard title={`Finance & geopolitics (${financeMilestones.length})`} className="!bg-transparent !border-none !shadow-none">
          <div className="space-y-1">
            {financeMilestones.map((m, i) => {
              const confColor = getConfidenceColor(m.confidence);
              const weeks = parseInt(m.val) * 52;
              
              return (
                <div 
                  key={m.label} 
                  className="flex gap-4 group press rounded-2xl p-3 transition-all duration-500 hover:bg-white/80 dark:hover:bg-slate-800/50 anim-cascade"
                  style={{ '--delay': `${i * 0.1}s` } as React.CSSProperties}
                >
                  {/* Animated Timeline Spine */}
                  <div className="flex flex-col items-center flex-shrink-0 w-6">
                    <div className="w-3.5 h-3.5 rounded-full border-4 border-white dark:border-slate-900 mt-2.5 flex-shrink-0 z-10 shadow-sm transition-transform group-hover:scale-125" 
                         style={{ background: m.color }} />
                    {i < financeMilestones.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-slate-200 to-transparent dark:from-slate-700 mt-1 rounded-full" />
                    )}
                  </div>

                  {/* Content Block */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-[15px] text-slate-800 dark:text-slate-100 tracking-tight">{m.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            {m.category}
                          </span>
                          <span 
                            className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: confColor.bg, color: confColor.text }}
                          >
                            {m.confidence}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black tabular-nums transition-transform group-hover:translate-x-[-4px]" style={{ color: m.color }}>
                          {m.val}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          {weeks > 0 ? `${weeks.toLocaleString()} weeks` : 'Critical'}
                        </p>
                      </div>
                    </div>

                    {/* Liquid Progress Bar */}
                    <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)]" 
                        style={{ 
                          width: m.progress + '%', 
                          background: `linear-gradient(90deg, ${m.color}CC, ${m.color})` 
                        }} 
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-[#A32D2D]/5 to-[#BA7517]/5">
            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 text-center">
              📊 Sourced from Metaculus, Polymarket, IMF projections, and peer-reviewed research
            </p>
          </div>
          
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3 opacity-60 italic text-center">
            Not financial or political advice — predictions are probabilistic estimates
          </p>
        </ChartCard>
      </div>
    </div>
  );

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-[#378ADD] to-[#D85A30] bg-clip-text text-transparent uppercase italic">
            Global Forecast
          </h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI-Powered World Predictions</p>
        </div>
        <span className="text-[10px] font-black bg-gradient-to-r from-[#378ADD] to-[#1D9E75] text-white px-4 py-1.5 rounded-full shadow-[0_4px_12px_rgba(55,138,221,0.4)] uppercase tracking-tighter animate-pulse">
          Premium Access
        </span>
      </div>
      {isPremium ? content : <ProGate title="World predictions — Premium" desc="AI forecasts on tech breakthroughs, climate targets, financial crises, and geopolitical shifts — updated weekly.">{content}</ProGate>}
    </div>
  );
}
