// FILE: src/components/pro-tools/MoneyMilestones.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { MONEY_MILESTONES_COMMENTS } from './moneyMilestonesComments';

interface Milestone {
  id: string;
  name: string;
  emoji: string;
  target: number;
  color: string;
}

type DragTarget =
  | { type: 'milestone'; id: string }
  | { type: 'knob' }
  | { type: 'contribution' };

const GLOW = '52, 199, 89';

const CHART_VB_W = 600;
const CHART_VB_H = 300;
const PLOT_LEFT = 54;
const PLOT_RIGHT = 580;
const PLOT_TOP = 24;
const PLOT_BOTTOM = 256;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;

const FREE_MAX_MILESTONES = 3;
const PRO_MAX_MILESTONES = 8;
const MIN_MILESTONES = 1;

const FREE_MAX_CONTRIBUTION = 2000;
const PRO_MAX_CONTRIBUTION = 20000;

const FREE_MAX_RATE = 6;
const PRO_MAX_RATE = 20;

const FREE_MAX_START_BALANCE = 50000;
const PRO_MAX_START_BALANCE = 2000000;

const FREE_MAX_TARGET = 200000;
const PRO_MAX_TARGET = 2000000;

const FREE_SNAP = 500;
const PRO_SNAP = 50;

const FREE_MAX_HORIZON_MONTHS = 60;
const HORIZON_YEAR_OPTIONS = [5, 10, 15, 20, 25, 30];

const DEFAULT_START_BALANCE = 5000;
const DEFAULT_CONTRIBUTION = 500;
const DEFAULT_RATE = 5;
const DEFAULT_HORIZON_MONTHS = 60;

const MILESTONE_TEMPLATES: { name: string; emoji: string; target: number; color: string }[] = [
  { name: 'Emergency Fund',    emoji: '🛟', target: 15000,  color: '100, 200, 255' },
  { name: 'House Down Payment', emoji: '🏡', target: 60000,  color: '255, 90, 70' },
  { name: 'Dream Vacation',    emoji: '🏝️', target: 8000,   color: '255, 159, 10' },
  { name: 'Freedom Number',    emoji: '🕊️', target: 500000, color: '196, 132, 252' },
  { name: 'College Fund',      emoji: '🎓', target: 40000,  color: '255, 214, 10' },
  { name: 'New Car',           emoji: '🚗', target: 25000,  color: '120, 220, 200' },
  { name: 'Wedding',           emoji: '💍', target: 20000,  color: '255, 122, 165' },
  { name: 'Business Launch',   emoji: '🚀', target: 30000,  color: '88, 214, 113' },
];
const CUSTOM_COLOR_PALETTE = ['196, 132, 252', '120, 220, 200', '255, 90, 70', '255, 214, 10', '100, 200, 255', '255, 159, 10', '255, 122, 165', '88, 214, 113'];
const EMOJI_PICKS = ['🎯', '💰', '🏠', '🚗', '✈️', '🎓', '💍', '🚀', '🏝️', '🛟', '🕊️', '🎉'];

const DEFAULT_MILESTONES: Milestone[] = MILESTONE_TEMPLATES.slice(0, 3).map((t, i) => ({
  id: `m-default-${i}`, name: t.name, emoji: t.emoji, target: t.target, color: t.color,
}));

function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}
function formatMonths(m: number): string {
  if (m <= 0) return 'now';
  if (m < 12) return `${m} mo`;
  const y = Math.floor(m / 12);
  const r = m % 12;
  return r ? `${y}y ${r}mo` : `${y}y`;
}
function simulateBalances(months: number, start: number, contribution: number, annualRatePct: number): number[] {
  const r = annualRatePct / 100 / 12;
  const arr: number[] = [start];
  let bal = start;
  for (let i = 1; i <= months; i++) { bal = bal * (1 + r) + contribution; arr.push(bal); }
  return arr;
}
function findEtaMonth(balances: number[], target: number): number | null {
  if (target <= balances[0]) return 0;
  for (let i = 1; i < balances.length; i++) { if (balances[i] >= target) return i; }
  return null;
}
function xScale(month: number, horizonMonths: number): number {
  return PLOT_LEFT + (month / horizonMonths) * PLOT_WIDTH;
}
function yScale(amount: number, yMax: number): number {
  const clamped = Math.max(0, Math.min(amount, yMax));
  return PLOT_BOTTOM - (clamped / yMax) * PLOT_HEIGHT;
}

