// FILE: src/components/pro-tools/PetGrowthGestationTracker.tsx
'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { CommentThread } from '@/components/community/CommentThread';
import { EmbedCodeButton } from '@/components/embeds/EmbedCodeButton';

const GLOW = '255, 173, 74';
const PRO_MAX_PETS = 5;
const GESTATION_DAYS = 64; // cats and dogs both average ~63-65 days

type Species = 'CAT' | 'DOG';
type BreedSize = 'TOY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'GIANT';
type Mode = 'GROWTH' | 'GESTATION';

const BREED_SIZES: { id: BreedSize; label: string; maturityWeeks: number; example: string }[] = [
  { id: 'TOY',    label: 'Toy',    maturityWeeks: 40, example: 'Chihuahua, Yorkie' },
  { id: 'SMALL',  label: 'Small',  maturityWeeks: 48, example: 'Beagle, Dachshund' },
  { id: 'MEDIUM', label: 'Medium', maturityWeeks: 56, example: 'Border Collie, Bulldog' },
  { id: 'LARGE',  label: 'Large',  maturityWeeks: 68, example: 'Labrador, Shepherd' },
  { id: 'GIANT',  label: 'Giant',  maturityWeeks: 90, example: 'Great Dane, Mastiff' },
];
const CAT_MATURITY_WEEKS = 52;

const GESTATION_STAGES = [
  { week: 1, label: 'Fertilization',    emoji: '🧬' },
  { week: 2, label: 'Implantation',     emoji: '🌱' },
  { week: 3, label: 'Embryo forms',     emoji: '💗' },
  { week: 4, label: 'Organs develop',   emoji: '🫀' },
  { week: 5, label: 'Whiskers & claws', emoji: '🐾' },
  { week: 6, label: 'Fur begins',       emoji: '🧶' },
  { week: 7, label: 'Skeleton hardens', emoji: '🦴' },
  { week: 8, label: 'Rapid growth',     emoji: '📈' },
  { week: 9, label: 'Birth-ready',      emoji: '🍼' },
];

interface Pet {
  id: string;
  name: string;
  species: Species;
  breedSize: BreedSize;
  birthDate: string;
  weighIns?: { date: string; kg: number }[];
}

function isoDay(d: Date) { return d.toISOString().slice(0, 10); }
function weeksBetween(a: Date, b: Date) { return Math.max(0, Math.round((b.getTime() - a.getTime()) / (7 * 86400000))); }

function maturityWeeksFor(species: Species, breedSize: BreedSize) {
  return species === 'CAT' ? CAT_MATURITY_WEEKS : (BREED_SIZES.find(b => b.id === breedSize)?.maturityWeeks ?? 56);
}

function growthPercent(weeksOld: number, maturityWeeks: number) {
  if (weeksOld <= 0) return 0;
  if (weeksOld >= maturityWeeks) return 100;
  return Math.round(100 * Math.pow(weeksOld / maturityWeeks, 0.6));
}

function milestonesFor(maturityWeeks: number) {
  return [
    { key: 'weaning',      label: 'Weaning complete',    atWeeks: 8,  emoji: '🍼' },
    { key: 'teething',     label: 'Adult teeth in',      atWeeks: 24, emoji: '🦷' },
    { key: 'adolescence',  label: 'Adolescence begins',  atWeeks: Math.round(maturityWeeks * 0.4), emoji: '🐾' },
    { key: 'fullgrown',    label: 'Fully grown',         atWeeks: maturityWeeks, emoji: '🏆' },
  ];
}

