// FILE: src/components/pro-tools/EggHatchCalculator.tsx
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { CommentThread } from '@/components/community/CommentThread';
import { EmbedCodeButton } from '@/components/embeds/EmbedCodeButton';
import { EGG_SPECIES, turningPlan, type EggSpecies, type IncubatorType } from '@/lib/eggHatchSpecies';

const GLOW = '91, 192, 222'; // eggshell / robin's-egg blue
const PRO_MAX_BATCH = 12;

interface TurningLogEntry { day: number; turnedAt: string; }
interface BatchEgg { id: string; label: string; candledViable: boolean | null; notes?: string; }

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
  const units = [{ v: days, l: 'days' }, { v: hours, l: 'hrs' }, { v: minutes, l: 'min' }, { v: seconds, l: 'sec' }];
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {units.map(u => (
        <div key={u.l} className="ios-card-nested px-3 py-2 sm:px-4 sm:py-3 text-center min-w-[64px]">
          <div className="text-title2 font-bold tabular" style={{ color: `rgb(${glow})` }}>{u.v.toLocaleString()}</div>
          <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{u.l}</div>
        </div>
      ))}
    </div>
  );
}

function HatchRing({ percent, glow }: { percent: number; glow: string }) {
  const r = 52, c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c;
  return (
    <svg width={128} height={128} viewBox="0 0 128 128">
      <circle cx={64} cy={64} r={r} fill="none" stroke="var(--border-hairline)" strokeWidth={10} />
      <circle cx={64} cy={64} r={r} fill="none" stroke={`rgb(${glow})`} strokeWidth={10}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 64 64)" style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
      <text x={64} y={60} textAnchor="middle" fontSize={22} fontWeight={700} fill={`rgb(${glow})`}>{Math.round(percent)}%</text>
      <text x={64} y={78} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">to hatch</text>
    </svg>
  );
}

function SpeciesPicker({ selected, onSelect, glow }: { selected: string; onSelect: (id: string) => void; glow: string }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollSnapType: 'x mandatory' }}>
      {EGG_SPECIES.map(s => (
        <button key={s.id} onClick={() => onSelect(s.id)}
          className="ios-card-nested press flex-shrink-0 flex flex-col items-center gap-1 p-3 transition-colors"
          style={{ width: 92, scrollSnapAlign: 'start', border: selected === s.id ? `1.5px solid rgb(${glow})` : '1.5px solid transparent', background: selected === s.id ? `rgba(${glow}, 0.08)` : undefined }}>
          <span className="text-2xl">{s.emoji}</span>
          <span className="text-caption font-semibold text-center leading-tight">{s.label}</span>
          <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{s.incubationDays}d</span>
        </button>
      ))}
    </div>
  );
}

function TurningCalendarGrid({ species, log, isPro, onToggleDay, glow }: {
  species: EggSpecies; log: TurningLogEntry[]; isPro: boolean; onToggleDay: (day: number) => void; glow: string;
}) {
  const plan = turningPlan(species);
  if (!plan) return null;
  const days = Array.from({ length: species.incubationDays }, (_, i) => i + 1);
  return (
    <div className="ios-card-nested p-4">
      <div className="flex items-center gap-4 mb-3 text-caption" style={{ color: 'var(--text-secondary)' }}>
        <span>{'\u{1F504}'} Turn days 1-{plan.turnUntilDay}</span>
        <span>{'\u{1F512}'} Lockdown days {plan.lockdownStartsDay}-{plan.hatchDay}</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(d => {
          const isLockdown = d >= plan.lockdownStartsDay;
          const logged = log.some(l => l.day === d);
          return (
            <button key={d} onClick={() => !isLockdown && onToggleDay(d)} disabled={isLockdown}
              className="press aspect-square rounded-lg text-xs font-semibold flex items-center justify-center transition-colors"
              style={{
                background: isLockdown ? `rgba(${glow}, 0.25)` : logged ? `rgb(${glow})` : 'var(--border-hairline)',
                color: isLockdown ? `rgb(${glow})` : logged ? 'white' : 'var(--text-secondary)',
                cursor: isLockdown ? 'default' : isPro ? 'pointer' : 'not-allowed',
                opacity: !isPro && !isLockdown ? 0.6 : 1,
              }}>
              {isLockdown ? '\u{1F512}' : d}
            </button>
          );
        })}
      </div>
      {!isPro && <p className="text-caption mt-2" style={{ color: 'var(--text-tertiary)' }}>{'\u{1F512}'} Upgrade to Pro to check off each day as you turn.</p>}
    </div>
  );
}