// ---- inline editable text (name) ----
function EditableText({ value, onCommit, colorRgb }: { value: string; onCommit: (v: string) => void; colorRgb: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select(); } }, [editing]);
  function commit() {
    const trimmed = draft.trim();
    onCommit(trimmed.length > 0 ? trimmed : value);
    setEditing(false);
  }
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

// ---- inline editable dollar amount ----
function EditableAmount({ value, onCommit, colorRgb, max }: { value: number; onCommit: (v: number) => void; colorRgb: string; max: number }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select(); } }, [editing]);
  function commit() {
    const parsed = Math.max(0, Math.min(max, Math.round(Number(draft.replace(/[^0-9.]/g, '')) || 0)));
    onCommit(parsed);
    setEditing(false);
  }
  if (editing) {
    return (
      <input
        ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); } }}
        inputMode="decimal"
        className="text-footnote font-bold bg-transparent outline-none border-b tabular"
        style={{ color: `rgb(${colorRgb})`, borderColor: `rgb(${colorRgb})`, width: `${Math.max(String(value).length + 2, 6)}ch` }}
      />
    );
  }
  return (
    <button onClick={() => { setDraft(String(value)); setEditing(true); }} className="text-footnote font-bold press underline decoration-dotted underline-offset-2 tabular" title="Click to edit">
      {formatMoney(value)}
    </button>
  );
}

// ---- confetti particle ----
function ConfettiParticle({ angle, distance, emoji }: { angle: number; distance: number; emoji: string }) {
  const [burst, setBurst] = useState(false);
  useEffect(() => { const t = setTimeout(() => setBurst(true), 10); return () => clearTimeout(t); }, []);
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance;
  return (
    <span
      className="absolute text-lg"
      style={{
        transform: burst ? `translate(${dx}px, ${dy}px) scale(1.3) rotate(${angle * 40}deg)` : 'translate(0,0) scale(0.6)',
        opacity: burst ? 0 : 1,
        transition: 'transform 900ms cubic-bezier(0.2,0.8,0.2,1), opacity 900ms ease-out',
      }}
    >{emoji}</span>
  );
}