// ── Ticking countdown (self-contained, same pattern as other pro-tools) ──
function useCountdown(targetIso: string | null) {
  const [parts, setParts] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!targetIso) { setParts({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
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

// ── Paw Trail growth visual ─────────────────────────────────────────────
function PawIcon({ x, y, scale, active, pulse, glow }: { x: number; y: number; scale: number; active: boolean; pulse: boolean; glow: string }) {
  const color = active ? `rgb(${glow})` : 'var(--border-hairline)';
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} className={pulse ? 'paw-pulse' : undefined} style={{ transition: 'opacity 0.4s ease' }} opacity={active ? 1 : 0.4}>
      <ellipse cx={0} cy={7} rx={8} ry={6.5} fill={color} />
      <ellipse cx={-9} cy={-3} rx={3.6} ry={4.4} fill={color} />
      <ellipse cx={-3.2} cy={-8} rx={3.2} ry={4} fill={color} />
      <ellipse cx={3.2} cy={-8} rx={3.2} ry={4} fill={color} />
      <ellipse cx={9} cy={-3} rx={3.6} ry={4.4} fill={color} />
    </g>
  );
}

function PawTrail({ percent, glow }: { percent: number; glow: string }) {
  const N = 6;
  const W = 460, H = 90;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
        {Array.from({ length: N }, (_, i) => {
          const threshold = (i / (N - 1)) * 100;
          const active = percent >= threshold;
          const isCurrent = active && (i === N - 1 || percent < ((i + 1) / (N - 1)) * 100);
          const x = 30 + (i / (N - 1)) * (W - 60);
          const scale = 0.5 + (i / (N - 1)) * 0.9;
          const y = H - 20 - scale * 10;
          return <PawIcon key={i} x={x} y={y} scale={scale} active={active} pulse={isCurrent} glow={glow} />;
        })}
      </svg>
      <div className="flex justify-between text-caption" style={{ color: 'var(--text-tertiary)' }}>
        <span>Newborn</span><span>Full grown</span>
      </div>
    </div>
  );
}

