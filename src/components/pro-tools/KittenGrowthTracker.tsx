// FILE: src/components/pro-tools/KittenGrowthTracker.tsx
'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { EmbedCodeButton } from '@/components/embeds/EmbedCodeButton';
import { KITTEN_GROWTH_COMMENTS } from './kittenGrowthComments';
import { BREED_SIZES, KITTEN_MILESTONES, getMilestonesForBreed, expectedWeightKgAtDay, currentAgeParts, type BreedSize, type KittenMilestone } from '@/lib/kittenMilestones';

const GLOW = '224, 146, 66'; // warm amber — playful, distinct from Life Expectancy's green
const PRO_MAX_LITTER = 5;

interface WeightEntry { date: string; valueKg: number; }
interface MilestoneLogEntry { milestoneId: string; actualDate: string; note?: string; }
interface LitterMate { id: string; label: string; birthDate: string; breedSize: BreedSize; }

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

function DevelopmentRing({ percent, glow, label, sub }: { percent: number; glow: string; label: string; sub: string }) {
  const r = 52, c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <svg width={128} height={128} viewBox="0 0 128 128">
        <circle cx={64} cy={64} r={r} fill="none" stroke="var(--border-hairline)" strokeWidth={10} />
        <circle cx={64} cy={64} r={r} fill="none" stroke={`rgb(${glow})`} strokeWidth={10}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 64 64)" style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
        <text x={64} y={60} textAnchor="middle" fontSize={22} fontWeight={700} fill={`rgb(${glow})`}>{Math.round(percent)}%</text>
        <text x={64} y={78} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">grown</text>
      </svg>
      <p className="text-footnote font-semibold mt-1 text-center">{label}</p>
      <p className="text-caption text-center" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>
    </div>
  );
}

// ── Draggable age-preview scrubber — distinct interaction pattern from Life Expectancy ──
function AgeScrubber({ maxDays, todayDays, previewDays, onPreview, milestones, glow }: {
  maxDays: number; todayDays: number; previewDays: number; onPreview: (d: number) => void;
  milestones: KittenMilestone[]; glow: string;
}) {
  return (
    <div className="ios-card-nested p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-caption font-semibold" style={{ color: 'var(--text-secondary)' }}>DRAG TO PREVIEW ANY AGE</p>
        <p className="text-caption font-bold" style={{ color: `rgb(${glow})` }}>Day {previewDays} · {(previewDays / 7).toFixed(1)}w</p>
      </div>
      <div className="relative pt-4 pb-1">
        {milestones.map(m => (
          <div key={m.id} className="absolute top-0 flex flex-col items-center" style={{ left: `${(m.dayEstimate / maxDays) * 100}%`, transform: 'translateX(-50%)' }}>
            <span className="text-xs">{m.emoji}</span>
          </div>
        ))}
        <input
          type="range" min={0} max={maxDays} value={previewDays}
          onChange={e => onPreview(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: `rgb(${glow})` }}
        />
        <div className="absolute bottom-1 h-2 w-0.5" style={{ left: `${(todayDays / maxDays) * 100}%`, background: 'var(--text-tertiary)' }} title="Today" />
      </div>
    </div>
  );
}

