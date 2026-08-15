// FILE: src/components/embeds/PayrollRunwayEmbed.tsx
'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

const GLOW = '255, 184, 0';
const RED = '255, 69, 58';

type Frequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

interface Bill { id: string; name: string; emoji: string; amount: number; offsetDays: number; }
const DEFAULT_BILLS: Bill[] = [
  { id: 'rent', name: 'Rent',          emoji: '🏠', amount: 1200, offsetDays: 3 },
  { id: 'util', name: 'Utilities',     emoji: '💡', amount: 150,  offsetDays: 9 },
  { id: 'subs', name: 'Subscriptions', emoji: '📺', amount: 40,   offsetDays: 6 },
];

function addPeriod(date: Date, freq: Frequency): Date {
  const d = new Date(date);
  if (freq === 'weekly') { d.setDate(d.getDate() + 7); return d; }
  if (freq === 'biweekly') { d.setDate(d.getDate() + 14); return d; }
  if (freq === 'semimonthly') {
    const day = d.getDate();
    if (day < 15) { d.setDate(15); } else { d.setMonth(d.getMonth() + 1, 1); }
    return d;
  }
  const targetDay = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(targetDay, daysInMonth));
  return d;
}

function nextPaydayFrom(lastPayDate: Date, freq: Frequency): { prev: Date; next: Date } {
  const now = new Date();
  let prev = new Date(lastPayDate);
  let cursor = new Date(lastPayDate);
  let guard = 0;
  while (addPeriod(cursor, freq).getTime() <= now.getTime() && guard < 500) {
    cursor = addPeriod(cursor, freq);
    prev = cursor;
    guard++;
  }
  return { prev, next: addPeriod(prev, freq) };
}

