// FILE: src/components/pro-tools/LifeExpectancyCalculator.tsx
'use client';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { EmbedCodeButton } from '@/components/embeds/EmbedCodeButton';
import { LIFE_EXPECTANCY_COMMENTS } from './lifeExpectancyComments';
import { REGIONS, type Region } from '@/lib/lifeExpectancySeed';
import { FACTOR_INFO, DEFAULT_FACTORS, FREE_FACTOR_LIMIT, chanceOfReaching, type Factors, type Sex } from '@/lib/lifeExpectancy';

const GLOW = '99, 153, 34'; // calm green — this tool is about longevity, not alarm
const FREE_MAX_FAMILY = 0;
const PRO_MAX_FAMILY = 5;

interface ComputeResult {
  baseline: { remainingYears: number; expectedAge: number; source: string; sourceYear: number; isRealData: boolean };
  adjustedExpectedAge: number;
  totalAdjustment: number;
  breakdown: { key: keyof Factors; years: number }[];
  remainingYears: number;
  targetDate: string;
  percentLifeLived: number;
  chance90: number;
  chance100: number;
  appliedFactors: (keyof Factors)[];
  wasFactorLimited: boolean;
}

interface FamilyMember { id: string; label: string; age: number; sex: Sex; region: Region; result?: ComputeResult; }

function isoNow() { return new Date().toISOString(); }

// ── Ticking countdown ───────────────────────────────────────────────────
function useCountdown(targetIso: string | null) {
  const [parts, setParts] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!targetIso) return;
    const target = new Date(targetIso).getTime();
    function tick() {
      const msLeft = Math.max(0, target - Date.now());
      setParts({
        days: Math.floor(msLeft / 86400000),
        hours: Math.floor((msLeft % 86400000) / 3600000),
        minutes: Math.floor((msLeft % 3600000) / 60000),
        seconds: Math.floor((msLeft % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  return parts;
}

function CountdownTimer({ targetIso, glow }: { targetIso: string | null; glow: string }) {
  const { days, hours, minutes, seconds } = useCountdown(targetIso);
  const units = [
    { v: days, l: 'days' },
    { v: hours, l: 'hrs' },
    { v: minutes, l: 'min' },
    { v: seconds, l: 'sec' },
  ];
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {units.map(u => (
        <div key={u.l} className="ios-card-nested px-3 py-2 sm:px-4 sm:py-3 text-center min-w-[64px]">
          <div className="text-title2 font-bold tabular" style={{ color: `rgb(${glow})` }}>
            {u.v.toLocaleString()}
          </div>
          <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{u.l}</div>
        </div>
      ))}
    </div>
  );
}

// ── Ring progress ───────────────────────────────────────────────────────
function RingProgress({ percent, glow, label, sub }: { percent: number; glow: string; label: string; sub: string }) {
  const r = 52, c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <svg width={128} height={128} viewBox="0 0 128 128">
        <circle cx={64} cy={64} r={r} fill="none" stroke="var(--border-hairline)" strokeWidth={10} />
        <circle
          cx={64} cy={64} r={r} fill="none" stroke={`rgb(${glow})`} strokeWidth={10}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 64 64)" style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
        <text x={64} y={60} textAnchor="middle" fontSize={22} fontWeight={700} fill={`rgb(${glow})`}>{Math.round(percent)}%</text>
        <text x={64} y={78} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">lived</text>
      </svg>
      <p className="text-footnote font-semibold mt-1 text-center">{label}</p>
      <p className="text-caption text-center" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>
    </div>
  );
}

// ── Survival probability curve ──────────────────────────────────────────
function SurvivalCurveChart({ currentAge, expectedAge, glow }: { currentAge: number; expectedAge: number; glow: string }) {
  const maxAge = Math.min(115, Math.round(expectedAge + 20));
  const step = Math.max(1, Math.round((maxAge - currentAge) / 40));
  const points: { age: number; p: number }[] = [];
  for (let a = currentAge; a <= maxAge; a += step) {
    points.push({ age: a, p: chanceOfReaching(a, expectedAge, currentAge) * 100 });
  }
  if (points.length < 2) return null;
  const W = 400, H = 130, PAD = 10;
  const xFor = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const yFor = (v: number) => H - PAD - (v / 100) * (H - PAD * 2);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)},${yFor(p.p)}`).join(' ');
  const areaPath = `${path} L ${xFor(points.length - 1)},${H - PAD} L ${xFor(0)},${H - PAD} Z`;
  const midIdx = points.findIndex(p => p.p <= 50);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id="le-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgb(${glow})`} stopOpacity={0.25} />
          <stop offset="100%" stopColor={`rgb(${glow})`} stopOpacity={0} />
        </linearGradient>
      </defs>
      <line x1={PAD} x2={W - PAD} y1={yFor(50)} y2={yFor(50)} stroke="var(--text-tertiary)" strokeDasharray="4 3" strokeWidth={1} opacity={0.4} />
      <path d={areaPath} fill="url(#le-area)" />
      <path d={path} fill="none" stroke={`rgb(${glow})`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {midIdx > 0 && (
        <circle cx={xFor(midIdx)} cy={yFor(points[midIdx].p)} r={4} fill={`rgb(${glow})`} stroke="white" strokeWidth={1.5} />
      )}
      <text x={PAD} y={H - 2} fontSize={9} fill="var(--text-tertiary)">Age {currentAge}</text>
      <text x={W - PAD} y={H - 2} fontSize={9} fill="var(--text-tertiary)" textAnchor="end">Age {maxAge}</text>
    </svg>
  );
}