function WeightChart({ entries, breedSize, maxDays, glow }: { entries: WeightEntry[]; breedSize: BreedSize; maxDays: number; glow: string }) {
  const W = 400, H = 130, PAD = 10;
  const xFor = (day: number) => PAD + (day / maxDays) * (W - PAD * 2);
  const maxKg = Math.max(BREED_SIZES[breedSize].adultWeightKg[1], ...entries.map(e => e.valueKg), 1);
  const yFor = (kg: number) => H - PAD - (kg / maxKg) * (H - PAD * 2);

  const expectedPts: string[] = [];
  for (let d = 0; d <= maxDays; d += Math.max(1, Math.round(maxDays / 40))) {
    expectedPts.push(`${d === 0 ? 'M' : 'L'} ${xFor(d)},${yFor(expectedWeightKgAtDay(d, breedSize))}`);
  }
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <path d={expectedPts.join(' ')} fill="none" stroke="var(--text-tertiary)" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} />
      {sortedEntries.length > 1 && (
        <path
          d={sortedEntries.map((e, i) => `${i === 0 ? 'M' : 'L'} ${xFor(Math.round((new Date(e.date).getTime() - new Date(sortedEntries[0].date).getTime()) / 86400000))},${yFor(e.valueKg)}`).join(' ')}
          fill="none" stroke={`rgb(${glow})`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
        />
      )}
      <text x={PAD} y={H - 2} fontSize={9} fill="var(--text-tertiary)">Birth</text>
      <text x={W - PAD} y={H - 2} fontSize={9} fill="var(--text-tertiary)" textAnchor="end">{Math.round(maxDays / 30.44)}mo</text>
    </svg>
  );
}