export function MoneyMilestones() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';

  const maxMilestones = isPro ? PRO_MAX_MILESTONES : FREE_MAX_MILESTONES;
  const maxContribution = isPro ? PRO_MAX_CONTRIBUTION : FREE_MAX_CONTRIBUTION;
  const maxRate = isPro ? PRO_MAX_RATE : FREE_MAX_RATE;
  const maxStartBalance = isPro ? PRO_MAX_START_BALANCE : FREE_MAX_START_BALANCE;
  const maxTarget = isPro ? PRO_MAX_TARGET : FREE_MAX_TARGET;
  const snapAmount = isPro ? PRO_SNAP : FREE_SNAP;

  const [startingBalance, setStartingBalance] = useState(DEFAULT_START_BALANCE);
  const [monthlyContribution, setMonthlyContribution] = useState(DEFAULT_CONTRIBUTION);
  const [growthRatePct, setGrowthRatePct] = useState(DEFAULT_RATE);
  const [horizonMonths, setHorizonMonths] = useState(DEFAULT_HORIZON_MONTHS);
  const [milestones, setMilestones] = useState<Milestone[]>(DEFAULT_MILESTONES);
  const [pulse, setPulse] = useState(false);

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState(EMOJI_PICKS[0]);
  const [customTargetStr, setCustomTargetStr] = useState('10000');

  const [confettiBursts, setConfettiBursts] = useState<{ id: string; particles: { angle: number; distance: number; emoji: string }[] }[]>([]);
  const prevReachedRef = useRef<Record<string, boolean>>({});

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(33);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const chartRef = useRef<SVGSVGElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const contributionRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragTarget | null>(null);
  const toastedRateRef = useRef(false);
  const toastedContributionRef = useRef(false);

  // Clamp on mount / plan change
  useEffect(() => {
    setMonthlyContribution(prev => Math.min(prev, maxContribution));
    setGrowthRatePct(prev => Math.min(prev, maxRate));
    setStartingBalance(prev => Math.min(prev, maxStartBalance));
    setHorizonMonths(prev => isPro ? prev : Math.min(prev, FREE_MAX_HORIZON_MONTHS));
  }, [isPro, maxContribution, maxRate, maxStartBalance]);

  // Load saved config for Pro users
  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/money-milestones')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setStartingBalance(Math.min(data.config.startingBalance, PRO_MAX_START_BALANCE));
          setMonthlyContribution(Math.min(data.config.monthlyContribution, PRO_MAX_CONTRIBUTION));
          setGrowthRatePct(Math.min(data.config.growthRatePct, PRO_MAX_RATE));
          setHorizonMonths(Math.min(data.config.horizonMonths, 360));
          if (Array.isArray(data.config.milestones) && data.config.milestones.length >= MIN_MILESTONES) {
            setMilestones(data.config.milestones);
          }
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const balances = useMemo(
    () => simulateBalances(horizonMonths, startingBalance, monthlyContribution, growthRatePct),
    [horizonMonths, startingBalance, monthlyContribution, growthRatePct]
  );
  const monthlyRate = growthRatePct / 100 / 12;
  const growthThisMonth = startingBalance * monthlyRate;

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 200);
    return () => clearTimeout(t);
  }, [startingBalance, monthlyContribution, growthRatePct]);

  const yMax = useMemo(() => {
    const candidates = [balances[balances.length - 1]];
    milestones.forEach(m => {
      const eta = findEtaMonth(balances, m.target);
      if (eta !== null) candidates.push(m.target);
    });
    return Math.max(1000, Math.max(...candidates) * 1.15);
  }, [balances, milestones]);

  const linePath = useMemo(() => {
    const step = horizonMonths > 120 ? Math.ceil(horizonMonths / 120) : 1;
    let d = `M ${xScale(0, horizonMonths)},${yScale(balances[0], yMax)}`;
    for (let i = step; i <= horizonMonths; i += step) {
      d += ` L ${xScale(i, horizonMonths)},${yScale(balances[i], yMax)}`;
    }
    d += ` L ${xScale(horizonMonths, horizonMonths)},${yScale(balances[horizonMonths], yMax)}`;
    return d;
  }, [balances, horizonMonths, yMax]);

  const areaPath = useMemo(() => {
    return `${linePath} L ${xScale(horizonMonths, horizonMonths)},${PLOT_BOTTOM} L ${xScale(0, horizonMonths)},${PLOT_BOTTOM} Z`;
  }, [linePath, horizonMonths]);

  // ---- confetti on newly-reached milestone ----
  useEffect(() => {
    milestones.forEach(m => {
      const eta = findEtaMonth(balances, m.target);
      const reachedNow = eta === 0;
      const wasReached = prevReachedRef.current[m.id] ?? false;
      if (reachedNow && !wasReached) {
        spawnConfetti(m.emoji);
        showToast(`🎉 ${m.name} already achieved!`, m.emoji);
      }
      prevReachedRef.current[m.id] = reachedNow;
    });
  }, [milestones, balances]);

  function spawnConfetti(emoji: string) {
    const id = `confetti-${Date.now()}-${Math.random()}`;
    const particles = Array.from({ length: 10 }).map((_, i) => ({
      angle: (Math.PI * 2 * i) / 10 + Math.random() * 0.4,
      distance: 50 + Math.random() * 50,
      emoji: i % 3 === 0 ? emoji : (i % 3 === 1 ? '✨' : '🎉'),
    }));
    setConfettiBursts(prev => [...prev, { id, particles }]);
    setTimeout(() => setConfettiBursts(prev => prev.filter(b => b.id !== id)), 1000);
  }

  // ---- unified drag handling ----
  function applyGrowthRate(raw: number) {
    if (!isPro && raw > FREE_MAX_RATE && !toastedRateRef.current) {
      showToast(`Upgrade to Pro for growth rates above ${FREE_MAX_RATE}%`, '⭐');
      toastedRateRef.current = true;
    }
    const clamped = Math.max(0, Math.min(raw, maxRate));
    setGrowthRatePct(Math.round(clamped * 2) / 2);
  }
  function applyContribution(raw: number) {
    if (!isPro && raw > FREE_MAX_CONTRIBUTION && !toastedContributionRef.current) {
      showToast(`Upgrade to Pro to contribute more than ${formatMoney(FREE_MAX_CONTRIBUTION)}/mo`, '⭐');
      toastedContributionRef.current = true;
    }
    const clamped = Math.max(0, Math.min(raw, maxContribution));
    setMonthlyContribution(Math.round(clamped / 10) * 10);
  }

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    if (drag.type === 'milestone' && chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect();
      const scaleY = CHART_VB_H / rect.height;
      const localY = (clientY - rect.top) * scaleY;
      const rawAmount = yMax * ((PLOT_BOTTOM - localY) / PLOT_HEIGHT);
      const clamped = Math.max(0, Math.min(maxTarget, Math.round(rawAmount / snapAmount) * snapAmount));
      setMilestones(prev => prev.map(m => m.id === drag.id ? { ...m, target: clamped } : m));
    } else if (drag.type === 'knob' && knobRef.current) {
      const rect = knobRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      let deg = Math.atan2(dx, -dy) * (180 / Math.PI);
      deg = Math.max(-135, Math.min(135, deg));
      const ratio = (deg + 135) / 270;
      applyGrowthRate(ratio * PRO_MAX_RATE);
    } else if (drag.type === 'contribution' && contributionRef.current) {
      const rect = contributionRef.current.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (rect.bottom - clientY) / rect.height));
      applyContribution(ratio * PRO_MAX_CONTRIBUTION);
    }
  }, [yMax, maxTarget, snapAmount, isPro]);

  useEffect(() => {
    function onMove(e: PointerEvent) { handlePointerMove(e.clientX, e.clientY); }
    function onUp() {
      dragStateRef.current = null;
      toastedRateRef.current = false;
      toastedContributionRef.current = false;
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [handlePointerMove]);

  const health: 'reached' | 'stalled' | 'stretch' | 'ontrack' = useMemo(() => {
    const allReached = milestones.length > 0 && milestones.every(m => findEtaMonth(balances, m.target) === 0);
    if (allReached) return 'reached';
    if (monthlyContribution === 0 && growthRatePct === 0) return 'stalled';
    if (milestones.some(m => findEtaMonth(balances, m.target) === null)) return 'stretch';
    return 'ontrack';
  }, [milestones, balances, monthlyContribution, growthRatePct]);
  const healthLabel = {
    reached: '🎉 All milestones reached',
    stalled: '⚠️ No growth configured',
    stretch: '🔒 Some milestones beyond horizon',
    ontrack: '📈 On track',
  }[health];
  const healthColor = { reached: '52, 199, 89', stalled: '255, 69, 58', stretch: '255, 159, 10', ontrack: '52, 199, 89' }[health];

  const nextMilestone = useMemo(() => {
    const upcoming = milestones
      .map(m => ({ m, eta: findEtaMonth(balances, m.target) }))
      .filter(x => x.eta !== null && x.eta > 0)
      .sort((a, b) => (a.eta as number) - (b.eta as number));
    return upcoming[0] ?? null;
  }, [milestones, balances]);

  const atFreeLimit = !isPro && (
    milestones.length >= FREE_MAX_MILESTONES ||
    monthlyContribution >= FREE_MAX_CONTRIBUTION ||
    growthRatePct >= FREE_MAX_RATE ||
    horizonMonths >= FREE_MAX_HORIZON_MONTHS
  );

  function setHorizonYears(years: number) {
    if (!isPro && years > 5) { showToast('Upgrade to Pro to plan beyond 5 years', '⭐'); return; }
    setHorizonMonths(years * 12);
  }

  function addMilestone() {
    if (!isPro && milestones.length >= FREE_MAX_MILESTONES) { showToast('Upgrade to Pro to add more milestones', '⭐'); return; }
    if (milestones.length >= maxMilestones) { showToast(`You can have up to ${maxMilestones} milestones`, '⚠️'); return; }
    const usedNames = new Set(milestones.map(m => m.name));
    const template = MILESTONE_TEMPLATES.find(t => !usedNames.has(t.name)) ?? {
      name: `Goal ${milestones.length + 1}`, emoji: '🎯', target: 10000, color: CUSTOM_COLOR_PALETTE[milestones.length % CUSTOM_COLOR_PALETTE.length],
    };
    setMilestones(prev => [...prev, { id: `m-${Date.now()}`, name: template.name, emoji: template.emoji, target: template.target, color: template.color }]);
  }

  function openCustomForm() {
    if (!isPro) { showToast('Upgrade to Pro to add a custom milestone', '⭐'); return; }
    if (milestones.length >= PRO_MAX_MILESTONES) { showToast(`You can have up to ${PRO_MAX_MILESTONES} milestones`, '⚠️'); return; }
    setCustomName('');
    setCustomEmoji(EMOJI_PICKS[0]);
    setCustomTargetStr('10000');
    setShowCustomForm(true);
  }
  function handleAddCustomMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!isPro) return;
    if (milestones.length >= PRO_MAX_MILESTONES) { showToast(`You can have up to ${PRO_MAX_MILESTONES} milestones`, '⚠️'); return; }
    const name = customName.trim() || 'Custom Goal';
    const target = Math.max(0, Math.min(PRO_MAX_TARGET, Math.round(Number(customTargetStr)) || 10000));
    setMilestones(prev => [...prev, {
      id: `m-${Date.now()}`, name, emoji: customEmoji, target,
      color: CUSTOM_COLOR_PALETTE[prev.length % CUSTOM_COLOR_PALETTE.length],
    }]);
    setShowCustomForm(false);
    showToast('Custom milestone added', '✨');
  }

  function removeMilestone(id: string) {
    setMilestones(prev => prev.length > MIN_MILESTONES ? prev.filter(m => m.id !== id) : prev);
  }
  function renameMilestone(id: string, name: string) {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, name } : m));
  }
  function updateMilestoneTarget(id: string, target: number) {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, target } : m));
  }

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save your setup', '⭐'); return; }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/tools/money-milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startingBalance, monthlyContribution, growthRatePct, horizonMonths, milestones }),
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
    setStartingBalance(DEFAULT_START_BALANCE);
    setMonthlyContribution(DEFAULT_CONTRIBUTION);
    setGrowthRatePct(DEFAULT_RATE);
    setHorizonMonths(DEFAULT_HORIZON_MONTHS);
    setMilestones(DEFAULT_MILESTONES);
    setShowCustomForm(false);
    showToast('Reset to defaults', '↺');
  }

  function requireAuth() { showToast('You need to sign up first', '🔒'); }

  function handleLike() {
    if (!session) { requireAuth(); return; }
    setToolLiked(prev => { setToolLikeCount(c => prev ? c - 1 : c + 1); return !prev; });
  }
  function handleShare() {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('Link copied!', '🔗'))
      .catch(() => showToast('Could not copy link', '⚠️'));
  }
  function handleInviteFriend() {
    if (typeof window === 'undefined') return;
    const teaser = nextMilestone
      ? `${nextMilestone.m.emoji} ${nextMilestone.m.name} in ${formatMonths(nextMilestone.eta as number)}`
      : 'building my savings plan';
    const text = `I'm using Money & Milestones to track my savings — projected to hit ${teaser}! Try it: ${window.location.href}`;
    navigator.clipboard.writeText(text)
      .then(() => showToast('Invite message copied!', '💌'))
      .catch(() => showToast('Could not copy', '⚠️'));
  }
  function handleCopyReport() {
    const horizonYears = horizonMonths / 12;
    const lines = [
      `Starting balance: ${formatMoney(startingBalance)}`,
      `Monthly contribution: ${formatMoney(monthlyContribution)}/mo`,
      `Growth rate: ${growthRatePct}% APY`,
      `Horizon: ${horizonYears} years`,
      '',
      'Milestones:',
      ...milestones.map(m => {
        const eta = findEtaMonth(balances, m.target);
        const status = eta === 0 ? '✅ Already reached' : eta === null ? `🔒 Beyond ${horizonYears}yr horizon` : `⏳ In ${formatMonths(eta)}`;
        return `- ${m.emoji} ${m.name}: ${formatMoney(m.target)} — ${status}`;
      }),
    ];
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => showToast('Report copied!', '📋'))
      .catch(() => showToast('Could not copy', '⚠️'));
  }
  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const knobRatio = Math.min(1, growthRatePct / PRO_MAX_RATE);
  const knobDeg = -135 + knobRatio * 270;
  const KNOB_R = 34;
  const KNOB_CIRC = 2 * Math.PI * KNOB_R;
  const knobSweepFraction = 270 / 360;
  const freeRateRatio = FREE_MAX_RATE / PRO_MAX_RATE;

  const contributionRatio = Math.min(1, monthlyContribution / PRO_MAX_CONTRIBUTION);
  const freeContributionRatio = FREE_MAX_CONTRIBUTION / PRO_MAX_CONTRIBUTION;

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8 relative" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>MONEY & MILESTONES</p>
            <h2 className="text-title2">Growth Timeline</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>↺ Reset</button>
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? 'Save this plan to your account' : 'Upgrade to save your setup'}
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
            { label: 'Current balance', value: formatMoney(startingBalance) },
            { label: 'Monthly contribution', value: `${formatMoney(monthlyContribution)}/mo` },
            { label: "This month's growth", value: `+${formatMoney(growthThisMonth)}` },
            { label: 'Next milestone', value: nextMilestone ? `${nextMilestone.m.emoji} ${formatMonths(nextMilestone.eta as number)}` : (milestones.length ? '🎉 Reached!' : '—') },
          ].map(stat => (
            <div key={stat.label} className="ios-card-nested p-3 text-center">
              <div className="text-title3 tabular transition-transform duration-200" style={{ transform: pulse ? 'scale(1.08)' : 'scale(1)', color: `rgb(${GLOW})` }}>
                {stat.value}
              </div>
              <div className="text-caption mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Growth chart */}
        <div className="relative mb-2">
          <svg ref={chartRef} viewBox={`0 0 ${CHART_VB_W} ${CHART_VB_H}`} width="100%" height="240" style={{ touchAction: 'none' }}>
            {[0, 0.25, 0.5, 0.75, 1].map(f => (
              <g key={f}>
                <line x1={PLOT_LEFT} y1={PLOT_BOTTOM - f * PLOT_HEIGHT} x2={PLOT_RIGHT} y2={PLOT_BOTTOM - f * PLOT_HEIGHT} stroke="var(--border-hairline)" strokeWidth={1} opacity={0.6} />
                <text x={PLOT_LEFT - 6} y={PLOT_BOTTOM - f * PLOT_HEIGHT + 3} textAnchor="end" fontSize="9" fill="var(--text-tertiary)">
                  {f === 0 ? '$0' : `$${Math.round((yMax * f) / 1000)}k`}
                </text>
              </g>
            ))}

            <path d={areaPath} fill={`rgba(${GLOW}, 0.15)`} style={{ transition: 'd 300ms ease-out' }} />
            <path d={linePath} fill="none" stroke={`rgb(${GLOW})`} strokeWidth={3} strokeLinecap="round" style={{ transition: 'd 300ms ease-out' }} />

            <circle cx={xScale(0, horizonMonths)} cy={yScale(balances[0], yMax)} r={5} fill={`rgb(${GLOW})`} stroke="white" strokeWidth={2} />

            {milestones.map(m => {
              const eta = findEtaMonth(balances, m.target);
              const beyond = eta === null;
              const mx = beyond ? PLOT_RIGHT : xScale(eta as number, horizonMonths);
              const my = beyond ? Math.max(PLOT_TOP + 10, yScale(Math.min(m.target, yMax), yMax)) : yScale(m.target, yMax);
              const isDragging = dragStateRef.current?.type === 'milestone' && (dragStateRef.current as any).id === m.id;
              return (
                <g key={m.id}>
                  {beyond && (
                    <line x1={mx - 14} y1={my} x2={mx} y2={my} stroke={`rgb(${m.color})`} strokeWidth={2} strokeDasharray="3 3" opacity={0.7} />
                  )}
                  <circle
                    cx={mx} cy={my} r={11}
                    fill="white" stroke={`rgb(${m.color})`} strokeWidth={4}
                    style={{ cursor: 'grab', touchAction: 'none' }}
                    onPointerDown={() => { dragStateRef.current = { type: 'milestone', id: m.id }; }}
                  />
                  <text x={mx} y={my + 3.5} textAnchor="middle" fontSize="10">{m.emoji}</text>
                  {isDragging && (
                    <text x={mx} y={my - 18} textAnchor="middle" fontSize="11" fontWeight="bold" fill={`rgb(${m.color})`}>
                      {formatMoney(m.target)} · {beyond ? `beyond ${horizonMonths / 12}yr` : formatMonths(eta as number)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {confettiBursts.map(burst => (
            <div key={burst.id} className="pointer-events-none absolute inset-0 flex items-center justify-center z-30">
              {burst.particles.map((p, i) => <ConfettiParticle key={i} angle={p.angle} distance={p.distance} emoji={p.emoji} />)}
            </div>
          ))}
        </div>
        <p className="text-caption text-center mb-6" style={{ color: 'var(--text-tertiary)' }}>Drag a milestone pin up or down — it slides along the curve to the month it's reached</p>

        {/* Control row: contribution thermometer / growth knob / starting balance */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="ios-card-nested p-4 flex flex-col items-center gap-2">
            <p className="text-caption text-center">Monthly contribution</p>
            <div
              ref={contributionRef}
              onPointerDown={() => { dragStateRef.current = { type: 'contribution' }; }}
              className="relative rounded-full cursor-grab"
              style={{ width: 36, height: 120, background: 'var(--border-hairline)', touchAction: 'none' }}
            >
              {!isPro && (
                <div className="absolute w-full h-0.5" style={{ bottom: `${freeContributionRatio * 100}%`, background: 'rgba(var(--accent-orange), 0.6)' }} />
              )}
              <div
                className="absolute bottom-0 left-0 w-full rounded-full transition-all duration-100"
                style={{ height: `${contributionRatio * 100}%`, background: `rgb(${GLOW})`, boxShadow: `0 0 10px rgba(${GLOW}, 0.5)` }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  bottom: `calc(${contributionRatio * 100}% - 11px)`, left: '50%', transform: 'translateX(-50%)',
                  width: 22, height: 22, background: 'white', border: `3px solid rgb(${GLOW})`, boxShadow: `0 0 8px rgba(${GLOW}, 0.6)`,
                }}
              />
            </div>
            <p className="text-footnote font-bold tabular" style={{ color: `rgb(${GLOW})` }}>{formatMoney(monthlyContribution)}/mo</p>
          </div>

          <div className="ios-card-nested p-4 flex flex-col items-center gap-2">
            <p className="text-caption text-center">Growth rate (APY)</p>
            <div
              ref={knobRef}
              onPointerDown={() => { dragStateRef.current = { type: 'knob' }; }}
              className="relative cursor-grab"
              style={{ width: 80, height: 80, touchAction: 'none' }}
            >
              <svg viewBox="0 0 80 80" width={80} height={80}>
                <circle cx={40} cy={40} r={KNOB_R} fill="none" stroke="var(--border-hairline)" strokeWidth={6}
                  strokeDasharray={`${KNOB_CIRC * knobSweepFraction} ${KNOB_CIRC}`} strokeLinecap="round" transform="rotate(135 40 40)" />
                <circle cx={40} cy={40} r={KNOB_R} fill="none" stroke={`rgb(${GLOW})`} strokeWidth={6}
                  strokeDasharray={`${KNOB_CIRC * knobSweepFraction * knobRatio} ${KNOB_CIRC}`} strokeLinecap="round" transform="rotate(135 40 40)"
                  style={{ transition: 'stroke-dasharray 100ms' }} />
                {!isPro && (
                  <line x1={40} y1={8} x2={40} y2={14} stroke="rgb(var(--accent-orange))" strokeWidth={3}
                    transform={`rotate(${-135 + freeRateRatio * 270} 40 40)`} />
                )}
                <line x1={40} y1={40} x2={40} y2={12} stroke="white" strokeWidth={4} strokeLinecap="round"
                  style={{ transformOrigin: '40px 40px', transform: `rotate(${knobDeg}deg)`, transition: 'transform 100ms' }} />
                <circle cx={40} cy={40} r={5} fill={`rgb(${GLOW})`} />
              </svg>
            </div>
            <p className="text-footnote font-bold tabular" style={{ color: `rgb(${GLOW})` }}>{growthRatePct}%</p>
          </div>

          <div className="ios-card-nested p-4 flex flex-col items-center justify-center gap-2">
            <p className="text-caption text-center">Starting balance</p>
            <EditableAmount value={startingBalance} onCommit={setStartingBalance} colorRgb={GLOW} max={maxStartBalance} />
            <p className="text-caption text-center" style={{ color: 'var(--text-tertiary)' }}>tap to edit</p>
          </div>
        </div>

        {/* Horizon stepper */}
        <div className="ios-card-nested p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-footnote font-semibold">Projection horizon</p>
            <p className="text-caption">{isPro ? 'Up to 30 years' : 'Free plan: 5 years'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {HORIZON_YEAR_OPTIONS.map(y => {
              const active = horizonMonths === y * 12;
              const locked = !isPro && y > 5;
              return (
                <button
                  key={y}
                  onClick={() => setHorizonYears(y)}
                  className="pill press text-xs"
                  style={{
                    background: active ? `rgb(${GLOW})` : 'var(--bg-base)',
                    color: active ? 'white' : locked ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                    border: '1px solid var(--border-hairline)',
                  }}
                >
                  {locked ? '🔒 ' : ''}{y}yr
                </button>
              );
            })}
          </div>
        </div>

        {/* Milestone cards */}
        <div className="flex flex-col gap-2 mb-4">
          {milestones.map(m => {
            const eta = findEtaMonth(balances, m.target);
            const beyond = eta === null;
            const reached = eta === 0;
            const funded = Math.min(100, Math.round((startingBalance / Math.max(m.target, 1)) * 100));
            return (
              <div key={m.id} className="ios-card-nested p-3 flex flex-col gap-2" style={{ borderLeft: `3px solid rgb(${m.color})` }}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{m.emoji}</span>
                    <EditableText value={m.name} onCommit={v => renameMilestone(m.id, v)} colorRgb={m.color} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="pill text-[10px]" style={{
                      background: reached ? 'rgba(52, 199, 89, 0.15)' : beyond ? 'rgba(255, 159, 10, 0.15)' : `rgba(${m.color}, 0.15)`,
                      color: reached ? 'rgb(52, 199, 89)' : beyond ? 'rgb(255, 159, 10)' : `rgb(${m.color})`,
                    }}>
                      {reached ? '✅ Reached' : beyond ? `🔒 Beyond ${horizonMonths / 12}yr` : `⏳ ${formatMonths(eta as number)}`}
                    </span>
                    {milestones.length > MIN_MILESTONES && (
                      <button onClick={() => removeMilestone(m.id)} className="press text-caption" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2 text-footnote">
                  <span>
                    Target <EditableAmount value={m.target} onCommit={v => updateMilestoneTarget(m.id, v)} colorRgb={m.color} max={maxTarget} />
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-hairline)' }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${funded}%`, background: `rgb(${m.color})` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={addMilestone}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5"
              style={{ color: isPro || milestones.length < FREE_MAX_MILESTONES ? 'var(--text-secondary)' : 'var(--text-tertiary)', opacity: milestones.length >= maxMilestones ? 0.5 : 1 }}
            >
              {isPro || milestones.length < FREE_MAX_MILESTONES ? '+' : '🔒'} Add milestone
            </button>
            <button
              onClick={openCustomForm}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? 'Create a fully custom milestone' : 'Upgrade to Pro for custom milestones'}
            >
              {isPro ? '✨' : '🔒'} Custom milestone
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopyReport} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>📋 Copy report</button>
            <button onClick={handleInviteFriend} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>💌 Invite a friend</button>
          </div>
        </div>

        {/* Custom milestone form (Pro only) */}
        {showCustomForm && isPro && (
          <form onSubmit={handleAddCustomMilestone} className="ios-card-nested p-4 mb-6 flex flex-col gap-3 anim-fade-up">
            <div className="flex items-center justify-between">
              <p className="text-footnote font-semibold">✨ New custom milestone</p>
              <button type="button" onClick={() => setShowCustomForm(false)} className="press text-caption" style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-caption">Name</span>
              <input
                value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Sabbatical Fund" maxLength={30}
                className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none" style={{ border: '1px solid var(--border-hairline)' }}
              />
            </label>
            <div className="flex flex-col gap-1">
              <span className="text-caption">Emoji</span>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_PICKS.map(em => (
                  <button
                    key={em} type="button" onClick={() => setCustomEmoji(em)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base press"
                    style={{ background: em === customEmoji ? `rgba(${GLOW}, 0.2)` : 'var(--bg-base)', border: '1px solid var(--border-hairline)' }}
                  >{em}</button>
                ))}
              </div>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-caption">Target amount ($)</span>
              <input
                type="number" min={0} step={100} value={customTargetStr} onChange={e => setCustomTargetStr(e.target.value)}
                className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none tabular" style={{ border: '1px solid var(--border-hairline)' }}
              />
            </label>
            <button type="submit" className="btn-filled press text-sm">Add milestone</button>
          </form>
        )}

        {/* Free-tier banner */}
        {!isPro && (
          <div className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap"
            style={{
              border: atFreeLimit ? '1.5px solid rgba(var(--accent-orange), 0.4)' : '1px solid var(--border-hairline)',
              boxShadow: atFreeLimit ? '0 0 20px rgba(var(--accent-orange), 0.1)' : 'none',
            }}>
            <div>
              <p className="text-footnote font-bold mb-0.5">{atFreeLimit ? "⭐ You've hit the free limit" : '🔒 Free plan: 3 milestones, 5yr horizon, 6% rate cap'}</p>
              <p className="text-caption">Upgrade to Premium for up to {PRO_MAX_MILESTONES} milestones, a 30-year horizon, {PRO_MAX_RATE}% growth rates, custom milestones, and saving your plan.</p>
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

      <ToolCommentSection seedComments={MONEY_MILESTONES_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />

      <ToastHost toast={toast} />
    </div>
  );
}
