// FILE: src/components/pro-tools/NewbornMilestoneTracker.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { EmbedCodeButton } from '@/components/embeds/EmbedCodeButton';
import { NEWBORN_MILESTONE_COMMENTS } from './newbornMilestoneComments';

const GLOW = '45, 200, 170';

interface Milestone {
  id: string; label: string; emoji: string; note: string;
  dayStart: number; dayTypical: number; dayEnd: number;
}

// General pediatric ranges only — not a diagnostic timeline for any individual baby.
const MILESTONES: Milestone[] = [
  { id: 'cord-care', label: 'Cord stump care begins', emoji: '🩹', note: 'Keep the area clean and dry.', dayStart: 0, dayTypical: 0, dayEnd: 3 },
  { id: 'focus-faces', label: 'Starts focusing on faces up close', emoji: '👀', note: 'Best focal distance is roughly 8–12 inches.', dayStart: 0, dayTypical: 7, dayEnd: 21 },
  { id: 'birth-weight-regain', label: 'Regains birth weight', emoji: '⚖️', note: 'Most babies dip after birth, then climb back.', dayStart: 10, dayTypical: 12, dayEnd: 21 },
  { id: 'cord-falls', label: 'Cord typically falls off', emoji: '🎗️', note: 'Wide range — some earlier, some later.', dayStart: 7, dayTypical: 14, dayEnd: 21 },
  { id: 'cord-healed', label: 'Belly button area fully healed', emoji: '✅', note: '', dayStart: 14, dayTypical: 21, dayEnd: 35 },
  { id: 'lifts-head', label: 'Lifts head briefly during tummy time', emoji: '💪', note: '', dayStart: 14, dayTypical: 28, dayEnd: 42 },
  { id: 'tracks-objects', label: 'Tracks slow-moving objects', emoji: '👁️', note: '', dayStart: 21, dayTypical: 35, dayEnd: 56 },
  { id: 'coos', label: 'Starts cooing sounds', emoji: '🗣️', note: '', dayStart: 28, dayTypical: 42, dayEnd: 63 },
  { id: 'social-smile', label: 'First social smile', emoji: '😊', note: 'A real gut-punch of a milestone for most parents.', dayStart: 35, dayTypical: 49, dayEnd: 70 },
  { id: 'sleep-stretch', label: 'Sleep stretches start lengthening', emoji: '😴', note: 'Highly variable — this is a range, not a promise.', dayStart: 42, dayTypical: 63, dayEnd: 90 },
];

// Rough WHO 50th-percentile-ish averages (sex-combined) — illustrative only.
const WEIGHT_MEDIAN_KG_BY_MONTH = [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6];
const LENGTH_MEDIAN_CM_BY_MONTH = [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7];

function interpolate(table: number[], monthFloat: number): number {
  const m = Math.max(0, Math.min(table.length - 1, monthFloat));
  const lo = Math.floor(m), hi = Math.min(table.length - 1, lo + 1);
  const t = m - lo;
  return table[lo] + t * (table[hi] - table[lo]);
}