function HumidityGauge({ species, incubatorType, inLockdown, glow }: { species: EggSpecies; incubatorType: IncubatorType; inLockdown: boolean; glow: string }) {
  const targetTemp = incubatorType === 'STILL_AIR' ? species.tempStillAirF : species.tempForcedAirF;
  const targetHumidity = inLockdown ? species.humidityLockdown : species.humidityIncubation;
  const pct = Math.min(100, ((targetHumidity ?? 0) / 80) * 100);
  const W = 200, H = 110, cx = 100, cy = 100, r = 80;
  const angle = (pct / 100) * 180;
  const rad = (Math.PI / 180) * (180 - angle);
  const nx = cx + r * Math.cos(rad), ny = cy - r * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;
  return (
    <div className="flex flex-col items-center">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="var(--border-hairline)" strokeWidth={14} strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${nx} ${ny}`} fill="none" stroke={`rgb(${glow})`} strokeWidth={14} strokeLinecap="round" />
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={20} fontWeight={700} fill={`rgb(${glow})`}>{targetHumidity}%</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">humidity target{inLockdown ? ' (lockdown)' : ''}</text>
      </svg>
      <p className="text-footnote font-semibold -mt-2">{'\u{1F321}\u{FE0F}'} Temp target: {targetTemp}{'\u{00B0}'}F</p>
    </div>
  );
}

function ComparisonBars({ rows, glow }: { rows: { label: string; value: number; highlight?: boolean }[]; glow: string }) {
  const max = Math.max(...rows.map(r => r.value), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map(r => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="text-caption w-28 flex-shrink-0 truncate" style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
          <div className="flex-1 h-2.5 rounded-full" style={{ background: 'var(--border-hairline)' }}>
            <div className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(r.value / max) * 100}%`, background: r.highlight ? `rgb(${glow})` : 'var(--text-tertiary)', opacity: r.highlight ? 1 : 0.5 }} />
          </div>
          <span className="text-caption font-bold w-14 text-right flex-shrink-0" style={{ color: r.highlight ? `rgb(${glow})` : 'var(--text-secondary)' }}>{r.value}d</span>
        </div>
      ))}
    </div>
  );
}

