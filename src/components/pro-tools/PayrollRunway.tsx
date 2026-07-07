// FILE: src/components/pro-tools/PayrollRunway.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { PAYROLL_COMMENTS } from './payrollComments';

type Frequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

interface Deductions {
  taxPct: number;
  retirementPct: number;
  insuranceFlat: number;
  otherFlat: number;
}
interface Bill {
  id: string;
  name: string;
  typeKey: string;
  amount: number;
  offsetDays: number; // days after each payday, recurring every period
}

const GLOW = '255, 184, 0';
const RED = '255, 69, 58';
const NET_COLOR = GLOW;
const TAX_COLOR = '255, 107, 107';
const RET_COLOR = '100, 200, 255';
const INS_COLOR = '196, 132, 252';
const OTHER_COLOR = '160, 160, 170';

const FREE_MAX_BILLS = 3;
const PRO_MAX_BILLS = 12;
const FREE_PERIODS_AHEAD = 1;
const PRO_PERIODS_AHEAD = 4;
const DISPLAY_CHIPS = 4;

const BILL_TYPES = [
  { key: 'rent',          name: 'Rent/Mortgage', emoji: '🏠', color: '255, 107, 107' },
  { key: 'utilities',     name: 'Utilities',     emoji: '💡', color: '255, 159, 10' },
  { key: 'car',           name: 'Car',           emoji: '🚗', color: '100, 200, 255' },
  { key: 'subscriptions', name: 'Subscriptions', emoji: '📺', color: '196, 132, 252' },
  { key: 'credit',        name: 'Credit Card',   emoji: '💳', color: '255, 122, 165' },
  { key: 'other',         name: 'Other',         emoji: '🧾', color: '160, 160, 170' },
];
function billTypeOf(key: string) {
  return BILL_TYPES.find(t => t.key === key) ?? BILL_TYPES[BILL_TYPES.length - 1];
}
function nextBillType(key: string): string {
  const idx = BILL_TYPES.findIndex(t => t.key === key);
  return BILL_TYPES[(idx + 1) % BILL_TYPES.length].key;
}

function defaultLastPayDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(9, 0, 0, 0);
  return d;
}
const DEFAULT_FREQUENCY: Frequency = 'biweekly';
const DEFAULT_GROSS = 2400;
const DEFAULT_STARTING_BALANCE = 1500;
const DEFAULT_DEDUCTIONS: Deductions = { taxPct: 18, retirementPct: 6, insuranceFlat: 45, otherFlat: 0 };
const DEFAULT_BILLS: Bill[] = [
  { id: 'bill-rent',    name: 'Rent',          typeKey: 'rent',          amount: 1200, offsetDays: 3 },
  { id: 'bill-util',    name: 'Utilities',     typeKey: 'utilities',     amount: 150,  offsetDays: 9 },
  { id: 'bill-subs',    name: 'Subscriptions', typeKey: 'subscriptions', amount: 40,   offsetDays: 6 },
];