function normalCdf(z: number): number {
  // Abramowitz-Stegun erf approximation
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

function estimatePercentile(value: number, median: number): number {
  const sd = median * 0.12; // rough assumed spread, not a real WHO SD
  const z = (value - median) / sd;
  return normalCdf(z) * 100;
}

function daysBetween(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

function statusForDay(m: Milestone, previewDay: number): 'upcoming' | 'active' | 'passed' {
  if (previewDay < m.dayStart) return 'upcoming';
  if (previewDay <= m.dayEnd) return 'active';
  return 'passed';
}

export function NewbornMilestoneTracker() {
  const { data: session } = useSession();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const { toast, showToast } = useToast();

  const [loaded, setLoaded] = useState(false);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [weightEntries, setWeightEntries] = useState<{ date: string; valueKg: number }[]>([]);
  const [lengthEntries, setLengthEntries] = useState<{ date: string; valueCm: number }[]>([]);
  const [milestoneNotes, setMilestoneNotes] = useState<{ milestoneId: string; note: string; loggedAt: string }[]>([]);
  const [notifyOnMilestone, setNotifyOnMilestone] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [toolLiked, setToolLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(44);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [weightSlider, setWeightSlider] = useState(4.5);
  const [lengthSlider, setLengthSlider] = useState(55);

  useEffect(() => {
    fetch('/api/tools/newborn-milestone-tracker')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setBirthDate(data.config.birthDate ? String(data.config.birthDate).slice(0, 10) : null);
          setWeightEntries(Array.isArray(data.config.weightEntries) ? data.config.weightEntries : []);
          setLengthEntries(Array.isArray(data.config.lengthEntries) ? data.config.lengthEntries : []);
          setMilestoneNotes(Array.isArray(data.config.milestoneNotes) ? data.config.milestoneNotes : []);
          setNotifyOnMilestone(!!data.config.notifyOnMilestone);
          setShareLink(data.config.shareLink ?? null);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  async function persist(partial: Record<string, any> = {}) {
    try {
      const res = await fetch('/api/tools/newborn-milestone-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthDate, weightEntries, lengthEntries, milestoneNotes, notifyOnMilestone, shareLink, ...partial }),
      });
      if (!res.ok) throw new Error('save failed');
      return true;
    } catch {
      return false;
    }
  }

  function handleSetBirthDate(date: string) {
    setBirthDate(date);
    persist({ birthDate: date });
  }

  const daysSinceBirth = birthDate ? daysBetween(new Date(birthDate + 'T00:00:00'), new Date()) : 0;
  const [previewDay, setPreviewDay] = useState(daysSinceBirth);
  useEffect(() => { setPreviewDay(daysSinceBirth); }, [daysSinceBirth]);

  function handleLogWeight() {
    if (!isPro) { showToast('Upgrade to Pro to log growth entries', '⭐'); return; }
    const entry = { date: new Date().toISOString().slice(0, 10), valueKg: weightSlider };
    const next = [...weightEntries.filter(e => e.date !== entry.date), entry];
    setWeightEntries(next);
    persist({ weightEntries: next });
    showToast('Weight logged', '⚖️');
  }

  function handleLogLength() {
    if (!isPro) { showToast('Upgrade to Pro to log growth entries', '⭐'); return; }
    const entry = { date: new Date().toISOString().slice(0, 10), valueCm: lengthSlider };
    const next = [...lengthEntries.filter(e => e.date !== entry.date), entry];
    setLengthEntries(next);
    persist({ lengthEntries: next });
    showToast('Length logged', '📏');
  }

  function openNote(milestoneId: string) {
    if (!isPro) { showToast('Upgrade to Pro to add notes to milestones', '⭐'); return; }
    const existing = milestoneNotes.find(n => n.milestoneId === milestoneId);
    setNoteDraft(existing?.note ?? '');
    setOpenNoteId(milestoneId);
  }

  function saveNote() {
    if (!openNoteId) return;
    const next = [...milestoneNotes.filter(n => n.milestoneId !== openNoteId), { milestoneId: openNoteId, note: noteDraft, loggedAt: new Date().toISOString() }];
    setMilestoneNotes(next);
    persist({ milestoneNotes: next });
    setOpenNoteId(null);
    showToast('Note saved', '📝');
  }

  async function handleToggleNotify() {
    if (!isPro) { showToast('Upgrade to Pro for milestone alerts', '⭐'); return; }
    const next = !notifyOnMilestone;
    setNotifyOnMilestone(next);
    const ok = await persist({ notifyOnMilestone: next });
    if (ok) showToast(next ? 'You will be alerted as milestones come up' : 'Alerts turned off', next ? '🔔' : '🔕');
    else { setNotifyOnMilestone(!next); showToast('Could not save — try again', '⚠️'); }
  }

  async function handleGenerateShareLink() {
    if (!isPro) { showToast('Upgrade to Pro to share Milestone Watch', '⭐'); return; }
    const token = shareLink ?? Math.random().toString(36).slice(2, 10);
    const fullUrl = `${window.location.origin}/tools/newborn-milestone-tracker/watch/${token}`;
    const ok = await persist({ shareLink: token });
    if (ok) { setShareLink(token); await navigator.clipboard.writeText(fullUrl); showToast('Milestone Watch link copied!', '🔗'); }
    else showToast('Could not create link — try again', '⚠️');
  }

  function requireAuth() { showToast('You need to sign up first', '🔒'); }
  function handleLike() {
    if (!session) { requireAuth(); return; }
    setToolLiked(v => !v);
    setLikeCount(c => toolLiked ? c - 1 : c + 1);
  }
  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => showToast('Link copied!', '🔗')).catch(() => showToast('Could not copy link', '⚠️'));
  }
  function handleCommentJump() {
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  const monthFloat = previewDay / 30.44;
  const weightPercentile = estimatePercentile(weightSlider, interpolate(WEIGHT_MEDIAN_KG_BY_MONTH, monthFloat));
  const lengthPercentile = estimatePercentile(lengthSlider, interpolate(LENGTH_MEDIAN_CM_BY_MONTH, monthFloat));

  if (!loaded) return <div className="ios-card p-8 text-center text-callout" style={{ color: 'var(--text-secondary)' }}>Loading…</div>;

  if (!birthDate) {
    return (
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <ToastHost toast={toast} />
        <div className="ios-card p-6 sm:p-8 text-center" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
          <p className="text-headline mb-4">When was your baby born?</p>
          <input type="date" max={new Date().toISOString().slice(0, 10)}
            onChange={e => handleSetBirthDate(e.target.value)} className="ios-input"
            style={{ colorScheme: 'dark', color: 'var(--text-primary)', background: 'var(--fill-secondary)' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <ToastHost toast={toast} />

      <div className="ios-card p-6 sm:p-8 mb-4" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>MILESTONE TIMELINE</p>
        <h2 className="text-title2 mb-4">Day {daysSinceBirth} old</h2>

        <div className="ios-card-nested p-4 mb-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-footnote font-semibold">Scrub through time to preview what's coming</p>
            <span className="text-footnote tabular" style={{ color: `rgb(${GLOW})` }}>Day {previewDay}</span>
          </div>
          <input type="range" min={0} max={100} value={previewDay}
            onChange={e => setPreviewDay(Number(e.target.value))}
            className="w-full" style={{ accentColor: `rgb(${GLOW})` }} />
          {previewDay !== daysSinceBirth && (
            <button onClick={() => setPreviewDay(daysSinceBirth)} className="text-caption font-semibold mt-1" style={{ color: `rgb(${GLOW})` }}>Jump back to today</button>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          {MILESTONES.map(m => {
            const status = statusForDay(m, previewDay);
            const note = milestoneNotes.find(n => n.milestoneId === m.id);
            return (
              <div key={m.id} className="ios-card-nested p-4" style={{ opacity: status === 'upcoming' ? 0.55 : 1 }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg flex-shrink-0">{m.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-headline">{m.label}</p>
                      <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                        {status === 'passed' ? 'Typically already happened' : status === 'active' ? 'Typically happening around now' : `Typically around day ${m.dayTypical}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-caption font-semibold flex-shrink-0" style={{ color: status === 'active' ? `rgb(${GLOW})` : 'var(--text-tertiary)' }}>
                    {status === 'active' ? '●' : status === 'passed' ? '✓' : ''}
                  </span>
                </div>
                {note ? (
                  <button onClick={() => openNote(m.id)} className="text-footnote mt-2 press text-left" style={{ color: 'var(--text-secondary)' }}>📝 {note.note}</button>
                ) : (
                  <button onClick={() => openNote(m.id)} className="text-caption font-semibold mt-2 press" style={{ color: `rgb(${GLOW})` }}>+ Add a note</button>
                )}
                {openNoteId === m.id && (
                  <div className="mt-2 flex gap-2">
                    <input value={noteDraft} onChange={e => setNoteDraft(e.target.value)} placeholder="A little something to remember…"
                      className="ios-input flex-1 text-footnote" style={{ color: 'var(--text-primary)', background: 'var(--fill-secondary)' }} />
                    <button onClick={saveNote} className="btn-filled press text-xs px-3">Save</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="ios-card p-6 sm:p-8 mb-4" style={{ opacity: isPro ? 1 : 0.6 }}>
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>PRO</p>
        <h2 className="text-title2 mb-4">Growth check-in</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="ios-card-nested p-4 flex flex-col items-center">
            <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
              <svg width={120} height={120} viewBox="0 0 120 120">
                <circle cx={60} cy={60} r={52} fill="none" stroke="var(--fill-secondary)" strokeWidth={10} />
                <circle cx={60} cy={60} r={52} fill="none" stroke={`rgb(${GLOW})`} strokeWidth={10}
                  strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * (1 - weightPercentile / 100)}
                  strokeLinecap="round" transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
              </svg>
              <span className="absolute text-headline font-bold tabular" style={{ color: `rgb(${GLOW})` }}>{Math.round(weightPercentile)}%</span>
            </div>
            <p className="text-caption mt-2" style={{ color: 'var(--text-tertiary)' }}>rough weight estimate</p>
            <input type="range" min={2} max={12} step={0.1} value={weightSlider} disabled={!isPro}
              onChange={e => setWeightSlider(Number(e.target.value))} className="w-full mt-3" style={{ accentColor: `rgb(${GLOW})` }} />
            <p className="text-footnote tabular mb-2">{weightSlider.toFixed(1)} kg</p>
            <button onClick={handleLogWeight} className="ios-card-nested press w-full py-2 text-footnote font-semibold">Log today's weight</button>
          </div>

          <div className="ios-card-nested p-4 flex flex-col items-center">
            <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
              <svg width={120} height={120} viewBox="0 0 120 120">
                <circle cx={60} cy={60} r={52} fill="none" stroke="var(--fill-secondary)" strokeWidth={10} />
                <circle cx={60} cy={60} r={52} fill="none" stroke={`rgb(${GLOW})`} strokeWidth={10}
                  strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * (1 - lengthPercentile / 100)}
                  strokeLinecap="round" transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
              </svg>
              <span className="absolute text-headline font-bold tabular" style={{ color: `rgb(${GLOW})` }}>{Math.round(lengthPercentile)}%</span>
            </div>
            <p className="text-caption mt-2" style={{ color: 'var(--text-tertiary)' }}>rough length estimate</p>
            <input type="range" min={40} max={90} step={0.5} value={lengthSlider} disabled={!isPro}
              onChange={e => setLengthSlider(Number(e.target.value))} className="w-full mt-3" style={{ accentColor: `rgb(${GLOW})` }} />
            <p className="text-footnote tabular mb-2">{lengthSlider.toFixed(1)} cm</p>
            <button onClick={handleLogLength} className="ios-card-nested press w-full py-2 text-footnote font-semibold">Log today's length</button>
          </div>
        </div>

        <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
          A rough, sex-combined estimate — not the clinical WHO/CDC growth chart your pediatrician uses. Ask them for the real one.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <button onClick={handleToggleNotify} className="ios-card-nested press flex items-center gap-2.5 p-3 text-left" style={{ opacity: isPro ? 1 : 0.55 }}>
          <span className="text-lg">{notifyOnMilestone ? '🔔' : '🔕'}</span>
          <span className="text-footnote font-semibold">Alert me as milestones come up</span>
        </button>
        <button onClick={handleGenerateShareLink} className="ios-card-nested press flex items-center gap-2.5 p-3 text-left" style={{ opacity: isPro ? 1 : 0.55 }}>
          <span className="text-lg">🔗</span>
          <span className="text-footnote font-semibold">Copy Milestone Watch link</span>
        </button>
      </div>

      <div className="ios-card-nested p-4 mb-4 flex gap-3 items-start" style={{ borderLeft: '3px solid rgb(var(--accent-orange))' }}>
        <span className="text-lg flex-shrink-0">⚠️</span>
        <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
          These are general ranges, not a diagnostic timeline for any individual baby. If something feels off — feeding, breathing, responsiveness, the cord area looking infected — contact your pediatrician rather than waiting on this list.
        </p>
      </div>

      <div className="ios-card-nested p-1.5 flex gap-1.5">
        <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: toolLiked ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>
          <span style={{ transform: toolLiked ? 'scale(1.2)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>{toolLiked ? '❤️' : '🤍'}</span>
          <span className="text-footnote font-semibold">{likeCount}</span>
        </button>
        <button onClick={handleShare} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>🔗 <span className="text-footnote font-semibold">Share</span></button>
        <button onClick={handleCommentJump} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>💬 <span className="text-footnote font-semibold">Comment</span></button>
      </div>

            <div className="flex justify-center mt-4 mb-4">
        <EmbedCodeButton slug="newborn-milestone-tracker" title="Newborn Milestone Tracker" glow={GLOW} />
      </div>

      <ToolCommentSection seedComments={NEWBORN_MILESTONE_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />
    </div>
  );
}
