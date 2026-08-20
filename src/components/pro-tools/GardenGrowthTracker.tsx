// FILE: src/components/pro-tools/GardenGrowthTracker.tsx
'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { CommentThread } from '@/components/community/CommentThread';
import { EmbedCodeButton } from '@/components/embeds/EmbedCodeButton';

const GLOW = '138, 201, 87';
const PRO_MAX_BEDS = 8;

type PlantKey = 'DAHLIA' | 'CARROT' | 'ONION' | 'GRASS';
type Season = 'WARM' | 'AVERAGE' | 'COOL';

interface PlantInfo {
  key: PlantKey;
  label: string;
  emoji: string;
  plantedLabel: string;
  germinationDaysMin: number;
  germinationDaysMax: number;
  finalDaysMin: number;
  finalDaysMax: number;
  finalLabel: string;
  finalEmoji: string;
}

const PLANTS: PlantInfo[] = [
  { key: 'DAHLIA', label: 'Dahlia',     emoji: '🌷', plantedLabel: 'Tuber planted',    germinationDaysMin: 14, germinationDaysMax: 21, finalDaysMin: 70,  finalDaysMax: 90,  finalLabel: 'Bloom',    finalEmoji: '🌸' },
  { key: 'CARROT', label: 'Carrots',    emoji: '🥕', plantedLabel: 'Seeds sown',       germinationDaysMin: 10, germinationDaysMax: 21, finalDaysMin: 70,  finalDaysMax: 80,  finalLabel: 'Harvest',  finalEmoji: '🥕' },
  { key: 'ONION',  label: 'Onions',     emoji: '🧅', plantedLabel: 'Sets planted',     germinationDaysMin: 7,  germinationDaysMax: 14, finalDaysMin: 100, finalDaysMax: 140, finalLabel: 'Harvest',  finalEmoji: '🧅' },
  { key: 'GRASS',  label: 'Grass seed', emoji: '🌱', plantedLabel: 'Seed sown',        germinationDaysMin: 7,  germinationDaysMax: 21, finalDaysMin: 28,  finalDaysMax: 35,  finalLabel: 'First mow', finalEmoji: '🟩' },
];

const SEASON_FACTOR: Record<Season, number> = { WARM: 0.9, AVERAGE: 1, COOL: 1.15 };

interface Bed {
  id: string;
  name: string;
  plant: PlantKey;
  plantedDate: string;
  season: Season;
}

function isoDay(d: Date) { return d.toISOString().slice(0, 10); }
function daysBetween(a: Date, b: Date) { return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000)); }
function mid(a: number, b: number) { return Math.round((a + b) / 2); }

function growthPercent(daysSince: number, finalMid: number) {
  if (daysSince <= 0) return 0;
  if (daysSince >= finalMid) return 100;
  return Math.round(100 * Math.pow(daysSince / finalMid, 0.7));
}

function stagesFor(plant: PlantInfo, germinationMid: number, finalMid: number) {
  return [
    { key: 'planted',  label: plant.plantedLabel, atDays: 0 },
    { key: 'sprouted', label: 'Sprouted',          atDays: germinationMid },
    { key: 'growing',  label: 'Growing strong',    atDays: Math.round(finalMid * 0.6) },
    { key: 'final',    label: plant.finalLabel,    atDays: finalMid },
  ];
}

// ── Ticking countdown ───────────────────────────────────────────────────
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