// ── Litter Wheel gestation visual ───────────────────────────────────────
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function wedgePath(cx: number, cy: number, rOuter: number, rInner: number, startDeg: number, endDeg: number) {
  const so = polar(cx, cy, rOuter, startDeg), eo = polar(cx, cy, rOuter, endDeg);
  const si = polar(cx, cy, rInner, endDeg), ei = polar(cx, cy, rInner, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${so.x} ${so.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${eo.x} ${eo.y} L ${si.x} ${si.y} A ${rInner} ${rInner} 0 ${large} 0 ${ei.x} ${ei.y} Z`;
}

function LitterWheel({ currentWeek, glow }: { currentWeek: number; glow: string }) {
  const size = 220, cx = 110, cy = 110, rOuter = 100, rInner = 62;
  const segAngle = 360 / GESTATION_STAGES.length;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {GESTATION_STAGES.map((s, i) => {
        const start = i * segAngle, end = start + segAngle - 3;
        const passed = s.week < currentWeek;
        const isCurrent = s.week === currentWeek;
        const color = passed || isCurrent ? glow : '148, 148, 158';
        const mid = polar(cx, cy, (rOuter + rInner) / 2, start + segAngle / 2);
        return (
          <g key={s.week}>
            <path d={wedgePath(cx, cy, rOuter, rInner, start, end)}
              fill={`rgba(${color}, ${isCurrent ? 0.9 : passed ? 0.45 : 0.12})`}
              stroke={isCurrent ? `rgb(${glow})` : 'transparent'} strokeWidth={isCurrent ? 2 : 0}
              className={isCurrent ? 'wheel-pulse' : undefined}
            />
            <text x={mid.x} y={mid.y + 4} textAnchor="middle" fontSize={14}>{s.emoji}</text>
          </g>
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={22} fontWeight={800} fill={`rgb(${glow})`}>Wk {Math.min(9, Math.max(1, currentWeek))}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">of ~9</text>
    </svg>
  );
}

// ── Main component ──────────────────────────────────────────────────────
export function PetGrowthGestationTracker() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';

  const [mode, setMode] = useState<Mode>('GROWTH');
  const [species, setSpecies] = useState<Species>('DOG');
  const [breedSize, setBreedSize] = useState<BreedSize>('MEDIUM');
  const [petName, setPetName] = useState('');
  const [birthDate, setBirthDate] = useState(isoDay(new Date(Date.now() - 12 * 7 * 86400000)));
  const [matingDate, setMatingDate] = useState(isoDay(new Date(Date.now() - 21 * 86400000)));

  const [savedPets, setSavedPets] = useState<Pet[]>([]);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifyOnMilestone, setNotifyOnMilestone] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(38);

  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/pet-growth-gestation-tracker')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setSavedPets(data.config.pets ?? []);
          setNotifyOnMilestone(!!data.config.notifyOnMilestone);
          if (data.config.shareLink) setShareLink(data.config.shareLink);
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const maturityWeeks = maturityWeeksFor(species, breedSize);
  const weeksOld = weeksBetween(new Date(birthDate + 'T00:00:00'), new Date());
  const percent = growthPercent(weeksOld, maturityWeeks);
  const milestones = milestonesFor(maturityWeeks);
  const fullGrownDate = useMemo(() => new Date(new Date(birthDate + 'T00:00:00').getTime() + maturityWeeks * 7 * 86400000).toISOString(), [birthDate, maturityWeeks]);

  const dueDate = useMemo(() => new Date(new Date(matingDate + 'T00:00:00').getTime() + GESTATION_DAYS * 86400000).toISOString(), [matingDate]);
  const gestationDay = Math.max(1, Math.round((Date.now() - new Date(matingDate + 'T00:00:00').getTime()) / 86400000));
  const currentWeek = Math.min(9, Math.max(1, Math.ceil(gestationDay / 7)));
  const isDue = gestationDay >= GESTATION_DAYS;

  const saveConfig = useCallback(async (nextPets: Pet[], notify: boolean, share: string | null) => {
    const res = await fetch('/api/tools/pet-growth-gestation-tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pets: nextPets, notifyOnMilestone: notify, shareLink: share }),
    });
    if (!res.ok) throw new Error('save failed');
  }, []);

  async function handleSavePet() {
    if (!isPro) { showToast('Upgrade to Pro to save your pets', '⭐'); return; }
    if (savedPets.length >= PRO_MAX_PETS) { showToast(`Up to ${PRO_MAX_PETS} saved pets`, '⚠️'); return; }
    if (!petName.trim()) { showToast('Give your pet a name first', '⚠️'); return; }
    setSaving(true);
    try {
      const pet: Pet = { id: crypto.randomUUID(), name: petName.trim(), species, breedSize, birthDate };
      const next = [...savedPets, pet];
      await saveConfig(next, notifyOnMilestone, shareLink);
      setSavedPets(next);
      showToast(`${pet.name} saved`, '💾');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemovePet(id: string) {
    const next = savedPets.filter(p => p.id !== id);
    setSavedPets(next);
    try { await saveConfig(next, notifyOnMilestone, shareLink); } catch { showToast('Could not remove — try again', '⚠️'); }
  }

  async function handleToggleNotify() {
    if (!isPro) { showToast('Upgrade to Pro for milestone reminders', '⭐'); return; }
    const next = !notifyOnMilestone;
    setNotifyOnMilestone(next);
    try {
      await saveConfig(savedPets, next, shareLink);
      showToast(next ? 'You will be notified at each milestone' : 'Reminders turned off', next ? '🔔' : '🔕');
    } catch {
      setNotifyOnMilestone(!next);
      showToast('Could not save — try again', '⚠️');
    }
  }

  async function handleGenerateShareLink() {
    if (!isPro) { showToast('Upgrade to Pro to share a litter countdown', '⭐'); return; }
    const token = shareLink ?? Math.random().toString(36).slice(2, 10);
    try {
      await saveConfig(savedPets, notifyOnMilestone, token);
      setShareLink(token);
      const fullUrl = `${window.location.origin}/tools/pet-growth-gestation-calculator/watch/${token}`;
      await navigator.clipboard.writeText(fullUrl);
      showToast('Litter countdown link copied!', '🔗');
    } catch {
      showToast('Could not create link — try again', '⚠️');
    }
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

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>BIOLOGY</p>
            <h2 className="text-title2">Pet Growth & Gestation Calculator</h2>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="ios-card-nested p-1 flex gap-1 mb-6" style={{ maxWidth: 320 }}>
          {(['GROWTH', 'GESTATION'] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className="press flex-1 py-2 text-xs font-semibold rounded-lg transition-colors"
              style={{ background: mode === m ? `rgb(${GLOW})` : 'transparent', color: mode === m ? 'white' : 'var(--text-secondary)' }}>
              {m === 'GROWTH' ? '🐾 Growth' : '🥚 Gestation'}
            </button>
          ))}
        </div>

        {/* Species + breed size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-caption font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Species</label>
            <div className="ios-card-nested p-1 flex gap-1">
              {(['CAT', 'DOG'] as Species[]).map(s => (
                <button key={s} onClick={() => setSpecies(s)}
                  className="press flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                  style={{ background: species === s ? `rgb(${GLOW})` : 'transparent', color: species === s ? 'white' : 'var(--text-secondary)' }}>
                  {s === 'CAT' ? '🐱 Cat' : '🐶 Dog'}
                </button>
              ))}
            </div>
          </div>
          {mode === 'GROWTH' && (
            <div>
              <label className="text-caption font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Pet name</label>
              <input value={petName} onChange={e => setPetName(e.target.value)} placeholder="e.g. Biscuit"
                className="ios-card-nested w-full px-3 py-2.5 text-sm focus:outline-none" />
            </div>
          )}
        </div>

        {species === 'DOG' && mode === 'GROWTH' && (
          <div className="mb-5">
            <label className="text-caption font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Breed size</label>
            <div className="grid grid-cols-5 gap-1.5">
              {BREED_SIZES.map(b => (
                <button key={b.id} onClick={() => setBreedSize(b.id)} title={b.example}
                  className="ios-card-nested press py-2 text-xs font-semibold rounded-lg transition-colors text-center"
                  style={{ background: breedSize === b.id ? `rgb(${GLOW})` : undefined, color: breedSize === b.id ? 'white' : 'var(--text-secondary)' }}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'GROWTH' ? (
          <>
            <div className="mb-5">
              <label className="text-caption font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Birth date</label>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                className="ios-card-nested w-full sm:w-64 px-3 py-2.5 text-sm focus:outline-none" />
            </div>

            <div className="ios-card-nested p-5 mb-5" style={{ background: `rgba(${GLOW}, 0.08)` }}>
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div>
                  <p className="text-caption mb-1">GROWTH PROGRESS</p>
                  <p className="text-largetitle tabular font-bold" style={{ color: `rgb(${GLOW})` }}>{percent}<span className="text-title2">%</span></p>
                  <p className="text-footnote mt-1" style={{ color: 'var(--text-secondary)' }}>{weeksOld} weeks old · full grown around {new Date(fullGrownDate).toLocaleDateString()}</p>
                </div>
              </div>
              <PawTrail percent={percent} glow={GLOW} />
            </div>

            {percent < 100 && (
              <div className="ios-card-nested p-4 mb-6">
                <p className="text-caption font-semibold mb-2 text-center" style={{ color: 'var(--text-secondary)' }}>TIME UNTIL FULLY GROWN</p>
                <CountdownTimer targetIso={fullGrownDate} glow={GLOW} />
              </div>
            )}

            <div className="mb-6">
              <p className="text-footnote font-semibold mb-2">Milestones</p>
              <div className="flex flex-col gap-2">
                {milestones.map(m => {
                  const passed = weeksOld >= m.atWeeks;
                  return (
                    <div key={m.key} className="ios-card-nested p-3 flex items-center gap-3" style={{ opacity: passed ? 1 : 0.55 }}>
                      <span className="text-base">{passed ? m.emoji : '⏳'}</span>
                      <span className="text-footnote flex-1">{m.label}</span>
                      <span className="text-caption font-semibold" style={{ color: passed ? `rgb(${GLOW})` : 'var(--text-tertiary)' }}>
                        {passed ? 'Done' : `~wk ${m.atWeeks}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-5">
              <label className="text-caption font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Mating date</label>
              <input type="date" value={matingDate} onChange={e => setMatingDate(e.target.value)}
                className="ios-card-nested w-full sm:w-64 px-3 py-2.5 text-sm focus:outline-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div className="ios-card-nested p-5 flex items-center justify-center">
                <LitterWheel currentWeek={currentWeek} glow={GLOW} />
              </div>
              <div className="ios-card-nested p-5 flex flex-col items-center justify-center text-center">
                <p className="text-caption font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {isDue ? 'STATISTICALLY DUE NOW' : 'TIME UNTIL DUE DATE'}
                </p>
                {isDue ? (
                  <span className="text-largetitle">🍼</span>
                ) : (
                  <CountdownTimer targetIso={dueDate} glow={GLOW} />
                )}
                <p className="text-caption mt-3" style={{ color: 'var(--text-tertiary)' }}>Due around {new Date(dueDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-footnote font-semibold mb-2 text-center">This week: {GESTATION_STAGES.find(s => s.week === currentWeek)?.label}</p>
            </div>
          </>
        )}

        {/* Save pet / notify / share */}
        <div className="mb-6">
          <p className="text-footnote font-semibold mb-2">
            Saved pets {!isPro && <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>(Pro — up to {PRO_MAX_PETS})</span>}
          </p>
          {isPro ? (
            <div className="flex flex-col gap-2">
              {savedPets.map(p => (
                <div key={p.id} className="ios-card-nested p-3 flex items-center justify-between gap-3">
                  <p className="text-footnote font-semibold">{p.species === 'CAT' ? '🐱' : '🐶'} {p.name} <span style={{ color: 'var(--text-tertiary)' }}>· born {new Date(p.birthDate).toLocaleDateString()}</span></p>
                  <button onClick={() => handleRemovePet(p.id)} className="text-gray-400 hover:text-red-500 px-2 flex-shrink-0">×</button>
                </div>
              ))}
              <button onClick={handleSavePet} disabled={saving} className="ios-card-nested press text-xs px-3 py-2 self-start disabled:opacity-50" style={{ color: 'var(--text-secondary)' }}>
                {saving ? 'Saving…' : '+ Save current pet'}
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="pointer-events-none select-none ios-card-nested p-6" style={{ filter: 'blur(3px)', opacity: 0.55 }}><div className="h-14" /></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-4">
                <span className="text-2xl">🔒</span>
                <p className="text-footnote font-bold">Keep every pet's progress saved</p>
                <p className="text-caption max-w-xs">Upgrade to save up to 5 pets and pick up right where you left off.</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button onClick={handleToggleNotify} className="ios-card-nested press flex items-center gap-2.5 p-3 text-left" style={{ opacity: isPro ? 1 : 0.55 }}>
            <span className="text-base flex-shrink-0">{isPro ? (notifyOnMilestone ? '🔔' : '🔕') : '🔒'}</span>
            <span className="text-footnote flex-1">Notify me at each milestone</span>
          </button>
          {mode === 'GESTATION' && (
            <button onClick={handleGenerateShareLink} className="ios-card-nested press flex items-center gap-2.5 p-3 text-left" style={{ opacity: isPro ? 1 : 0.55 }}>
              <span className="text-base flex-shrink-0">{isPro ? '🔗' : '🔒'}</span>
              <span className="text-footnote flex-1">{shareLink ? 'Copy litter countdown link again' : 'Share this litter\'s countdown'}</span>
            </button>
          )}
        </div>

        {!isPro && (
          <div className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap" style={{ border: '1px solid var(--border-hairline)' }}>
            <div>
              <p className="text-footnote font-bold mb-0.5">🔒 Free plan: 1 pet at a time, no saved streak</p>
              <p className="text-caption">Upgrade to save multiple pets, get milestone reminders, and share litter countdowns.</p>
            </div>
            <button onClick={handleSavePet} className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Upgrade to Premium — $9.99/mo</button>
          </div>
        )}

        <div className="ios-card-nested p-4 mb-2 flex gap-3 items-start" style={{ borderLeft: `3px solid rgb(${GLOW})` }}>
          <span className="text-lg flex-shrink-0">ℹ️</span>
          <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
            Growth timelines and gestation length vary by individual animal and breed line — this is a statistical estimate, not a veterinary assessment.
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

      <div className="flex justify-center mt-4 mb-4"><EmbedCodeButton slug="pet-growth-gestation-calculator" title="Pet Fully Grown & Gestation Calculator" glow={GLOW} /></div>
      <CommentThread subjectType="tool" subjectId="pet-growth-gestation-calculator" glow={GLOW} />
      <ToastHost toast={toast} />

      <style dangerouslySetInnerHTML={{ __html: `
        .paw-pulse { animation: pawPulse 1.8s ease-in-out infinite; }
        @keyframes pawPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .wheel-pulse { animation: wheelPulse 1.8s ease-in-out infinite; }
        @keyframes wheelPulse { 0%, 100% { filter: none; } 50% { filter: drop-shadow(0 0 6px rgba(${GLOW}, 0.7)); } }
        @media (prefers-reduced-motion: reduce) { .paw-pulse, .wheel-pulse { animation: none; } }
      `}} />
    </div>
  );
}
