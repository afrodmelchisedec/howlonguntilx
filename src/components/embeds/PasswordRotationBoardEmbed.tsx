// FILE: src/components/embeds/PasswordRotationBoardEmbed.tsx
'use client';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

const GLOW = '46, 196, 182';

interface Account { id: string; name: string; emoji: string; color: string; sensitivity: number; daysAgo: number; }

type Band = 'fresh' | 'due' | 'overdue' | 'critical';
const BAND_COLOR: Record<Band, string> = {
  fresh: '52, 199, 89', due: '255, 204, 0', overdue: '255, 159, 10', critical: '255, 69, 58',
};

function recommendedInterval(sensitivity: number): number {
  return Math.round(365 - (sensitivity / 100) * 305);
}
function bandFor(ratio: number): Band {
  if (ratio < 0.5) return 'fresh';
  if (ratio < 1) return 'due';
  if (ratio < 2) return 'overdue';
  return 'critical';
}

const EXAMPLE_ACCOUNTS: Account[] = [
  { id: 'email', name: 'Primary Email', emoji: '📧', color: '100, 200, 255', sensitivity: 80, daysAgo: 200 },
  { id: 'bank', name: 'Online Banking', emoji: '🏦', color: '255, 159, 10', sensitivity: 95, daysAgo: 400 },
  { id: 'insta', name: 'Instagram', emoji: '📱', color: '196, 132, 252', sensitivity: 25, daysAgo: 20 },
];

const box: any = {
  background: '#1a1a1e',
  borderRadius: 16,
  maxWidth: 420,
  margin: '0 auto',
  padding: 24,
  boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)`,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: '#f2f2f7',
};

export function PasswordRotationBoardEmbed() {
  const [accounts, setAccounts] = useState<Account[]>(EXAMPLE_ACCOUNTS);
  const lineRef = useRef<HTMLDivElement>(null);
  const draggingId = useRef<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const handleLinePointerMove = useCallback((clientX: number) => {
    if (!draggingId.current || !lineRef.current) return;
    const rect = lineRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const pct = Math.round(ratio * 100);
    setAccounts(prev => prev.map(a => a.id === draggingId.current ? { ...a, sensitivity: pct } : a));
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) { if (draggingId.current) handleLinePointerMove(e.clientX); }
    function onUp() { draggingId.current = null; setActiveDragId(null); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [handleLinePointerMove]);

  function startDrag(id: string) { draggingId.current = id; setActiveDragId(id); }

  const computed = useMemo(() => accounts.map(a => {
    const interval = recommendedInterval(a.sensitivity);
    const ratio = a.daysAgo / interval;
    return { ...a, interval, ratio, band: bandFor(ratio) };
  }), [accounts]);

  const healthScore = useMemo(() => {
    if (computed.length === 0) return 100;
    const avgClamped = computed.reduce((sum, a) => sum + Math.min(a.ratio, 2), 0) / computed.length;
    return Math.round(100 * (1 - avgClamped / 2));
  }, [computed]);
  const ringColor = healthScore >= 70 ? '52, 199, 89' : healthScore >= 40 ? '255, 159, 10' : '255, 69, 58';
  const RING_R = 40;
  const CIRC = 2 * Math.PI * RING_R;
  const ringOffset = CIRC * (1 - healthScore / 100);

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: '0.08em', color: `rgb(${GLOW})`, marginBottom: 4 }}>ROTATION PRIORITY BOARD</p>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>Password Rotation Priority Board</h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <svg width={100} height={100} viewBox="0 0 100 100">
          <circle cx={50} cy={50} r={RING_R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={8} />
          <circle cx={50} cy={50} r={RING_R} fill="none" stroke={`rgb(${ringColor})`} strokeWidth={8}
            strokeDasharray={CIRC} strokeDashoffset={ringOffset} strokeLinecap="round" transform="rotate(-90 50 50)" />
          <text x={50} y={55} textAnchor="middle" fontSize="20" fontWeight="800" fill="#f2f2f7">{healthScore}</text>
        </svg>
        <div style={{ fontSize: 12, color: '#8e8e93' }}>
          Security health score based on how overdue each account is for rotation, weighted by sensitivity.
        </div>
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Drag each account by how sensitive it is</p>
      <div ref={lineRef} style={{
        position: 'relative', height: 12, borderRadius: 999, marginTop: 32, marginBottom: 12,
        background: 'linear-gradient(to right, rgba(88,214,113,0.35), rgba(255,204,0,0.35), rgba(255,159,10,0.35), rgba(255,69,58,0.35))',
        touchAction: 'none',
      }}>
        {computed.map(a => (
          <div
            key={a.id}
            onPointerDown={() => startDrag(a.id)}
            style={{
              position: 'absolute', top: '50%', left: `${a.sensitivity}%`, width: 32, height: 32,
              transform: 'translate(-50%, -50%)', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `rgb(${a.color})`, border: `3px solid rgb(${BAND_COLOR[a.band]})`, cursor: 'grab', touchAction: 'none',
              zIndex: activeDragId === a.id ? 20 : 10,
              transition: activeDragId === a.id ? 'none' : 'left 0.15s ease-out',
            }}
            title={a.name}
          >
            <span style={{ fontSize: 14 }}>{a.emoji}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6e6e73', marginBottom: 18 }}>
        <span>← Low sensitivity</span><span>High sensitivity →</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {computed.sort((a, b) => b.ratio - a.ratio).map(a => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, background: '#0a0e14', borderRadius: 10, padding: '8px 10px' }}>
            <span>{a.emoji} {a.name}</span>
            <span style={{ color: `rgb(${BAND_COLOR[a.band]})`, fontWeight: 600 }}>
              {a.band === 'fresh' ? '✅ Fresh' : a.band === 'due' ? '🟡 Due soon' : a.band === 'overdue' ? '🟠 Overdue' : '🚨 Critical'}
            </span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, fontStyle: 'italic', color: '#6e6e73', margin: '16px 0 0' }}>
        Example accounts shown for preview — drag any chip along the line to see its rotation urgency update live.
      </p>
    </div>
  );
}