// ── Grow Stem visual ─────────────────────────────────────────────────────
function GrowStem({ percent, finalEmoji, glow }: { percent: number; finalEmoji: string; glow: string }) {
  const W = 200, H = 220;
  const baseY = 190, maxStemHeight = 140;
  const stemTopY = baseY - (percent / 100) * maxStemHeight;
  const leaf1Show = percent >= 40;
  const leaf2Show = percent >= 70;
  const flowerOpacity = Math.max(0, Math.min(1, (percent - 85) / 15));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      <ellipse cx={100} cy={198} rx={54} ry={14} fill="rgba(120, 84, 52, 0.35)" />
      <ellipse cx={100} cy={194} rx={44} ry={10} fill="rgba(120, 84, 52, 0.5)" />

      <line x1={100} y1={baseY} x2={100} y2={stemTopY} stroke={`rgb(${glow})`} strokeWidth={5} strokeLinecap="round"
        style={{ transition: 'y2 0.8s ease-out' }} />

      <g style={{ opacity: leaf1Show ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <path d={`M 100 ${baseY - 56} Q 78 ${baseY - 66}, 76 ${baseY - 48} Q 90 ${baseY - 50}, 100 ${baseY - 56}`} fill={`rgb(${glow})`} />
        <path d={`M 100 ${baseY - 56} Q 122 ${baseY - 66}, 124 ${baseY - 48} Q 110 ${baseY - 50}, 100 ${baseY - 56}`} fill={`rgb(${glow})`} />
      </g>
      <g style={{ opacity: leaf2Show ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <path d={`M 100 ${baseY - 98} Q 74 ${baseY - 106}, 72 ${baseY - 88} Q 88 ${baseY - 92}, 100 ${baseY - 98}`} fill={`rgb(${glow})`} />
        <path d={`M 100 ${baseY - 98} Q 126 ${baseY - 106}, 128 ${baseY - 88} Q 112 ${baseY - 92}, 100 ${baseY - 98}`} fill={`rgb(${glow})`} />
      </g>

      <text x={100} y={stemTopY - 6} textAnchor="middle" fontSize={28} style={{ opacity: flowerOpacity, transition: 'opacity 0.8s ease' }}>
        {finalEmoji}
      </text>
    </svg>
  );
}

// ── Stage timeline strip ────────────────────────────────────────────────
function StageTimeline({ stages, daysSince, glow }: { stages: { key: string; label: string; atDays: number }[]; daysSince: number; glow: string }) {
  return (
    <div className="flex items-center">
      {stages.map((s, i) => {
        const reached = daysSince >= s.atDays;
        const isCurrent = reached && (i === stages.length - 1 || daysSince < stages[i + 1].atDays);
        return (
          <div key={s.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 64 }}>
              <div
                className={isCurrent ? 'stage-pulse' : undefined}
                style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: reached ? `rgb(${glow})` : 'var(--border-hairline)',
                  boxShadow: isCurrent ? `0 0 10px rgba(${glow}, 0.7)` : 'none',
                  transition: 'background 0.4s ease',
                }}
              />
              <span className="text-caption text-center" style={{ color: reached ? `rgb(${glow})` : 'var(--text-tertiary)', fontWeight: reached ? 700 : 500 }}>
                {s.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className="flex-1 h-0.5 mx-1" style={{ background: daysSince >= stages[i + 1].atDays ? `rgb(${glow})` : 'var(--border-hairline)', transition: 'background 0.4s ease', marginBottom: 20 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────
export function GardenGrowthTracker() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';

  const [plantKey, setPlantKey] = useState<PlantKey>('DAHLIA');
  const [bedName, setBedName] = useState('');
  const [plantedDate, setPlantedDate] = useState(isoDay(new Date(Date.now() - 21 * 86400000)));
  const [season, setSeason] = useState<Season>('AVERAGE');

  const [savedBeds, setSavedBeds] = useState<Bed[]>([]);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifyOnStage, setNotifyOnStage] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(29);

  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/garden-growth-tracker')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setSavedBeds(data.config.beds ?? []);
          setNotifyOnStage(!!data.config.notifyOnStage);
          if (data.config.shareLink) setShareLink(data.config.shareLink);
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const plant = PLANTS.find(p => p.key === plantKey)!;
  const factor = isPro ? SEASON_FACTOR[season] : 1;
  const germinationMid = Math.round(mid(plant.germinationDaysMin, plant.germinationDaysMax) * factor);
  const finalMid = Math.round(mid(plant.finalDaysMin, plant.finalDaysMax) * factor);

  const daysSince = daysBetween(new Date(plantedDate + 'T00:00:00'), new Date());
  const percent = growthPercent(daysSince, finalMid);
  const stages = stagesFor(plant, germinationMid, finalMid);

  const germinationDate = useMemo(() => new Date(new Date(plantedDate + 'T00:00:00').getTime() + germinationMid * 86400000).toISOString(), [plantedDate, germinationMid]);
  const finalDate = useMemo(() => new Date(new Date(plantedDate + 'T00:00:00').getTime() + finalMid * 86400000).toISOString(), [plantedDate, finalMid]);
  const germinated = daysSince >= germinationMid;
  const isFinal = daysSince >= finalMid;

  const saveConfig = useCallback(async (nextBeds: Bed[], notify: boolean, share: string | null) => {
    const res = await fetch('/api/tools/garden-growth-tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ beds: nextBeds, notifyOnStage: notify, shareLink: share }),
    });
    if (!res.ok) throw new Error('save failed');
  }, []);

  async function handleSaveBed() {
    if (!isPro) { showToast('Upgrade to Pro to save your garden beds', '⭐'); return; }
    if (savedBeds.length >= PRO_MAX_BEDS) { showToast(`Up to ${PRO_MAX_BEDS} saved beds`, '⚠️'); return; }
    if (!bedName.trim()) { showToast('Give this bed a name first', '⚠️'); return; }
    setSaving(true);
    try {
      const bed: Bed = { id: crypto.randomUUID(), name: bedName.trim(), plant: plantKey, plantedDate, season };
      const next = [...savedBeds, bed];
      await saveConfig(next, notifyOnStage, shareLink);
      setSavedBeds(next);
      showToast(`${bed.name} saved`, '💾');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveBed(id: string) {
    const next = savedBeds.filter(b => b.id !== id);
    setSavedBeds(next);
    try { await saveConfig(next, notifyOnStage, shareLink); } catch { showToast('Could not remove — try again', '⚠️'); }
  }

  async function handleToggleNotify() {
    if (!isPro) { showToast('Upgrade to Pro for stage-change reminders', '⭐'); return; }
    const next = !notifyOnStage;
    setNotifyOnStage(next);
    try {
      await saveConfig(savedBeds, next, shareLink);
      showToast(next ? 'You will be notified at each stage' : 'Reminders turned off', next ? '🔔' : '🔕');
    } catch {
      setNotifyOnStage(!next);
      showToast('Could not save — try again', '⚠️');
    }
  }

  async function handleGenerateShareLink() {
    if (!isPro) { showToast('Upgrade to Pro to share Garden Watch', '⭐'); return; }
    const token = shareLink ?? Math.random().toString(36).slice(2, 10);
    try {
      await saveConfig(savedBeds, notifyOnStage, token);
      setShareLink(token);
      const fullUrl = `${window.location.origin}/tools/garden-growth-bloom-tracker/watch/${token}`;
      await navigator.clipboard.writeText(fullUrl);
      showToast('Garden Watch link copied!', '🔗');
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
            <h2 className="text-title2">Garden Growth & Bloom Tracker</h2>
          </div>
        </div>

        {/* Plant selector */}
        <div className="mb-5">
          <label className="text-caption font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>What are you growing?</label>
          <div className="grid grid-cols-4 gap-1.5">
            {PLANTS.map(p => (
              <button key={p.key} onClick={() => setPlantKey(p.key)}
                className="ios-card-nested press py-2.5 text-xs font-semibold rounded-lg transition-colors text-center"
                style={{ background: plantKey === p.key ? `rgb(${GLOW})` : undefined, color: plantKey === p.key ? 'white' : 'var(--text-secondary)' }}>
                <span className="block text-base mb-0.5">{p.emoji}</span>{p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-caption font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>{plant.plantedLabel}</label>
            <input type="date" value={plantedDate} onChange={e => setPlantedDate(e.target.value)}
              className="ios-card-nested w-full px-3 py-2.5 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-caption font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Bed name</label>
            <input value={bedName} onChange={e => setBedName(e.target.value)} placeholder="e.g. Back bed"
              className="ios-card-nested w-full px-3 py-2.5 text-sm focus:outline-none" />
          </div>
        </div>

        {/* Season adjustment (Pro) */}
        <div className="mb-6">
          <label className="text-caption font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
            Season {!isPro && <span style={{ color: 'var(--text-tertiary)' }}>(Pro — adjusts the estimate)</span>}
          </label>
          <div className="ios-card-nested p-1 flex gap-1" style={{ opacity: isPro ? 1 : 0.55, maxWidth: 320 }}>
            {(['COOL', 'AVERAGE', 'WARM'] as Season[]).map(s => (
              <button key={s} onClick={() => { if (!isPro) { showToast('Upgrade to Pro to adjust for season', '⭐'); return; } setSeason(s); }}
                className="press flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                style={{ background: season === s && isPro ? `rgb(${GLOW})` : 'transparent', color: season === s && isPro ? 'white' : 'var(--text-secondary)' }}>
                {s === 'COOL' ? '❄️ Cool' : s === 'WARM' ? '☀️ Warm' : 'Average'}
              </button>
            ))}
          </div>
        </div>

        {/* Grow Stem */}
        <div className="ios-card-nested p-5 mb-5" style={{ background: `rgba(${GLOW}, 0.08)` }}>
          <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
            <div>
              <p className="text-caption mb-1">GROWTH PROGRESS</p>
              <p className="text-largetitle tabular font-bold" style={{ color: `rgb(${GLOW})` }}>{percent}<span className="text-title2">%</span></p>
              <p className="text-footnote mt-1" style={{ color: 'var(--text-secondary)' }}>
                {daysSince} days since planting · {plant.finalLabel.toLowerCase()} around {new Date(finalDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <GrowStem percent={percent} finalEmoji={plant.finalEmoji} glow={GLOW} />
        </div>

        <div className="ios-card-nested p-4 mb-6">
          <p className="text-footnote font-semibold mb-3 text-center">Stages</p>
          <StageTimeline stages={stages} daysSince={daysSince} glow={GLOW} />
        </div>

        {!isFinal && (
          <div className="ios-card-nested p-4 mb-6">
            <p className="text-caption font-semibold mb-2 text-center" style={{ color: 'var(--text-secondary)' }}>
              {germinated ? `TIME UNTIL ${plant.finalLabel.toUpperCase()}` : 'TIME UNTIL SPROUT'}
            </p>
            <CountdownTimer targetIso={germinated ? finalDate : germinationDate} glow={GLOW} />
          </div>
        )}

        {/* Save bed / notify / share */}
        <div className="mb-6">
          <p className="text-footnote font-semibold mb-2">
            Saved beds {!isPro && <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>(Pro — up to {PRO_MAX_BEDS})</span>}
          </p>
          {isPro ? (
            <div className="flex flex-col gap-2">
              {savedBeds.map(b => (
                <div key={b.id} className="ios-card-nested p-3 flex items-center justify-between gap-3">
                  <p className="text-footnote font-semibold">{PLANTS.find(p => p.key === b.plant)?.emoji} {b.name} <span style={{ color: 'var(--text-tertiary)' }}>· planted {new Date(b.plantedDate).toLocaleDateString()}</span></p>
                  <button onClick={() => handleRemoveBed(b.id)} className="text-gray-400 hover:text-red-500 px-2 flex-shrink-0">×</button>
                </div>
              ))}
              <button onClick={handleSaveBed} disabled={saving} className="ios-card-nested press text-xs px-3 py-2 self-start disabled:opacity-50" style={{ color: 'var(--text-secondary)' }}>
                {saving ? 'Saving…' : '+ Save current bed'}
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="pointer-events-none select-none ios-card-nested p-6" style={{ filter: 'blur(3px)', opacity: 0.55 }}><div className="h-14" /></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-4">
                <span className="text-2xl">🔒</span>
                <p className="text-footnote font-bold">Keep every bed's progress saved</p>
                <p className="text-caption max-w-xs">Upgrade to save up to {PRO_MAX_BEDS} beds and pick up right where you left off.</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button onClick={handleToggleNotify} className="ios-card-nested press flex items-center gap-2.5 p-3 text-left" style={{ opacity: isPro ? 1 : 0.55 }}>
            <span className="text-base flex-shrink-0">{isPro ? (notifyOnStage ? '🔔' : '🔕') : '🔒'}</span>
            <span className="text-footnote flex-1">Notify me at each stage</span>
          </button>
          <button onClick={handleGenerateShareLink} className="ios-card-nested press flex items-center gap-2.5 p-3 text-left" style={{ opacity: isPro ? 1 : 0.55 }}>
            <span className="text-base flex-shrink-0">{isPro ? '🔗' : '🔒'}</span>
            <span className="text-footnote flex-1">{shareLink ? 'Copy Garden Watch link again' : 'Share this bed\'s countdown'}</span>
          </button>
        </div>

        {!isPro && (
          <div className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap" style={{ border: '1px solid var(--border-hairline)' }}>
            <div>
              <p className="text-footnote font-bold mb-0.5">🔒 Free plan: 1 bed at a time, no saved streak</p>
              <p className="text-caption">Upgrade to save multiple beds, adjust for season, and share Garden Watch.</p>
            </div>
            <button onClick={handleSaveBed} className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Upgrade to Premium — $9.99/mo</button>
          </div>
        )}

        <div className="ios-card-nested p-4 mb-2 flex gap-3 items-start" style={{ borderLeft: `3px solid rgb(${GLOW})` }}>
          <span className="text-lg flex-shrink-0">ℹ️</span>
          <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
            Germination and bloom or harvest timing vary a lot by climate zone, soil temperature, and frost dates — this is a statistical average, not a forecast for your specific garden.
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

      <div className="flex justify-center mt-4 mb-4"><EmbedCodeButton slug="garden-growth-bloom-tracker" title="Garden Growth & Bloom Tracker" glow={GLOW} /></div>
      <CommentThread subjectType="tool" subjectId="garden-growth-bloom-tracker" glow={GLOW} />
      <ToastHost toast={toast} />

      <style dangerouslySetInnerHTML={{ __html: `
        .stage-pulse { animation: stagePulse 1.8s ease-in-out infinite; }
        @keyframes stagePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.25); } }
        @media (prefers-reduced-motion: reduce) { .stage-pulse { animation: none; } }
      `}} />
    </div>
  );
}