function formatMoney(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25)` };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #3a3a40', background: '#2a2a30', color: '#f2f2f2', colorScheme: 'dark' };

export function PayrollRunwayEmbed() {
  const [frequency, setFrequency] = useState<Frequency>('biweekly');
  const [lastPayDate, setLastPayDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10);
  });
  const [gross, setGross] = useState(2400);
  const [startingBalance, setStartingBalance] = useState(1500);
  const [bills, setBills] = useState<Bill[]>(DEFAULT_BILLS);
  const [now, setNow] = useState(() => Date.now());

  const runwayRef = useRef<HTMLDivElement>(null);
  const dragBillId = useRef<string | null>(null);
  const [, forceDragRender] = useState(0); // re-render on drag start for immediate cursor feedback

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { prev, next } = useMemo(() => nextPaydayFrom(new Date(lastPayDate + 'T09:00:00'), frequency), [lastPayDate, frequency, now]);
  const periodLengthDays = Math.max(1, daysBetween(prev, next));

  // Clamp bill offsets whenever the period length changes (e.g. switching frequency)
  useEffect(() => {
    setBills(prevBills => prevBills.map(b => ({ ...b, offsetDays: Math.min(b.offsetDays, periodLengthDays) })));
  }, [periodLengthDays]);

  const net = Math.max(0, gross * (1 - 0.18 - 0.06)); // 18% tax + 6% retirement, free-tier defaults

  const billsBefore = bills.filter(b => {
    const billDate = new Date(prev);
    billDate.setDate(billDate.getDate() + b.offsetDays);
    return billDate.getTime() > prev.getTime() && billDate.getTime() <= next.getTime();
  });
  const billsTotal = billsBefore.reduce((a, b) => a + b.amount, 0);
  const cashFloor = startingBalance - billsTotal;
  const health: 'clear' | 'tight' | 'danger' = cashFloor < 0 ? 'danger' : (cashFloor < net * 0.15 || billsTotal > net) ? 'tight' : 'clear';
  const healthColor = { clear: '52, 199, 89', tight: '255, 159, 10', danger: RED }[health];
  const healthLabel = { clear: '✅ Healthy cash flow', tight: '⚠️ Tight margins', danger: `🚨 Floor dips ${formatMoney(cashFloor)}` }[health];

  const msRemaining = Math.max(0, next.getTime() - now);
  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const periodElapsedDays = Math.min(periodLengthDays, Math.max(0, daysBetween(prev, new Date(now))));
  const periodProgressPct = Math.min(100, (periodElapsedDays / periodLengthDays) * 100);

  // ---- drag-to-reposition bill markers along the runway ----
  function startBillDrag(id: string) { dragBillId.current = id; forceDragRender(x => x + 1); }
  const handleRunwayMove = useCallback((clientX: number) => {
    if (!dragBillId.current || !runwayRef.current) return;
    const rect = runwayRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const offsetDays = Math.round(ratio * periodLengthDays);
    setBills(prevBills => prevBills.map(b => b.id === dragBillId.current ? { ...b, offsetDays: Math.max(0, Math.min(offsetDays, periodLengthDays)) } : b));
  }, [periodLengthDays]);

  useEffect(() => {
    function onMove(e: PointerEvent) { handleRunwayMove(e.clientX); }
    function onUp() { dragBillId.current = null; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [handleRunwayMove]);

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>PAYDAY RUNWAY</p>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Time until next payday</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[{ v: days, l: 'days' }, { v: hours, l: 'hrs' }, { v: minutes, l: 'min' }, { v: seconds, l: 'sec' }].map(u => (
          <div key={u.l} style={{ flex: 1, background: '#2a2a30', borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: `rgb(${GLOW})` }}>{u.v}</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>{u.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <label style={{ fontSize: 11, opacity: 0.7, display: 'block', marginBottom: 5 }}>Last payday</label>
          <input type="date" value={lastPayDate} onChange={e => setLastPayDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, opacity: 0.7, display: 'block', marginBottom: 5 }}>Frequency</label>
          <select value={frequency} onChange={e => setFrequency(e.target.value as Frequency)} style={inputStyle}>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="semimonthly">Semimonthly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 11, opacity: 0.7, display: 'block', marginBottom: 5 }}>Gross pay/period</label>
          <input type="number" value={gross} onChange={e => setGross(Number(e.target.value) || 0)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, opacity: 0.7, display: 'block', marginBottom: 5 }}>Starting balance</label>
          <input type="number" value={startingBalance} onChange={e => setStartingBalance(Number(e.target.value) || 0)} style={inputStyle} />
        </div>
      </div>

      <div style={{ background: '#2a2a30', borderRadius: 10, padding: 12, marginBottom: 14 }}>
        <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>ESTIMATED NET PAY</p>
        <p style={{ fontSize: 20, fontWeight: 700, color: `rgb(${GLOW})` }}>{formatMoney(net)}</p>
      </div>

      {/* Drag-to-reposition bill timeline */}
      <p style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>Drag a bill to when it's due this pay period</p>
      <div
        ref={runwayRef}
        style={{ position: 'relative', width: '100%', height: 40, borderRadius: 12, background: '#2a2a30', touchAction: 'none', marginBottom: 4 }}
      >
        <div style={{ position: 'absolute', top: 0, height: '100%', width: 2, left: `${periodProgressPct}%`, background: `rgb(${GLOW})`, boxShadow: `0 0 6px rgba(${GLOW}, 0.8)` }} />
        {bills.map(b => {
          const leftPct = (b.offsetDays / periodLengthDays) * 100;
          return (
            <div
              key={b.id}
              onPointerDown={() => startBillDrag(b.id)}
              title={`${b.name}: ${formatMoney(b.amount)}, day +${b.offsetDays}`}
              style={{
                position: 'absolute', top: '50%', left: `${leftPct}%`, width: 26, height: 26,
                transform: 'translate(-50%, -50%)', borderRadius: '50%',
                background: `rgb(${GLOW})`, border: '2px solid #1a1a1e', cursor: 'grab',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, touchAction: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}
            >
              {b.emoji}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, opacity: 0.5, marginBottom: 14 }}>
        <span>Payday</span><span>Today</span><span>Next payday</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {bills.map(b => (
          <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, background: '#2a2a30', borderRadius: 8, padding: '6px 10px' }}>
            <span>{b.emoji} {b.name} <span style={{ opacity: 0.5 }}>· day +{b.offsetDays}</span></span>
            <span style={{ opacity: 0.8 }}>{formatMoney(b.amount)}</span>
          </div>
        ))}
      </div>

      <div style={{ borderLeft: `3px solid rgb(${healthColor})`, background: `rgba(${healthColor}, 0.08)`, borderRadius: 8, padding: '10px 12px', fontSize: 12.5, marginBottom: 4 }}>
        {healthLabel}
      </div>

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 12, lineHeight: 1.4 }}>
        Example bills shown for preview — drag to see how timing shifts your cash floor. Not financial advice.
      </p>
    </div>
  );
}