// ── Comparison bars ─────────────────────────────────────────────────────
function ComparisonBars({ rows, glow }: { rows: { label: string; value: number; highlight?: boolean }[]; glow: string }) {
  const max = Math.max(...rows.map(r => r.value), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map(r => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="text-caption w-32 flex-shrink-0 truncate" style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
          <div className="flex-1 h-2.5 rounded-full" style={{ background: 'var(--border-hairline)' }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(r.value / max) * 100}%`, background: r.highlight ? `rgb(${glow})` : 'var(--text-tertiary)', opacity: r.highlight ? 1 : 0.5 }}
            />
          </div>
          <span className="text-caption font-bold w-10 text-right flex-shrink-0" style={{ color: r.highlight ? `rgb(${glow})` : 'var(--text-secondary)' }}>{r.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────
export function LifeExpectancyCalculator() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';

  const [region, setRegion] = useState<Region>('US');
  const [age, setAge] = useState(30);
  const [sex, setSex] = useState<Sex>('MALE');
  const [factors, setFactors] = useState<Factors>({ ...DEFAULT_FACTORS });
  const [result, setResult] = useState<ComputeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPersisted, setIsPersisted] = useState(false);

  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [familyForm, setFamilyForm] = useState({ label: '', age: 30, sex: 'MALE' as Sex, region: 'US' as Region });
  const [showFamilyForm, setShowFamilyForm] = useState(false);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(47);

  const activeFactorCount = (Object.keys(factors) as (keyof Factors)[]).filter(k => factors[k]).length;

  // Restore a Pro user's saved profile on load (this is the "persistent
  // timer" — the whole reason to upgrade is that this fetch finds something).
  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/life-expectancy-calculator')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setRegion(data.config.region);
          setAge(data.config.age);
          setSex(data.config.sex);
          setFactors({ ...DEFAULT_FACTORS, ...(data.config.factors ?? {}) });
          if (data.config.familyMembers) {
            setFamily(data.config.familyMembers.map((m: any) => ({ ...m, id: m.id ?? crypto.randomUUID() })));
          }
          setIsPersisted(true);
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const compute = useCallback(async (nextFactors: Factors, nextRegion: Region, nextAge: number, nextSex: Sex) => {
    setLoading(true);
    try {
      const res = await fetch('/api/tools/life-expectancy/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: nextRegion, age: nextAge, sex: nextSex, factors: nextFactors }),
      });
      const data: ComputeResult = await res.json();
      if (!res.ok) throw new Error((data as any).error ?? 'Compute failed');
      setResult(data);
      if (data.wasFactorLimited) {
        showToast('Free plan applies only your first selected factor', '🔒');
      }
      return data;
    } catch {
      showToast('Could not calculate — try again', '⚠️');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  async function handleCalculate() {
    await compute(factors, region, age, sex);
  }

  function toggleFactor(key: keyof Factors) {
    const willActivate = !factors[key];
    if (willActivate && !isPro && activeFactorCount >= FREE_FACTOR_LIMIT) {
      showToast('Upgrade to Pro to combine multiple lifestyle factors', '⭐');
      return;
    }
    const next = { ...factors, [key]: willActivate };
    setFactors(next);
    if (result) compute(next, region, age, sex); // live-recompute once a first result exists
  }

  async function handleSave() {
    if (!isPro || !result) { showToast('Upgrade to Pro to keep this countdown running', '⭐'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/tools/life-expectancy-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region, age, sex, factors,
          familyMembers: family.map(({ result: _r, ...m }) => m),
          expectedAge: result.adjustedExpectedAge,
          targetDate: result.targetDate,
        }),
      });
      if (!res.ok) throw new Error('save failed');
      setIsPersisted(true);
      showToast('Countdown saved — it\'ll be here next time', '💾');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setRegion('US'); setAge(30); setSex('MALE'); setFactors({ ...DEFAULT_FACTORS }); setResult(null); setFamily([]);
    showToast('Reset', '↺');
  }

  function requireAuth() { showToast('You need to sign up first', '🔒'); }
  function handleLike() {
    if (!session) { requireAuth(); return; }
    setToolLiked(prev => { setToolLikeCount(c => (prev ? c - 1 : c + 1)); return !prev; });
  }
  function handleShare() {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => showToast('Link copied!', '🔗')).catch(() => showToast('Could not copy link', '⚠️'));
  }
  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleAddFamilyMember() {
    if (!isPro) { showToast('Upgrade to Pro to compare with family', '⭐'); return; }
    if (family.length >= PRO_MAX_FAMILY) { showToast(`Up to ${PRO_MAX_FAMILY} family members`, '⚠️'); return; }
    if (!familyForm.label.trim()) { showToast('Give this person a name or label', '⚠️'); return; }
    const id = crypto.randomUUID();
    const member: FamilyMember = { id, ...familyForm };
    setFamily(prev => [...prev, member]);
    setShowFamilyForm(false);
    setFamilyForm({ label: '', age: 30, sex: 'MALE', region: 'US' });

    const data = await compute(DEFAULT_FACTORS, member.region, member.age, member.sex);
    if (data) setFamily(prev => prev.map(m => (m.id === id ? { ...m, result: data } : m)));
  }
  function removeFamilyMember(id: string) {
    setFamily(prev => prev.filter(m => m.id !== id));
  }

  const comparisonRows = useMemo(() => {
    if (!result) return [];
    const opposite: Sex = sex === 'MALE' ? 'FEMALE' : 'MALE';
    return [
      { label: 'You', value: result.adjustedExpectedAge, highlight: true },
      { label: 'Region average', value: result.baseline.expectedAge },
      { label: `Opposite sex avg.`, value: age + (REGIONS.find(r => r.id === region)?.lifeExpectancyAtBirth[opposite] ?? 75) - age },
      { label: 'Global average', value: 73.4 },
    ];
  }, [result, region, sex, age]);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>LONGEVITY</p>
            <h2 className="text-title2">Life Expectancy Calculator</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleReset} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>↺ Reset</button>
            <button
              onClick={handleSave}
              disabled={saving || !result}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? 'Save this countdown to your account' : 'Upgrade to keep this countdown running'}
            >
              {isPro ? '💾' : '🔒'} {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div>
            <label className="text-caption font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Region</label>
            <select
              value={region}
              onChange={e => setRegion(e.target.value as Region)}
              className="ios-card-nested w-full px-3 py-2.5 text-sm focus:outline-none"
            >
              {REGIONS.map(r => <option key={r.id} value={r.id}>{r.flag} {r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-caption font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Current age</label>
            <input
              type="number" min={0} max={110} value={age}
              onChange={e => setAge(Math.max(0, Math.min(110, Number(e.target.value) || 0)))}
              className="ios-card-nested w-full px-3 py-2.5 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="text-caption font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Sex</label>
            <div className="ios-card-nested p-1 flex gap-1">
              {(['MALE', 'FEMALE'] as Sex[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSex(s)}
                  className="press flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                  style={{ background: sex === s ? `rgb(${GLOW})` : 'transparent', color: sex === s ? 'white' : 'var(--text-secondary)' }}
                >
                  {s === 'MALE' ? '♂ Male' : '♀ Female'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleCalculate} disabled={loading} className="btn-filled press w-full mb-6 disabled:opacity-60">
          {loading ? 'Calculating…' : result ? '↻ Recalculate' : '📊 Calculate my estimate'}
        </button>

        {result && (
          <>
            {/* Credibility line */}
            <div className="flex items-center gap-2 mb-5 text-caption" style={{ color: 'var(--text-tertiary)' }}>
              <span>📚</span>
              <span>
                Based on {result.baseline.source}{result.baseline.sourceYear ? `, ${result.baseline.sourceYear}` : ''}
                {!result.baseline.isRealData && ' (regional approximation — being upgraded to full actuarial tables)'}
              </span>
            </div>

            {/* Headline result */}
            <div className="ios-card-nested p-5 mb-5" style={{ background: `rgba(${GLOW}, 0.08)` }}>
              <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                <div>
                  <p className="text-caption mb-1">STATISTICAL LIFESPAN</p>
                  <p className="text-largetitle tabular font-bold" style={{ color: `rgb(${GLOW})` }}>{result.adjustedExpectedAge.toFixed(1)} <span className="text-title2">years</span></p>
                  <p className="text-footnote mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Estimated year: {new Date(result.targetDate).getFullYear()}
                    {result.totalAdjustment !== 0 && (
                      <span> · {result.totalAdjustment > 0 ? '+' : ''}{result.totalAdjustment} yrs from lifestyle factors</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-title2 font-bold tabular" style={{ color: `rgb(${GLOW})` }}>{result.chance90}%</p>
                    <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>reach 90</p>
                  </div>
                  <div className="text-center">
                    <p className="text-title2 font-bold tabular" style={{ color: `rgb(${GLOW})` }}>{result.chance100}%</p>
                    <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>reach 100</p>
                  </div>
                </div>
              </div>

              {/* Ticking countdown */}
              <p className="text-caption font-semibold mb-2 text-center" style={{ color: 'var(--text-secondary)' }}>TIME STATISTICALLY REMAINING</p>
              <CountdownTimer targetIso={result.targetDate} glow={GLOW} />

              {!isPro && (
                <p className="text-caption text-center mt-3" style={{ color: 'var(--text-tertiary)' }}>
                  🔒 This resets when you leave. <button onClick={handleSave} className="underline font-semibold" style={{ color: `rgb(${GLOW})` }}>Go Pro</button> to pin it and keep it running.
                </p>
              )}
              {isPro && isPersisted && (
                <p className="text-caption text-center mt-3" style={{ color: 'var(--text-tertiary)' }}>✓ Saved — this timer picks up right where it left off, every visit.</p>
              )}
            </div>

            {/* Ring + comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div className="ios-card-nested p-5 flex items-center justify-center">
                <RingProgress percent={result.percentLifeLived} glow={GLOW} label="of expected life lived" sub={`${age} of ${result.adjustedExpectedAge.toFixed(1)} years`} />
              </div>
              <div className="ios-card-nested p-5">
                <p className="text-footnote font-semibold mb-3">How you compare</p>
                <ComparisonBars rows={comparisonRows} glow={GLOW} />
              </div>
            </div>

            {/* Survival curve */}
            <div className="ios-card-nested p-4 mb-6">
              <p className="text-footnote font-semibold mb-2">Survival probability by age</p>
              <SurvivalCurveChart currentAge={age} expectedAge={result.adjustedExpectedAge} glow={GLOW} />
            </div>
          </>
        )}

        {/* Lifestyle factors */}
        <div className="mb-6">
          <p className="text-footnote font-semibold mb-2">
            Lifestyle factors {!isPro && <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>(free: adjust 1 at a time — Pro: combine all)</span>}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(FACTOR_INFO) as (keyof Factors)[]).map(key => {
              const info = FACTOR_INFO[key];
              const active = factors[key];
              const locked = !isPro && !active && activeFactorCount >= FREE_FACTOR_LIMIT;
              return (
                <button
                  key={key}
                  onClick={() => toggleFactor(key)}
                  className="ios-card-nested press flex items-center gap-2.5 p-3 text-left transition-colors"
                  style={{
                    border: active ? `1.5px solid rgb(${GLOW})` : '1.5px solid transparent',
                    background: active ? `rgba(${GLOW}, 0.08)` : undefined,
                    opacity: locked ? 0.5 : 1,
                  }}
                >
                  <span className="text-base flex-shrink-0">{locked ? '🔒' : info.emoji}</span>
                  <span className="text-footnote flex-1">{info.label}</span>
                  <span className="text-caption font-bold flex-shrink-0" style={{ color: info.years > 0 ? `rgb(${GLOW})` : 'var(--text-tertiary)' }}>
                    {info.years > 0 ? '+' : ''}{info.years}y
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Family compare */}
        <div className="mb-6">
          <p className="text-footnote font-semibold mb-2">
            Compare with family {!isPro && <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>(Pro — up to {PRO_MAX_FAMILY} people)</span>}
          </p>
          {isPro ? (
            <div className="flex flex-col gap-2">
              {family.map(m => (
                <div key={m.id} className="ios-card-nested p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-footnote font-semibold">{m.label} <span style={{ color: 'var(--text-tertiary)' }}>· age {m.age} · {m.sex === 'MALE' ? '♂' : '♀'} · {REGIONS.find(r => r.id === m.region)?.flag}</span></p>
                    {m.result && <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>Statistical lifespan: {m.result.adjustedExpectedAge.toFixed(1)} years</p>}
                  </div>
                  <button onClick={() => removeFamilyMember(m.id)} className="text-gray-400 hover:text-red-500 px-2 flex-shrink-0">×</button>
                </div>
              ))}

              {showFamilyForm ? (
                <div className="ios-card-nested p-4 flex flex-col gap-2.5 anim-fade-up">
                  <input
                    value={familyForm.label}
                    onChange={e => setFamilyForm(f => ({ ...f, label: e.target.value }))}
                    placeholder="Label, e.g. 'Mom' or 'Son'"
                    className="ios-card-nested px-3 py-2 text-sm focus:outline-none"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number" min={0} max={110} value={familyForm.age}
                      onChange={e => setFamilyForm(f => ({ ...f, age: Math.max(0, Math.min(110, Number(e.target.value) || 0)) }))}
                      className="ios-card-nested px-2 py-2 text-sm focus:outline-none"
                    />
                    <select value={familyForm.sex} onChange={e => setFamilyForm(f => ({ ...f, sex: e.target.value as Sex }))} className="ios-card-nested px-2 py-2 text-sm focus:outline-none">
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                    <select value={familyForm.region} onChange={e => setFamilyForm(f => ({ ...f, region: e.target.value as Region }))} className="ios-card-nested px-2 py-2 text-sm focus:outline-none">
                      {REGIONS.map(r => <option key={r.id} value={r.id}>{r.flag} {r.id}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddFamilyMember} className="btn-filled press text-sm flex-1">Add</button>
                    <button onClick={() => setShowFamilyForm(false)} className="ios-card-nested press text-sm px-4" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                family.length < PRO_MAX_FAMILY && (
                  <button onClick={() => setShowFamilyForm(true)} className="ios-card-nested press text-xs px-3 py-2 self-start" style={{ color: 'var(--text-secondary)' }}>+ Add family member</button>
                )
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="pointer-events-none select-none ios-card-nested p-6" style={{ filter: 'blur(3px)', opacity: 0.55 }}>
                <div className="h-14" />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-4">
                <span className="text-2xl">🔒</span>
                <p className="text-footnote font-bold">See your whole family side-by-side</p>
                <p className="text-caption max-w-xs">Upgrade to add family members and compare statistical estimates together.</p>
              </div>
            </div>
          )}
        </div>

        {!isPro && (
          <div className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap" style={{ border: '1px solid var(--border-hairline)' }}>
            <div>
              <p className="text-footnote font-bold mb-0.5">🔒 Free plan: 1 lifestyle factor, no saved timer</p>
              <p className="text-caption">Upgrade to stack every factor, save your countdown, and compare with family.</p>
            </div>
            <button onClick={handleSave} className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Upgrade to Premium — $9.99/mo</button>
          </div>
        )}

        <div className="ios-card-nested p-4 mb-2 flex gap-3 items-start" style={{ borderLeft: `3px solid rgb(${GLOW})` }}>
          <span className="text-lg flex-shrink-0">ℹ️</span>
          <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
            This is a statistical estimate based on population averages — it describes groups, not individuals, and cannot predict any one person's actual lifespan. Lifestyle adjustments reflect rough, commonly-cited averages from public health research, not a medical assessment.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: toolLiked ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>
            <span style={{ transform: toolLiked ? 'scale(1.2)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>{toolLiked ? '❤️' : '🤍'}</span>
            <span className="text-footnote font-semibold">{toolLikeCount}</span>
          </button>
          <button onClick={handleShare} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>🔗 <span className="text-footnote font-semibold">Share</span></button>
          <button onClick={handleCommentJump} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>💬 <span className="text-footnote font-semibold">Comment</span></button>
        </div>
      </div>

      <EmbedCodeButton slug="life-expectancy-calculator" title="Life Expectancy Calculator" glow={GLOW} />
      <ToolCommentSection seedComments={LIFE_EXPECTANCY_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />
      <ToastHost toast={toast} />
    </div>
  );
}