export function EggHatchCalculator() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';

  const [speciesId, setSpeciesId] = useState('CHICKEN');
  const [incubatorType, setIncubatorType] = useState<IncubatorType>('FORCED_AIR');
  const [startDate, setStartDate] = useState('');
  const [configLoaded, setConfigLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPersisted, setIsPersisted] = useState(false);

  const [turningLog, setTurningLog] = useState<TurningLogEntry[]>([]);
  const [batch, setBatch] = useState<BatchEgg[]>([]);
  const [batchForm, setBatchForm] = useState({ label: '' });
  const [showBatchForm, setShowBatchForm] = useState(false);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(22);

  const species = EGG_SPECIES.find(s => s.id === speciesId)!;
  const plan = turningPlan(species);

  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/egg-hatch-calculator')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setSpeciesId(data.config.species);
          setIncubatorType(data.config.incubatorType ?? 'FORCED_AIR');
          setStartDate(new Date(data.config.startDate).toISOString().slice(0, 10));
          setTurningLog(data.config.turningLog ?? []);
          setBatch(data.config.eggBatch ?? []);
          setIsPersisted(true);
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const start = startDate ? new Date(startDate) : null;
  const dayNow = start ? Math.floor((Date.now() - start.getTime()) / 86400000) : 0;
  const hatchTargetIso = start ? new Date(start.getTime() + species.incubationDays * 86400000).toISOString() : null;
  const percentToHatch = start ? Math.min(100, (dayNow / species.incubationDays) * 100) : 0;
  const inLockdown = plan ? dayNow >= plan.lockdownStartsDay : false;

  const comparisonRows = useMemo(() =>
    EGG_SPECIES.map(s => ({ label: s.label, value: s.incubationDays, highlight: s.id === speciesId })),
  [speciesId]);

  function handleSetToday() { setStartDate(new Date().toISOString().slice(0, 10)); }

  async function handleSave() {
    if (!isPro || !startDate) { showToast('Upgrade to Pro to save this tracker', '\u{2B50}'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/tools/egg-hatch-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ species: speciesId, incubatorType, startDate, turningLog, eggBatch: batch }),
      });
      if (!res.ok) throw new Error('save failed');
      setIsPersisted(true);
      showToast('Tracker saved', '\u{1F4BE}');
    } catch {
      showToast('Could not save - try again', '\u{26A0}\u{FE0F}');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setSpeciesId('CHICKEN'); setIncubatorType('FORCED_AIR'); setStartDate(''); setTurningLog([]); setBatch([]);
    showToast('Reset', '\u{21BA}');
  }

  function toggleTurnDay(day: number) {
    if (!isPro) { showToast('Upgrade to Pro to log daily turning', '\u{2B50}'); return; }
    setTurningLog(prev => prev.some(l => l.day === day) ? prev.filter(l => l.day !== day) : [...prev, { day, turnedAt: new Date().toISOString() }]);
  }

  function addBatchEgg() {
    if (!isPro) { showToast('Upgrade to Pro to track a clutch', '\u{2B50}'); return; }
    if (batch.length >= PRO_MAX_BATCH) { showToast(`Up to ${PRO_MAX_BATCH} eggs`, '\u{26A0}\u{FE0F}'); return; }
    if (!batchForm.label.trim()) { showToast('Give this egg a label', '\u{26A0}\u{FE0F}'); return; }
    setBatch(prev => [...prev, { id: crypto.randomUUID(), label: batchForm.label, candledViable: null }]);
    setShowBatchForm(false);
    setBatchForm({ label: '' });
  }
  function setCandled(id: string, viable: boolean | null) {
    setBatch(prev => prev.map(e => e.id === id ? { ...e, candledViable: viable } : e));
  }
  function removeBatchEgg(id: string) { setBatch(prev => prev.filter(e => e.id !== id)); }

  function requireAuth() { showToast('You need to sign up first', '\u{1F512}'); }
  function handleLike() {
    if (!session) { requireAuth(); return; }
    setToolLiked(prev => { setToolLikeCount(c => (prev ? c - 1 : c + 1)); return !prev; });
  }
  function handleShare() {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => showToast('Link copied!', '\u{1F517}')).catch(() => showToast('Could not copy link', '\u{26A0}\u{FE0F}'));
  }
  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>BIOLOGY</p>
            <h2 className="text-title2">Egg Hatch Countdown Calculator</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleReset} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{'\u{21BA}'} Reset</button>
            <button onClick={handleSave} disabled={saving || !startDate}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
              {isPro ? '\u{1F4BE}' : '\u{1F512}'} {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <p className="text-caption font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Pick a species</p>
        <div className="mb-4"><SpeciesPicker selected={speciesId} onSelect={setSpeciesId} glow={GLOW} /></div>

        <div className="mb-6">
          <label className="text-caption font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
            {species.mode === 'INCUBATOR' ? 'Incubation start date' : 'Date incubation began (first egg laid, or when you noticed)'}
          </label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="ios-card-nested w-full px-3 py-2.5 text-sm focus:outline-none" />
          <button onClick={handleSetToday} className="text-caption mt-1.5" style={{ color: `rgb(${GLOW})` }}>Use today's date {'\u{2192}'}</button>
        </div>

        {startDate && (
          <>
            <div className="ios-card-nested p-5 mb-5" style={{ background: `rgba(${GLOW}, 0.08)` }}>
              <p className="text-caption mb-1">{species.emoji} {species.label.toUpperCase()} - DAY {Math.max(0, dayNow)} OF {species.incubationDays}</p>
              <p className="text-caption font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>TIME UNTIL HATCH</p>
              <CountdownTimer targetIso={hatchTargetIso} glow={GLOW} />
              {!isPro && (
                <p className="text-caption text-center mt-3" style={{ color: 'var(--text-tertiary)' }}>
                  {'\u{1F512}'} This resets when you leave. <button onClick={handleSave} className="underline font-semibold" style={{ color: `rgb(${GLOW})` }}>Go Pro</button> to pin it.
                </p>
              )}
              {isPro && isPersisted && (
                <p className="text-caption text-center mt-3" style={{ color: 'var(--text-tertiary)' }}>{'\u{2713}'} Saved - picks up right where it left off.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div className="ios-card-nested p-5 flex items-center justify-center"><HatchRing percent={percentToHatch} glow={GLOW} /></div>
              <div className="ios-card-nested p-5">
                <p className="text-footnote font-semibold mb-2">{species.emoji} About {species.label} eggs</p>
                <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>{species.blurb}</p>
              </div>
            </div>

            {species.mode === 'INCUBATOR' ? (
              <>
                <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
                  <p className="text-footnote font-semibold">Turning &amp; lockdown schedule</p>
                  <div className="ios-card-nested p-1 flex gap-1">
                    {(['FORCED_AIR', 'STILL_AIR'] as IncubatorType[]).map(t => (
                      <button key={t} onClick={() => setIncubatorType(t)}
                        className="press px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors"
                        style={{ background: incubatorType === t ? `rgb(${GLOW})` : 'transparent', color: incubatorType === t ? 'white' : 'var(--text-secondary)' }}>
                        {t === 'FORCED_AIR' ? 'Forced-air' : 'Still-air'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-6"><TurningCalendarGrid species={species} log={turningLog} isPro={isPro} onToggleDay={toggleTurnDay} glow={GLOW} /></div>

                <div className="mb-6 flex justify-center">
                  <HumidityGauge species={species} incubatorType={incubatorType} inLockdown={inLockdown} glow={GLOW} />
                </div>

                <div className="mb-6">
                  <p className="text-footnote font-semibold mb-2">Clutch tracker {!isPro && <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>(Pro - up to {PRO_MAX_BATCH} eggs)</span>}</p>
                  {isPro ? (
                    <div className="flex flex-col gap-2">
                      {batch.map(e => (
                        <div key={e.id} className="ios-card-nested p-3 flex items-center justify-between gap-3">
                          <span className="text-footnote font-semibold">{e.label}</span>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setCandled(e.id, true)} className="press px-2 py-1 rounded-lg text-xs" style={{ background: e.candledViable === true ? 'rgba(52,199,89,0.2)' : 'var(--border-hairline)', color: e.candledViable === true ? 'rgb(52,199,89)' : 'var(--text-secondary)' }}>{'\u{2713}'} Viable</button>
                            <button onClick={() => setCandled(e.id, false)} className="press px-2 py-1 rounded-lg text-xs" style={{ background: e.candledViable === false ? 'rgba(255,59,48,0.15)' : 'var(--border-hairline)', color: e.candledViable === false ? 'rgb(255,59,48)' : 'var(--text-secondary)' }}>{'\u{2715}'} Not viable</button>
                            <button onClick={() => removeBatchEgg(e.id)} className="text-gray-400 hover:text-red-500 px-1">{'\u{00D7}'}</button>
                          </div>
                        </div>
                      ))}
                      {showBatchForm ? (
                        <div className="ios-card-nested p-4 flex gap-2 anim-fade-up">
                          <input value={batchForm.label} onChange={e => setBatchForm({ label: e.target.value })} placeholder="Egg label, e.g. 'Egg 3'" className="ios-card-nested px-3 py-2 text-sm flex-1 focus:outline-none" />
                          <button onClick={addBatchEgg} className="btn-filled press text-sm px-4">Add</button>
                          <button onClick={() => setShowBatchForm(false)} className="ios-card-nested press text-sm px-4" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
                        </div>
                      ) : (
                        batch.length < PRO_MAX_BATCH && <button onClick={() => setShowBatchForm(true)} className="ios-card-nested press text-xs px-3 py-2 self-start" style={{ color: 'var(--text-secondary)' }}>+ Add egg to clutch</button>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="pointer-events-none select-none ios-card-nested p-6" style={{ filter: 'blur(3px)', opacity: 0.55 }}><div className="h-14" /></div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-4">
                        <span className="text-2xl">{'\u{1F512}'}</span>
                        <p className="text-footnote font-bold">Track candling results per egg</p>
                        <button onClick={handleSave} className="btn-filled press text-xs px-4 py-2 mt-1">Upgrade to Premium - $9.99/mo</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="ios-card-nested p-4 mb-6 flex gap-3 items-start" style={{ borderLeft: '3px solid rgb(255, 184, 0)' }}>
                <span className="text-lg flex-shrink-0">{'\u{1F426}'}</span>
                <div>
                  <p className="text-footnote font-bold mb-1">This is a nest-watch estimate, not an incubation guide</p>
                  <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
                    {species.label} eggs are incubated by the parent bird, not a human. In the US, disturbing a wild bird's active nest or eggs is protected under the Migratory Bird Treaty Act. If you found an egg or nestling that seems abandoned or injured, contact a licensed wildlife rehabilitator rather than intervening yourself.
                  </p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <p className="text-footnote font-semibold mb-2">How species compare</p>
              <div className="ios-card-nested p-5"><ComparisonBars rows={comparisonRows} glow={GLOW} /></div>
            </div>
          </>
        )}

        {!isPro && (
          <div className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap" style={{ border: '1px solid var(--border-hairline)' }}>
            <div>
              <p className="text-footnote font-bold mb-0.5">{'\u{1F512}'} Free plan: estimates only, no saved tracker</p>
              <p className="text-caption">Upgrade to log daily turning, track a whole clutch, and save across visits.</p>
            </div>
            <button onClick={handleSave} className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Upgrade to Premium - $9.99/mo</button>
          </div>
        )}

        <div className="ios-card-nested p-4 mb-2 flex gap-3 items-start" style={{ borderLeft: `3px solid rgb(${GLOW})` }}>
          <span className="text-lg flex-shrink-0">{'\u{2139}\u{FE0F}'}</span>
          <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
            Incubation lengths and targets are commonly-cited averages - actual hatch timing varies by breed, fertility, and conditions. Not veterinary or wildlife-rehabilitation advice.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: toolLiked ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>
            <span style={{ transform: toolLiked ? 'scale(1.2)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>{toolLiked ? '\u{2764}\u{FE0F}' : '\u{1F90D}'}</span>
            <span className="text-footnote font-semibold">{toolLikeCount}</span>
          </button>
          <button onClick={handleShare} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>{'\u{1F517}'} <span className="text-footnote font-semibold">Share</span></button>
          <button onClick={handleCommentJump} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>{'\u{1F4AC}'} <span className="text-footnote font-semibold">Comment</span></button>
        </div>
      </div>

      <div className="flex justify-center mt-4 mb-4"><EmbedCodeButton slug="egg-hatch-calculator" title="Egg Hatch Countdown Calculator" glow={GLOW} /></div>
      <CommentThread subjectType="tool" subjectId="egg-hatch-calculator" glow={GLOW} />
      <ToastHost toast={toast} />
    </div>
  );
}