function formatMoney(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`;
}
function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function addPeriod(date: Date, freq: Frequency): Date {
  const d = new Date(date);
  if (freq === 'weekly') { d.setDate(d.getDate() + 7); return d; }
  if (freq === 'biweekly') { d.setDate(d.getDate() + 14); return d; }
  if (freq === 'semimonthly') {
    const day = d.getDate();
    if (day < 15) { d.setDate(15); } else { d.setMonth(d.getMonth() + 1, 1); }
    return d;
  }
  // monthly — clamp to end-of-month safely
  const targetDay = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(targetDay, daysInMonth));
  return d;
}

function generatePaydays(lastPayDate: Date, freq: Frequency, aheadCount: number): Date[] {
  const now = new Date();
  let prev = new Date(lastPayDate);
  let cursor = new Date(lastPayDate);
  // walk forward to the most recent payday at/before now
  let guard = 0;
  while (addPeriod(cursor, freq).getTime() <= now.getTime() && guard < 500) {
    cursor = addPeriod(cursor, freq);
    prev = cursor;
    guard++;
  }
  const paydays: Date[] = [prev];
  let next = addPeriod(prev, freq);
  for (let i = 0; i < aheadCount; i++) {
    paydays.push(next);
    next = addPeriod(next, freq);
  }
  return paydays;
}

function computeNet(gross: number, d: Deductions, isPro: boolean) {
  const insurance = isPro ? d.insuranceFlat : 0;
  const other = isPro ? d.otherFlat : 0;
  const taxAmt = gross * (d.taxPct / 100);
  const retAmt = gross * (d.retirementPct / 100);
  const net = Math.max(0, gross - taxAmt - retAmt - insurance - other);
  return { net, taxAmt, retAmt, insurance, other };
}

interface FlowEvent { date: Date; label: string; amount: number; kind: 'payday' | 'bill'; color: string }

function buildEvents(paydays: Date[], bills: Bill[], net: number): FlowEvent[] {
  const events: FlowEvent[] = [];
  for (let i = 1; i < paydays.length; i++) {
    events.push({ date: paydays[i], label: 'Payday', amount: net, kind: 'payday', color: GLOW });
    for (const bill of bills) {
      const billDate = new Date(paydays[i - 1]);
      billDate.setDate(billDate.getDate() + bill.offsetDays);
      if (billDate.getTime() > paydays[i - 1].getTime() && billDate.getTime() <= paydays[i].getTime()) {
        events.push({ date: billDate, label: bill.name, amount: -bill.amount, kind: 'bill', color: billTypeOf(bill.typeKey).color });
      }
    }
  }
  return events.filter(e => e.date.getTime() > Date.now()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ---- inline editable dollar amount ----
function EditableAmount({ value, onCommit, colorRgb, disabled }: { value: number; onCommit: (v: number) => void; colorRgb: string; disabled?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select(); } }, [editing]);

  function commit() {
    const parsed = Math.max(0, Math.round(Number(draft.replace(/[^0-9.]/g, '')) || 0));
    onCommit(parsed);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); } }}
        inputMode="decimal"
        className="text-footnote font-bold bg-transparent outline-none border-b tabular"
        style={{ color: `rgb(${colorRgb})`, borderColor: `rgb(${colorRgb})`, width: `${Math.max(String(value).length + 2, 6)}ch` }}
      />
    );
  }

  return (
    <button
      onClick={() => { if (disabled) return; setDraft(String(value)); setEditing(true); }}
      disabled={disabled}
      className="text-footnote font-bold press underline decoration-dotted underline-offset-2 tabular disabled:no-underline disabled:opacity-60"
      title={disabled ? 'Upgrade to Pro to edit' : 'Click to edit'}
    >
      {formatMoney(value)}
    </button>
  );
}

// ---- inline editable name ----
function EditableName({ value, onCommit, colorRgb }: { value: string; onCommit: (v: string) => void; colorRgb: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select(); } }, [editing]);
  function commit() { const t = draft.trim(); onCommit(t.length > 0 ? t : value); setEditing(false); }
  if (editing) {
    return (
      <input
        ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className="text-footnote font-bold bg-transparent outline-none border-b"
        style={{ color: `rgb(${colorRgb})`, borderColor: `rgb(${colorRgb})`, width: `${Math.max(draft.length, 5)}ch` }}
      />
    );
  }
  return (
    <button onClick={() => { setDraft(value); setEditing(true); }} className="text-footnote font-bold press underline decoration-dotted underline-offset-2" title="Click to rename">
      {value}
    </button>
  );
}

// ---- reusable drag slider (percent) ----
function DragSlider({ value, onChange, min = 0, max = 40, step = 1, colorRgb, label, suffix = '%', disabled }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; colorRgb: string; label: string; suffix?: string; disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleMove = useCallback((clientX: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    const snapped = Math.round(raw / step) * step;
    onChange(Math.min(max, Math.max(min, Math.round(snapped * 10) / 10)));
  }, [min, max, step, onChange]);

  useEffect(() => {
    if (!dragging) return;
    function onMove(e: PointerEvent) { handleMove(e.clientX); }
    function onUp() { setDragging(false); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [dragging, handleMove]);

  const ratio = (value - min) / (max - min);

  return (
    <div style={{ opacity: disabled ? 0.5 : 1 }}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-footnote font-semibold">{label}</p>
        <p className="text-footnote font-bold tabular" style={{ color: `rgb(${colorRgb})` }}>{value}{suffix}</p>
      </div>
      <div ref={ref} className="relative h-2.5 rounded-full" style={{ background: 'var(--border-hairline)', touchAction: 'none' }}>
        <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-100" style={{ width: `${ratio * 100}%`, background: `rgb(${colorRgb})` }} />
        <div
          onPointerDown={() => !disabled && setDragging(true)}
          className="absolute top-1/2 rounded-full"
          style={{ left: `${ratio * 100}%`, width: 18, height: 18, transform: 'translate(-50%, -50%)', background: 'white', border: `3px solid rgb(${colorRgb})`, cursor: disabled ? 'not-allowed' : 'grab', touchAction: 'none' }}
        />
      </div>
    </div>
  );
}

// ---- flip-style digit unit ----
function FlipUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div key={value} className="ios-card-nested anim-fade-up flex items-center justify-center tabular font-bold"
        style={{ width: 52, height: 52, fontSize: 20, color: `rgb(${GLOW})` }}>
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-caption">{label}</span>
    </div>
  );
}

export function PayrollRunway() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const maxBills = isPro ? PRO_MAX_BILLS : FREE_MAX_BILLS;
  const periodsAhead = isPro ? PRO_PERIODS_AHEAD : FREE_PERIODS_AHEAD;

  const [frequency, setFrequency] = useState<Frequency>(DEFAULT_FREQUENCY);
  const [lastPayDate, setLastPayDate] = useState<Date>(defaultLastPayDate());
  const [gross, setGross] = useState(DEFAULT_GROSS);
  const [startingBalance, setStartingBalance] = useState(DEFAULT_STARTING_BALANCE);
  const [deductions, setDeductions] = useState<Deductions>(DEFAULT_DEDUCTIONS);
  const [bills, setBills] = useState<Bill[]>(DEFAULT_BILLS);
  const [raisePct, setRaisePct] = useState(3);
  const [pulse, setPulse] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(33);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const runwayRef = useRef<HTMLDivElement>(null);
  const dragBillId = useRef<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load saved config for Pro users on mount
  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/payroll-runway')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setFrequency(data.config.frequency);
          setLastPayDate(new Date(data.config.lastPayDate));
          setGross(data.config.grossPerPeriod);
          setStartingBalance(data.config.startingBalance);
          setDeductions(data.config.deductions);
          if (Array.isArray(data.config.bills)) setBills(data.config.bills.slice(0, PRO_MAX_BILLS));
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const paydaysDisplay = useMemo(() => generatePaydays(lastPayDate, frequency, DISPLAY_CHIPS), [lastPayDate, frequency, nowTick]);
  const paydaysProjection = useMemo(() => paydaysDisplay.slice(0, periodsAhead + 1), [paydaysDisplay, periodsAhead]);
  const prevPayday = paydaysDisplay[0];
  const nextPayday = paydaysDisplay[1];
  const periodLengthDays = Math.max(1, daysBetween(prevPayday, nextPayday));

  const { net, taxAmt, retAmt, insurance, other } = useMemo(() => computeNet(gross, deductions, isPro), [gross, deductions, isPro]);

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 200);
    return () => clearTimeout(t);
  }, [net]);

  const msRemaining = Math.max(0, nextPayday.getTime() - nowTick);
  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const periodElapsedDays = Math.min(periodLengthDays, Math.max(0, daysBetween(prevPayday, new Date(nowTick))));
  const periodProgressPct = Math.min(100, (periodElapsedDays / periodLengthDays) * 100);

  const events = useMemo(() => buildEvents(paydaysProjection, bills, net), [paydaysProjection, bills, net]);

  const chartPoints = useMemo(() => {
    const pts: { x: number; y: number }[] = [{ x: nowTick, y: startingBalance }];
    let bal = startingBalance;
    for (const e of events) {
      pts.push({ x: e.date.getTime(), y: bal });
      bal += e.amount;
      pts.push({ x: e.date.getTime(), y: bal });
    }
    return pts;
  }, [events, startingBalance, nowTick]);

  const cashFloor = useMemo(() => Math.min(startingBalance, ...chartPoints.map(p => p.y)), [chartPoints, startingBalance]);

  const billsBeforePayday = useMemo(() => {
    const upcoming = events.filter(e => e.kind === 'bill' && e.date.getTime() <= nextPayday.getTime());
    return { count: upcoming.length, total: upcoming.reduce((a, e) => a + Math.abs(e.amount), 0) };
  }, [events, nextPayday]);

  const overBudget = billsBeforePayday.total > net;
  const health: 'clear' | 'tight' | 'danger' = cashFloor < 0 ? 'danger' : (cashFloor < net * 0.15 || overBudget) ? 'tight' : 'clear';
  const healthLabel = {
    clear: '✅ Healthy cash flow',
    tight: '⚠️ Tight margins',
    danger: `🚨 Floor dips ${formatMoney(cashFloor)}`,
  }[health];
  const healthColor = { clear: '52, 199, 89', tight: '255, 159, 10', danger: RED }[health];

  const atFreeBillLimit = !isPro && bills.length >= FREE_MAX_BILLS;

  // ---- bill runway drag ----
  function startBillDrag(id: string) { dragBillId.current = id; }
  const handleRunwayMove = useCallback((clientX: number) => {
    if (!dragBillId.current || !runwayRef.current) return;
    const rect = runwayRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const offsetDays = Math.round(ratio * periodLengthDays);
    setBills(prev => prev.map(b => b.id === dragBillId.current ? { ...b, offsetDays: Math.max(0, Math.min(offsetDays, periodLengthDays)) } : b));
  }, [periodLengthDays]);

  useEffect(() => {
    function onMove(e: PointerEvent) { handleRunwayMove(e.clientX); }
    function onUp() { dragBillId.current = null; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [handleRunwayMove]);

  function addBill() {
    if (bills.length >= maxBills) {
      showToast(isPro ? `You can have up to ${maxBills} bills` : 'Upgrade to Pro to add more bills', isPro ? '⚠️' : '⭐');
      return;
    }
    setBills(prev => [...prev, {
      id: `bill-${Date.now()}`,
      name: 'New Bill',
      typeKey: 'other',
      amount: 50,
      offsetDays: Math.round(periodLengthDays / 2),
    }]);
  }
  function removeBill(id: string) { setBills(prev => prev.filter(b => b.id !== id)); }
  function renameBill(id: string, name: string) { setBills(prev => prev.map(b => b.id === id ? { ...b, name } : b)); }
  function cycleBillType(id: string) { setBills(prev => prev.map(b => b.id === id ? { ...b, typeKey: nextBillType(b.typeKey) } : b)); }
  function updateBillAmount(id: string, amount: number) { setBills(prev => prev.map(b => b.id === id ? { ...b, amount } : b)); }

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save your setup', '⭐'); return; }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/tools/payroll-runway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency, lastPayDate: lastPayDate.toISOString(), grossPerPeriod: gross, startingBalance, deductions, bills }),
      });
      if (!res.ok) throw new Error('save failed');
      showToast('Setup saved!', '💾');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSavingConfig(false);
    }
  }

  function handleReset() {
    setFrequency(DEFAULT_FREQUENCY);
    setLastPayDate(defaultLastPayDate());
    setGross(DEFAULT_GROSS);
    setStartingBalance(DEFAULT_STARTING_BALANCE);
    setDeductions(DEFAULT_DEDUCTIONS);
    setBills(DEFAULT_BILLS);
    setRaisePct(3);
    showToast('Reset to defaults', '↺');
  }

  function requireAuth() { showToast('You need to sign up first', '🔒'); }
  function handleLike() {
    if (!session) { requireAuth(); return; }
    setToolLiked(prev => { setToolLikeCount(c => prev ? c - 1 : c + 1); return !prev; });
  }
  function handleShare() {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => showToast('Link copied!', '🔗')).catch(() => showToast('Could not copy link', '⚠️'));
  }
  function handleCopyPlan() {
    const lines = [
      `Next payday: ${formatDate(nextPayday)} (${days}d ${hours}h away)`,
      `Net pay this period: ${formatMoney(net)}`,
      `Cash floor: ${formatMoney(cashFloor)}`,
      `Bills before payday: ${billsBeforePayday.count} (${formatMoney(billsBeforePayday.total)})`,
      '',
      'Bills:',
      ...bills.map(b => `- ${billTypeOf(b.typeKey).emoji} ${b.name}: ${formatMoney(b.amount)}, day +${b.offsetDays}`),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Plan copied!', '📋')).catch(() => showToast('Could not copy', '⚠️'));
  }
  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- raise simulator (Pro) ----
  const raisedGross = gross * (1 + raisePct / 100);
  const raisedNetCalc = computeNet(raisedGross, deductions, isPro);
  const raisedNet = raisedNetCalc.net;
  const netDelta = raisedNet - net;
  const raisedCashFloor = cashFloor + netDelta * periodsAhead;

  // ---- chart geometry ----
  const CHART_W = 400, CHART_H = 140;
  const chart = useMemo(() => {
    const ys = chartPoints.map(p => p.y);
    const minY = Math.min(0, ...ys) - 40;
    const maxY = Math.max(...ys, startingBalance) + 40;
    const xs = chartPoints.map(p => p.x);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const scaleX = (x: number) => (maxX === minX ? 0 : ((x - minX) / (maxX - minX)) * CHART_W);
    const scaleY = (y: number) => CHART_H - ((y - minY) / (maxY - minY)) * CHART_H;
    let lineD = `M ${scaleX(chartPoints[0].x)} ${scaleY(chartPoints[0].y)}`;
    for (let i = 1; i < chartPoints.length; i++) lineD += ` L ${scaleX(chartPoints[i].x)} ${scaleY(chartPoints[i].y)}`;
    const areaD = `${lineD} L ${scaleX(chartPoints[chartPoints.length - 1].x)} ${CHART_H} L ${scaleX(chartPoints[0].x)} ${CHART_H} Z`;
    const zeroY = scaleY(0);
    const zeroOffsetPct = Math.min(100, Math.max(0, (zeroY / CHART_H) * 100));
    return { lineD, areaD, scaleX, scaleY, zeroY, zeroOffsetPct, minX, maxX };
  }, [chartPoints, startingBalance]);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>SALARY & PAYROLL EVENTS</p>
            <h2 className="text-title2">Payday Runway</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>↺ Reset</button>
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? 'Save this setup to your account' : 'Upgrade to save your setup'}
            >
              {isPro ? '💾' : '🔒'} {savingConfig ? 'Saving…' : 'Save'}
            </button>
            <div className="pill press transition-all duration-500" style={{ background: `rgba(${healthColor}, 0.15)`, color: `rgb(${healthColor})` }}>
              {healthLabel}
            </div>
          </div>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            { label: 'Net pay / period', value: formatMoney(net) },
            { label: 'Days to payday', value: String(days) },
            { label: 'Cash floor', value: formatMoney(cashFloor), color: cashFloor < 0 ? RED : GLOW },
            { label: 'Bills before payday', value: `${billsBeforePayday.count} · ${formatMoney(billsBeforePayday.total)}` },
          ].map(stat => (
            <div key={stat.label} className="ios-card-nested p-3 text-center">
              <div className="text-title3 tabular transition-transform duration-200"
                style={{ transform: pulse ? 'scale(1.08)' : 'scale(1)', color: `rgb(${stat.color ?? GLOW})` }}>
                {stat.value}
              </div>
              <div className="text-caption mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Flip countdown hero */}
        <div className="mb-2">
          <p className="text-footnote font-semibold text-center mb-3">Next payday: {formatDate(nextPayday)}</p>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 flex-wrap">
            <FlipUnit value={days} label="days" />
            <span className="text-title2" style={{ color: 'var(--text-tertiary)' }}>:</span>
            <FlipUnit value={hours} label="hrs" />
            <span className="text-title2" style={{ color: 'var(--text-tertiary)' }}>:</span>
            <FlipUnit value={minutes} label="min" />
            <span className="text-title2" style={{ color: 'var(--text-tertiary)' }}>:</span>
            <FlipUnit value={seconds} label="sec" />
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mb-7" style={{ background: 'var(--border-hairline)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${periodProgressPct}%`, background: `rgb(${GLOW})`, boxShadow: `0 0 8px rgba(${GLOW}, 0.5)` }} />
          </div>
        </div>

        {/* Pay cycle setup */}
        <div className="ios-card-nested p-4 mb-6">
          <p className="text-footnote font-semibold mb-3">Pay cycle</p>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['weekly', 'biweekly', 'semimonthly', 'monthly'] as Frequency[]).map(f => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className="press px-3 py-1.5 rounded-full text-xs font-semibold capitalize"
                style={{
                  background: frequency === f ? `rgb(${GLOW})` : 'var(--bg-base)',
                  color: frequency === f ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border-hairline)',
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <label className="flex items-center gap-2 text-footnote">
              <span style={{ color: 'var(--text-secondary)' }}>Last pay date</span>
              <input
                type="date"
                value={lastPayDate.toISOString().slice(0, 10)}
                onChange={e => { const d = new Date(e.target.value); d.setHours(9, 0, 0, 0); setLastPayDate(d); }}
                className="rounded-xl px-2 py-1.5 text-footnote bg-transparent outline-none tabular"
                style={{ border: '1px solid var(--border-hairline)' }}
              />
            </label>
            <div className="flex items-center gap-2 text-footnote">
              <span style={{ color: 'var(--text-secondary)' }}>Gross / period</span>
              <EditableAmount value={gross} onCommit={setGross} colorRgb={GLOW} />
            </div>
            <div className="flex items-center gap-2 text-footnote">
              <span style={{ color: 'var(--text-secondary)' }}>Current balance</span>
              <EditableAmount value={startingBalance} onCommit={setStartingBalance} colorRgb={GLOW} />
            </div>
          </div>
        </div>

        {/* Upcoming paydays chip strip */}
        <div className="mb-6">
          <p className="text-footnote font-semibold mb-2">Upcoming paydays</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {paydaysDisplay.slice(1).map((pd, i) => {
              const locked = i >= periodsAhead;
              return (
                <div key={i} className="ios-card-nested px-3 py-2 flex flex-col items-center flex-shrink-0" style={{ minWidth: 100, opacity: locked ? 0.55 : 1 }}>
                  <span className="text-caption font-bold">{locked ? '🔒' : `+${i + 1}`}</span>
                  <span className="text-footnote font-semibold whitespace-nowrap">{formatDate(pd)}</span>
                  <span className="text-caption tabular" style={{ color: `rgb(${GLOW})` }}>{locked ? 'Pro' : formatMoney(net)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deductions */}
        <div className="ios-card-nested p-4 mb-3 flex flex-col gap-4">
          <p className="text-footnote font-semibold">Deductions</p>
          <DragSlider value={deductions.taxPct} onChange={v => setDeductions(d => ({ ...d, taxPct: v }))} min={0} max={45} step={1} colorRgb={TAX_COLOR} label="Tax rate" />
          <DragSlider value={deductions.retirementPct} onChange={v => setDeductions(d => ({ ...d, retirementPct: v }))} min={0} max={25} step={1} colorRgb={RET_COLOR} label="Retirement contribution" />
          <div className="flex items-center justify-between">
            <p className="text-footnote font-semibold">Insurance / period {!isPro && '🔒'}</p>
            <EditableAmount value={isPro ? deductions.insuranceFlat : 0} onCommit={v => setDeductions(d => ({ ...d, insuranceFlat: v }))} colorRgb={INS_COLOR} disabled={!isPro} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-footnote font-semibold">Other deduction {!isPro && '🔒'}</p>
            <EditableAmount value={isPro ? deductions.otherFlat : 0} onCommit={v => setDeductions(d => ({ ...d, otherFlat: v }))} colorRgb={OTHER_COLOR} disabled={!isPro} />
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="mb-7">
          <div className="w-full h-8 rounded-xl overflow-hidden flex" style={{ border: '1px solid var(--border-hairline)' }}>
            {[
              { amt: net, color: NET_COLOR },
              { amt: taxAmt, color: TAX_COLOR },
              { amt: retAmt, color: RET_COLOR },
              { amt: insurance, color: INS_COLOR },
              { amt: other, color: OTHER_COLOR },
            ].filter(seg => seg.amt > 0).map((seg, i) => (
              <div key={i} className="h-full transition-all duration-500" style={{ width: `${(seg.amt / gross) * 100}%`, background: `rgb(${seg.color})` }} />
            ))}
          </div>
          <div className="flex items-center gap-4 mt-2 flex-wrap text-caption">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: `rgb(${NET_COLOR})` }} /> Net {formatMoney(net)}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: `rgb(${TAX_COLOR})` }} /> Tax {formatMoney(taxAmt)}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: `rgb(${RET_COLOR})` }} /> Retirement {formatMoney(retAmt)}</span>
            {isPro && insurance > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: `rgb(${INS_COLOR})` }} /> Insurance {formatMoney(insurance)}</span>}
            {isPro && other > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: `rgb(${OTHER_COLOR})` }} /> Other {formatMoney(other)}</span>}
          </div>
        </div>

        {/* Bill runway (current period) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Drag bills across the current pay period</p>
            <p className="text-caption">{formatDate(prevPayday)} → {formatDate(nextPayday)}</p>
          </div>
          <div ref={runwayRef} className="relative w-full rounded-2xl select-none" style={{ height: 56, background: 'var(--border-hairline)', touchAction: 'none' }}>
            <div className="absolute top-0 h-full z-10" style={{ left: `${periodProgressPct}%`, width: 2, background: `rgb(${GLOW})`, boxShadow: `0 0 6px rgba(${GLOW}, 0.8)` }} />
            {bills.map(b => {
              const t = billTypeOf(b.typeKey);
              const leftPct = (b.offsetDays / periodLengthDays) * 100;
              return (
                <div
                  key={b.id}
                  onPointerDown={() => startBillDrag(b.id)}
                  className="absolute top-1/2 rounded-full flex items-center justify-center cursor-grab z-20"
                  style={{ left: `${leftPct}%`, width: 30, height: 30, transform: 'translate(-50%, -50%)', background: `rgba(${t.color}, 0.9)`, border: '2px solid white', touchAction: 'none', boxShadow: `0 2px 6px rgba(0,0,0,0.25)` }}
                  title={`${b.name}: ${formatMoney(b.amount)}, day +${b.offsetDays}`}
                >
                  <span style={{ fontSize: 13 }}>{t.emoji}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-caption">Payday</span>
            <span className="text-caption">Today</span>
            <span className="text-caption">Next payday</span>
          </div>
        </div>

        {/* Bill cards */}
        <div className="flex flex-col gap-2 mb-4">
          {bills.map(b => {
            const t = billTypeOf(b.typeKey);
            return (
              <div key={b.id} className="ios-card-nested p-3 flex items-center justify-between gap-3 flex-wrap" style={{ borderLeft: `3px solid rgb(${t.color})` }}>
                <div className="flex items-center gap-2">
                  <button onClick={() => cycleBillType(b.id)} className="text-lg press" title="Click to change type">{t.emoji}</button>
                  <EditableName value={b.name} onCommit={v => renameBill(b.id, v)} colorRgb={t.color} />
                  <span className="text-caption">day +{b.offsetDays}</span>
                </div>
                <div className="flex items-center gap-3">
                  <EditableAmount value={b.amount} onCommit={v => updateBillAmount(b.id, v)} colorRgb={t.color} />
                  <button onClick={() => removeBill(b.id)} className="press text-caption" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-7">
          <button
            onClick={addBill}
            className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5"
            style={{ color: bills.length < maxBills ? 'var(--text-secondary)' : 'var(--text-tertiary)', opacity: bills.length >= maxBills ? 0.6 : 1 }}
          >
            {atFreeLimit(bills.length, isPro, FREE_MAX_BILLS) ? '🔒' : '+'} Add bill
          </button>
          <button onClick={handleCopyPlan} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>📋 Copy plan</button>
        </div>

        {/* Cash-flow runway chart */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Cash-flow runway</p>
            <p className="text-caption">{isPro ? `${PRO_PERIODS_AHEAD} periods ahead` : 'current period only'}</p>
          </div>
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" height={CHART_H} preserveAspectRatio="none">
            <defs>
              <linearGradient id="payrollAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={`rgb(${GLOW})`} stopOpacity="0.35" />
                <stop offset={`${chart.zeroOffsetPct}%`} stopColor={`rgb(${GLOW})`} stopOpacity="0.1" />
                <stop offset={`${chart.zeroOffsetPct}%`} stopColor={`rgb(${RED})`} stopOpacity="0.25" />
                <stop offset="100%" stopColor={`rgb(${RED})`} stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <line x1={0} y1={chart.zeroY} x2={CHART_W} y2={chart.zeroY} stroke="var(--text-tertiary)" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
            <path d={chart.areaD} fill="url(#payrollAreaGradient)" />
            <path d={chart.lineD} fill="none" stroke={cashFloor < 0 ? `rgb(${RED})` : `rgb(${GLOW})`} strokeWidth={2.5} strokeLinejoin="round" />
            {events.map((e, i) => (
              <circle key={i} cx={chart.scaleX(e.date.getTime())} cy={chart.scaleY(e.kind === 'payday' ? chartPoints.find(p => p.x === e.date.getTime())?.y ?? 0 : chartPoints.find(p => p.x === e.date.getTime())?.y ?? 0)} r={3.5} fill={`rgb(${e.color})`} />
            ))}
          </svg>
        </div>

        {/* Overcommit / danger banner */}
        {health !== 'clear' && (
          <div className="ios-card-nested p-4 mb-6 flex gap-3 items-start" style={{ borderLeft: `3px solid rgb(${healthColor})` }}>
            <span className="text-lg flex-shrink-0">{health === 'danger' ? '🚨' : '⚠️'}</span>
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
              {health === 'danger'
                ? <>Your projected balance dips to <strong>{formatMoney(cashFloor)}</strong> before your next payday. Consider moving a bill later or trimming a deduction.</>
                : <>Your bills before payday total <strong>{formatMoney(billsBeforePayday.total)}</strong> — close to your <strong>{formatMoney(net)}</strong> net pay. Little room for anything unexpected.</>}
            </p>
          </div>
        )}

        {/* Raise Simulator (Pro) */}
        <div className="ios-card-nested p-4 mb-6" style={{ opacity: isPro ? 1 : 0.6 }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-footnote font-semibold">✨ Raise Simulator {!isPro && '🔒'}</p>
            {!isPro && <span className="text-caption" style={{ color: 'var(--text-secondary)' }}>Pro feature</span>}
          </div>
          <DragSlider value={raisePct} onChange={setRaisePct} min={0} max={20} step={1} colorRgb={GLOW} label="Simulated raise" suffix="%" disabled={!isPro} />
          {isPro && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="ios-card p-3 text-center">
                <div className="text-title3 tabular" style={{ color: `rgb(${GLOW})` }}>{formatMoney(raisedNet)}</div>
                <div className="text-caption mt-0.5">New net pay ({netDelta >= 0 ? '+' : ''}{formatMoney(netDelta)})</div>
              </div>
              <div className="ios-card p-3 text-center">
                <div className="text-title3 tabular" style={{ color: raisedCashFloor < 0 ? `rgb(${RED})` : `rgb(${GLOW})` }}>{formatMoney(raisedCashFloor)}</div>
                <div className="text-caption mt-0.5">New cash floor</div>
              </div>
            </div>
          )}
        </div>

        {/* Free-tier banner */}
        {!isPro && (
          <div
            className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap"
            style={{
              border: atFreeBillLimit ? '1.5px solid rgba(var(--accent-orange), 0.4)' : '1px solid var(--border-hairline)',
              boxShadow: atFreeBillLimit ? '0 0 20px rgba(var(--accent-orange), 0.1)' : 'none',
            }}
          >
            <div>
              <p className="text-footnote font-bold mb-0.5">{atFreeBillLimit ? "⭐ You've hit the free limit" : '🔒 Free plan: 3 bills, current period only'}</p>
              <p className="text-caption">Upgrade to Premium for up to {PRO_MAX_BILLS} bills, insurance/custom deductions, a {PRO_PERIODS_AHEAD}-period projection, the Raise Simulator, and saving your setup.</p>
            </div>
            <button className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Upgrade to Premium — $4/mo</button>
          </div>
        )}

        {/* Like / Share / Comment bar */}
        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: toolLiked ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>
            <span style={{ transform: toolLiked ? 'scale(1.2)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>{toolLiked ? '❤️' : '🤍'}</span>
            <span className="text-footnote font-semibold">{toolLikeCount}</span>
          </button>
          <button onClick={handleShare} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>
            🔗 <span className="text-footnote font-semibold">Share</span>
          </button>
          <button onClick={handleCommentJump} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>
            💬 <span className="text-footnote font-semibold">Comment</span>
          </button>
        </div>
      </div>

      <ToolCommentSection seedComments={PAYROLL_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />
      <ToastHost toast={toast} />
    </div>
  );
}

function atFreeLimit(count: number, isPro: boolean, freeMax: number): boolean {
  return !isPro && count >= freeMax;
}