export function KittenGrowthTracker() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';

  const [birthDate, setBirthDate] = useState<string>('');
  const [breedSize, setBreedSize] = useState<BreedSize>('MEDIUM');
  const [configLoaded, setConfigLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPersisted, setIsPersisted] = useState(false);

  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [weightForm, setWeightForm] = useState({ date: '', valueKg: 0.5 });
  const [milestoneLog, setMilestoneLog] = useState<MilestoneLogEntry[]>([]);
  const [litter, setLitter] = useState<LitterMate[]>([]);
  const [litterForm, setLitterForm] = useState({ label: '', birthDate: '', breedSize: 'MEDIUM' as BreedSize });
  const [showLitterForm, setShowLitterForm] = useState(false);

  const [previewDays, setPreviewDays] = useState(0);
  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(31);

  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/kitten-growth-tracker')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setBirthDate(new Date(data.config.birthDate).toISOString().slice(0, 10));
          setBreedSize(data.config.breedSize ?? 'MEDIUM');
          setWeightEntries(data.config.weightEntries ?? []);
          setMilestoneLog(data.config.milestoneLog ?? []);
          setLitter(data.config.litterMates ?? []);
          setIsPersisted(true);
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const milestones = useMemo(() => getMilestonesForBreed(breedSize), [breedSize]);
  const maxDays = milestones[milestones.length - 1].dayEstimate;
  const birth = birthDate ? new Date(birthDate) : null;
  const age = birth ? currentAgeParts(birth) : null;

  useEffect(() => { if (age) setPreviewDays(Math.min(maxDays, age.days)); }, [birthDate, maxDays]); // eslint-disable-line

  const nextMilestone = useMemo(() => {
    if (!age) return null;
    return milestones.find(m => m.dayEstimate > age.days) ?? null;
  }, [milestones, age]);

  const nextMilestoneTargetIso = useMemo(() => {
    if (!birth || !nextMilestone) return null;
    return new Date(birth.getTime() + nextMilestone.dayEstimate * 86400000).toISOString();
  }, [birth, nextMilestone]);

  const previewMilestone = useMemo(() => {
    let closest = milestones[0];
    for (const m of milestones) if (Math.abs(m.dayEstimate - previewDays) < Math.abs(closest.dayEstimate - previewDays)) closest = m;
    return closest;
  }, [milestones, previewDays]);

  const developmentPercent = age ? Math.min(100, (age.days / maxDays) * 100) : 0;

  function handleSetToday() { setBirthDate(new Date().toISOString().slice(0, 10)); }

  async function handleSave() {
    if (!isPro || !birthDate) { showToast('Upgrade to Pro to save this tracker', '⭐'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/tools/kitten-growth-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthDate, breedSize, weightEntries, milestoneLog, litterMates: litter }),
      });
      if (!res.ok) throw new Error('save failed');
      setIsPersisted(true);
      showToast('Tracker saved', '💾');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setBirthDate(''); setBreedSize('MEDIUM'); setWeightEntries([]); setMilestoneLog([]); setLitter([]);
    showToast('Reset', '↺');
  }

  function addWeightEntry() {
    if (!isPro) { showToast('Upgrade to Pro to log weight', '⭐'); return; }
    if (!weightForm.date) { showToast('Pick a date first', '⚠️'); return; }
    setWeightEntries(prev => [...prev, { ...weightForm }]);
    setWeightForm({ date: '', valueKg: 0.5 });
  }

  function logMilestone(milestoneId: string) {
    if (!isPro) { showToast('Upgrade to Pro to log actual milestone dates', '⭐'); return; }
    const today = new Date().toISOString().slice(0, 10);
    setMilestoneLog(prev => prev.some(l => l.milestoneId === milestoneId) ? prev : [...prev, { milestoneId, actualDate: today }]);
  }

  function addLitterMate() {
    if (!isPro) { showToast('Upgrade to Pro to compare littermates', '⭐'); return; }
    if (litter.length >= PRO_MAX_LITTER) { showToast(`Up to ${PRO_MAX_LITTER} littermates`, '⚠️'); return; }
    if (!litterForm.label.trim() || !litterForm.birthDate) { showToast('Give this kitten a name and birth date', '⚠️'); return; }
    setLitter(prev => [...prev, { id: crypto.randomUUID(), ...litterForm }]);
    setShowLitterForm(false);
    setLitterForm({ label: '', birthDate: '', breedSize: 'MEDIUM' });
  }
  function removeLitterMate(id: string) { setLitter(prev => prev.filter(m => m.id !== id)); }

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

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>BIOLOGY</p>
            <h2 className="text-title2">Kitten Growth Tracker</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleReset} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>↺ Reset</button>
            <button onClick={handleSave} disabled={saving || !birthDate}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? 'Save this tracker to your account' : 'Upgrade to keep this tracker running'}>
              {isPro ? '💾' : '🔒'} {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-caption font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Kitten's birth date</label>
            <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
              className="ios-card-nested w-full px-3 py-2.5 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-caption font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Breed size</label>
            <select value={breedSize} onChange={e => setBreedSize(e.target.value as BreedSize)}
              className="ios-card-nested w-full px-3 py-2.5 text-sm focus:outline-none">
              {(Object.keys(BREED_SIZES) as BreedSize[]).map(k => <option key={k} value={k}>{BREED_SIZES[k].label}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleSetToday} className="text-caption mb-6" style={{ color: `rgb(${GLOW})` }}>Not sure? Use today's date as a placeholder →</button>

        {birthDate && age && (
          <>
            <div className="flex items-center gap-2 mb-5 text-caption" style={{ color: 'var(--text-tertiary)' }}>
              <span>📚</span><span>Based on ASPCA / AAHA feline life-stage guidelines — individual kittens vary.</span>
            </div>

            {/* Headline + countdown */}
            <div className="ios-card-nested p-5 mb-5" style={{ background: `rgba(${GLOW}, 0.08)` }}>
              <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                <div>
                  <p className="text-caption mb-1">CURRENT AGE</p>
                  <p className="text-largetitle tabular font-bold" style={{ color: `rgb(${GLOW})` }}>{age.weeks} <span className="text-title2">weeks</span></p>
                  <p className="text-footnote mt-1" style={{ color: 'var(--text-secondary)' }}>{age.days} days · {age.months} months</p>
                </div>
                {nextMilestone && (
                  <div className="text-right">
                    <p className="text-caption mb-1">NEXT: {nextMilestone.emoji} {nextMilestone.label.toUpperCase()}</p>
                  </div>
                )}
              </div>
              {nextMilestoneTargetIso && (
                <>
                  <p className="text-caption font-semibold mb-2 text-center" style={{ color: 'var(--text-secondary)' }}>TIME UNTIL NEXT MILESTONE</p>
                  <CountdownTimer targetIso={nextMilestoneTargetIso} glow={GLOW} />
                </>
              )}
              {!isPro && (
                <p className="text-caption text-center mt-3" style={{ color: 'var(--text-tertiary)' }}>
                  🔒 This resets when you leave. <button onClick={handleSave} className="underline font-semibold" style={{ color: `rgb(${GLOW})` }}>Go Pro</button> to pin it.
                </p>
              )}
              {isPro && isPersisted && (
                <p className="text-caption text-center mt-3" style={{ color: 'var(--text-tertiary)' }}>✓ Saved — picks up right where it left off, every visit.</p>
              )}
            </div>

            {/* Ring + scrubber */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div className="ios-card-nested p-5 flex items-center justify-center">
                <DevelopmentRing percent={developmentPercent} glow={GLOW} label="of the way to fully grown" sub={`Day ${age.days} of ~${maxDays}`} />
              </div>
              <div className="ios-card-nested p-5">
                <p className="text-footnote font-semibold mb-2">{previewMilestone.emoji} At day {previewDays}: {previewMilestone.label}</p>
                <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>{previewMilestone.blurb}</p>
              </div>
            </div>

            <div className="mb-6">
              <AgeScrubber maxDays={maxDays} todayDays={age.days} previewDays={previewDays} onPreview={setPreviewDays} milestones={milestones} glow={GLOW} />
            </div>

            {/* Weight chart (Pro) */}
            <div className="mb-6">
              <p className="text-footnote font-semibold mb-2">Weight growth {!isPro && <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>(Pro — log actual weight vs. breed average)</span>}</p>
              {isPro ? (
                <div className="ios-card-nested p-4">
                  <WeightChart entries={weightEntries} breedSize={breedSize} maxDays={maxDays} glow={GLOW} />
                  <div className="flex gap-2 mt-3">
                    <input type="date" value={weightForm.date} onChange={e => setWeightForm(f => ({ ...f, date: e.target.value }))}
                      className="ios-card-nested px-2 py-2 text-xs flex-1 focus:outline-none" />
                    <input type="number" step={0.05} min={0.05} value={weightForm.valueKg}
                      onChange={e => setWeightForm(f => ({ ...f, valueKg: Number(e.target.value) || 0 }))}
                      className="ios-card-nested px-2 py-2 text-xs w-20 focus:outline-none" />
                    <button onClick={addWeightEntry} className="btn-filled press text-xs px-3">+ Log kg</button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="pointer-events-none select-none ios-card-nested p-6" style={{ filter: 'blur(3px)', opacity: 0.55 }}><div className="h-14" /></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-4">
                    <span className="text-2xl">🔒</span>
                    <p className="text-footnote font-bold">Track real weight against the breed curve</p>
                    <button onClick={handleSave} className="btn-filled press text-xs px-4 py-2 mt-1">Upgrade to Premium — $9.99/mo</button>
                  </div>
                </div>
              )}
            </div>

            {/* Milestone grid */}
            <div className="mb-6">
              <p className="text-footnote font-semibold mb-2">Milestone timeline</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {milestones.map(m => {
                  const reached = age.days >= m.dayEstimate;
                  const logged = milestoneLog.find(l => l.milestoneId === m.id);
                  return (
                    <button key={m.id} onClick={() => logMilestone(m.id)}
                      className="ios-card-nested press flex items-start gap-2.5 p-3 text-left transition-colors"
                      style={{ border: reached ? `1.5px solid rgb(${GLOW})` : '1.5px solid transparent', background: reached ? `rgba(${GLOW}, 0.08)` : undefined }}>
                      <span className="text-base flex-shrink-0">{m.emoji}</span>
                      <span className="flex-1 min-w-0">
                        <span className="text-footnote block">{m.label}</span>
                        <span className="text-caption block" style={{ color: 'var(--text-tertiary)' }}>
                          ~day {m.dayEstimate} ({m.rangeDays[0]}–{m.rangeDays[1]}){logged ? ` · logged ${logged.actualDate}` : isPro ? ' · tap to log' : ''}
                        </span>
                      </span>
                      {reached && <span style={{ color: `rgb(${GLOW})` }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Litter compare */}
            <div className="mb-6">
              <p className="text-footnote font-semibold mb-2">Compare littermates {!isPro && <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>(Pro — up to {PRO_MAX_LITTER})</span>}</p>
              {isPro ? (
                <div className="flex flex-col gap-2">
                  {litter.map(k => (
                    <div key={k.id} className="ios-card-nested p-3 flex items-center justify-between gap-3">
                      <p className="text-footnote font-semibold">{k.label} <span style={{ color: 'var(--text-tertiary)' }}>· {BREED_SIZES[k.breedSize].label}</span></p>
                      <button onClick={() => removeLitterMate(k.id)} className="text-gray-400 hover:text-red-500 px-2 flex-shrink-0">×</button>
                    </div>
                  ))}
                  {showLitterForm ? (
                    <div className="ios-card-nested p-4 flex flex-col gap-2.5 anim-fade-up">
                      <input value={litterForm.label} onChange={e => setLitterForm(f => ({ ...f, label: e.target.value }))}
                        placeholder="Name, e.g. 'Whiskers'" className="ios-card-nested px-3 py-2 text-sm focus:outline-none" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={litterForm.birthDate} onChange={e => setLitterForm(f => ({ ...f, birthDate: e.target.value }))}
                          className="ios-card-nested px-2 py-2 text-sm focus:outline-none" />
                        <select value={litterForm.breedSize} onChange={e => setLitterForm(f => ({ ...f, breedSize: e.target.value as BreedSize }))}
                          className="ios-card-nested px-2 py-2 text-sm focus:outline-none">
                          {(Object.keys(BREED_SIZES) as BreedSize[]).map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={addLitterMate} className="btn-filled press text-sm flex-1">Add</button>
                        <button onClick={() => setShowLitterForm(false)} className="ios-card-nested press text-sm px-4" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    litter.length < PRO_MAX_LITTER && (
                      <button onClick={() => setShowLitterForm(true)} className="ios-card-nested press text-xs px-3 py-2 self-start" style={{ color: 'var(--text-secondary)' }}>+ Add littermate</button>
                    )
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="pointer-events-none select-none ios-card-nested p-6" style={{ filter: 'blur(3px)', opacity: 0.55 }}><div className="h-14" /></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-4">
                    <span className="text-2xl">🔒</span>
                    <p className="text-footnote font-bold">See the whole litter side-by-side</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!isPro && (
          <div className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap" style={{ border: '1px solid var(--border-hairline)' }}>
            <div>
              <p className="text-footnote font-bold mb-0.5">🔒 Free plan: estimates only, no saved tracker</p>
              <p className="text-caption">Upgrade to log actual dates, track weight, and compare littermates.</p>
            </div>
            <button onClick={handleSave} className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Upgrade to Premium — $9.99/mo</button>
          </div>
        )}

        <div className="ios-card-nested p-4 mb-2 flex gap-3 items-start" style={{ borderLeft: `3px solid rgb(${GLOW})` }}>
          <span className="text-lg flex-shrink-0">ℹ️</span>
          <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
            Estimates reflect commonly-cited averages across breeds — individual kittens vary, and this isn't veterinary advice. Always check with a vet for health concerns.
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

      <div className="flex justify-center mt-4 mb-4"><EmbedCodeButton slug="kitten-growth-tracker" title="Kitten Growth Tracker" glow={GLOW} /></div>
      <ToolCommentSection seedComments={KITTEN_GROWTH_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />
      <ToastHost toast={toast} />
    </div>
  );
}
