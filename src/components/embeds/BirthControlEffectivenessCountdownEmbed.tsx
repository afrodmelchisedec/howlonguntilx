// FILE: src/components/embeds/BirthControlEffectivenessCountdownEmbed.tsx
'use client';
import { useState } from 'react';

const GLOW = '150, 111, 255';

type Method = 'PILL_COMBINED' | 'PATCH' | 'RING' | 'IUD_HORMONAL' | 'CONDOM';
const METHODS: Record<Method, { label: string; emoji: string; daysToEffective: number }> = {
  PILL_COMBINED: { label: 'Combined Pill', emoji: '💊', daysToEffective: 7 },
  PATCH:         { label: 'Patch',         emoji: '🩹', daysToEffective: 7 },
  RING:          { label: 'Ring',          emoji: '⭕', daysToEffective: 7 },
  IUD_HORMONAL:  { label: 'Hormonal IUD',  emoji: '🌀', daysToEffective: 7 },
  CONDOM:        { label: 'Condom',        emoji: '🛡️', daysToEffective: 0 },
};

const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25)` };

export function BirthControlEffectivenessCountdownEmbed() {
  const [method, setMethod] = useState<Method>('PILL_COMBINED');
  const [startDate, setStartDate] = useState('');
  const [cycleDayAtStart, setCycleDayAtStart] = useState(1);

  const info = METHODS[method];
  const immediate = cycleDayAtStart <= 5;
  const days = immediate ? 0 : info.daysToEffective;
  const percent = startDate
    ? Math.max(0, Math.min(100, ((Date.now() - new Date(startDate + 'T00:00:00').getTime()) / (days * 86400000 || 1)) * 100))
    : 0;

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>BIRTH CONTROL COVERAGE</p>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Effectiveness countdown</p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {(Object.keys(METHODS) as Method[]).map(m => (
          <button key={m} onClick={() => setMethod(m)}
            style={{ fontSize: 11, padding: '6px 10px', borderRadius: 8, border: `1px solid ${method === m ? `rgb(${GLOW})` : '#3a3a40'}`, background: '#2a2a30', color: '#f2f2f2', cursor: 'pointer' }}>
            {METHODS[m].emoji} {METHODS[m].label}
          </button>
        ))}
      </div>

      <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 6 }}>Start date</label>
      <input type="date" value={startDate} max={new Date().toISOString().slice(0, 10)}
        onChange={e => setStartDate(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #3a3a40', background: '#2a2a30', color: '#f2f2f2', colorScheme: 'dark', marginBottom: 12 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <label style={{ fontSize: 12, opacity: 0.7 }}>Cycle day you started</label>
        <span style={{ fontSize: 12, color: `rgb(${GLOW})` }}>Day {cycleDayAtStart}</span>
      </div>
      <input type="range" min={1} max={28} value={cycleDayAtStart} onChange={e => setCycleDayAtStart(Number(e.target.value))}
        style={{ width: '100%', accentColor: `rgb(${GLOW})`, marginBottom: 16 }} />

      {startDate && (
        <>
          <div style={{ width: '100%', height: 10, borderRadius: 6, background: '#2a2a30', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${percent}%`, height: '100%', background: `rgb(${GLOW})`, transition: 'width 0.3s' }} />
          </div>
          <p style={{ fontSize: 12, opacity: 0.75 }}>{percent >= 100 ? 'Typically fully effective as of today.' : `${Math.round(percent)}% toward typical full effectiveness.`}</p>
        </>
      )}

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 14, lineHeight: 1.4 }}>
        General, typical windows only — follow your prescription's instructions and your provider's guidance.
      </p>
    </div>
  );
}
