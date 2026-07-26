// FILE: src/components/pro-tools/SymptomEscalationTracker.tsx
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { SYMPTOM_TRACKER_COMMENTS } from './symptomTrackerComments';

interface SymptomDef { id: string; label: string; weight: 1 | 2 | 3; emoji: string }
interface LogEntry { date: string; checked: string[]; score: number }

const GLOW = '216, 90, 48'; // matches HeroDuration's "high severity" red/orange

// Generic, condition-agnostic red-flag checklist — deliberately broad so this one
// tool can sit under ANY "how long until X gets serious" Medical Timelines article,
// not just the tooth-infection one it launches with.
const SYMPTOMS: SymptomDef[] = [
  { id: 'local-pain',    label: 'Localized pain or swelling',            weight: 1, emoji: '📍' },
  { id: 'fever',         label: 'Fever or chills',                        weight: 2, emoji: '🌡️' },
  { id: 'spreading',     label: 'Swelling spreading beyond the area',     weight: 2, emoji: '↔️' },
  { id: 'redness',       label: 'Red streaking or warmth around the area', weight: 2, emoji: '🔴' },
  { id: 'breathing',     label: 'Difficulty breathing or swallowing',      weight: 3, emoji: '🫁' },
  { id: 'heartbeat',     label: 'Rapid or irregular heartbeat',           weight: 2, emoji: '💓' },
  { id: 'confusion',     label: 'Confusion or disorientation',            weight: 3, emoji: '🧠' },
  { id: 'faint',         label: 'Feeling faint or very weak',             weight: 2, emoji: '😵' },
];
const MAX_SCORE = SYMPTOMS.reduce((sum, s) => sum + s.weight, 0) + 2; // +2 reserved for custom symptoms (weight 1 each)
const FREE_CUSTOM_SLOTS = 0;
const PRO_CUSTOM_SLOTS = 2;

function scoreFor(checkedIds: string[], custom: string[]): number {
  const base = SYMPTOMS.filter(s => checkedIds.includes(s.id)).reduce((sum, s) => sum + s.weight, 0);
  const customScore = custom.length; // weight 1 each
  return Math.round(((base + customScore) / MAX_SCORE) * 100);
}
function zoneFor(score: number): 'monitor' | 'soon' | 'now' {
  return score >= 60 ? 'now' : score >= 30 ? 'soon' : 'monitor';
}
const ZONE_COLOR: Record<string, string> = { monitor: '99, 153, 34', soon: '186, 117, 23', now: '216, 90, 48' };
const ZONE_LABEL: Record<string, string> = { monitor: 'Monitor at home', soon: 'See a doctor soon', now: 'Seek care now' };

function isoDate(d: Date): string { return d.toISOString().slice(0, 10); }
function startOfToday(): Date { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((startOfToday().getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}
function computeStreak(history: LogEntry[]): number {
  const set = new Set(history.map(h => h.date));
  let cursor = startOfToday();
  if (!set.has(isoDate(cursor))) cursor = new Date(cursor.getTime() - 86400000);
  let streak = 0;
  while (set.has(isoDate(cursor))) { streak++; cursor = new Date(cursor.getTime() - 86400000); }
  return streak;
}

function TrendChart({ history }: { history: LogEntry[] }) {
  const points = [...history].slice(0, 7).reverse();
  if (points.length < 2) return null;
  const W = 400, H = 90, PAD = 8;
  const max = 100;
  const xFor = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const yFor = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)},${yFor(p.score)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <line x1={PAD} x2={W - PAD} y1={yFor(60)} y2={yFor(60)} stroke={`rgb(${ZONE_COLOR.now})`} strokeDasharray="4 3" strokeWidth={1} opacity={0.5} />
      <path d={path} fill="none" stroke={`rgb(${GLOW})`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={p.date} cx={xFor(i)} cy={yFor(p.score)} r={4} fill={`rgb(${ZONE_COLOR[zoneFor(p.score)]})`} stroke="white" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

export function SymptomEscalationTracker() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const customSlots = isPro ? PRO_CUSTOM_SLOTS : FREE_CUSTOM_SLOTS;

  const [checked, setChecked] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [history, setHistory] = useState<LogEntry[]>([]);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(31);

  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/symptom-escalation-tracker')
      .then(r => r.json())
      .then(data => {
        if (data.config && Array.isArray(data.config.history)) setHistory(data.config.history.slice(0, 30));
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const score = useMemo(() => scoreFor(checked, custom), [checked, custom]);
  const zone = zoneFor(score);
  const streak = useMemo(() => computeStreak(history), [history]);
  const yesterday = history[0];
  const jump = yesterday ? score - yesterday.score : 0;

  function toggleSymptom(id: string) {
    setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }
  function addCustom() {
    if (!customInput.trim()) return;
    if (custom.length >= customSlots) { showToast(isPro ? 'Custom symptom slots full (max 2)' : 'Upgrade to add custom symptoms', '🔒'); return; }
    setCustom(prev => [...prev, customInput.trim()]);
    setCustomInput('');
  }
  function removeCustom(text: string) {
    setCustom(prev => prev.filter(c => c !== text));
  }
  function requireAuth() { showToast('You need to sign up first', '🔒'); }

  async function handleLogToday() {
    if (!isPro) { showToast('Upgrade to log today & track your trend', '⭐'); return; }
    setSaving(true);
    try {
      const today = isoDate(startOfToday());
      const withoutToday = history.filter(h => h.date !== today);
      const nextHistory = [{ date: today, checked, score }, ...withoutToday].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
      const res = await fetch('/api/tools/symptom-escalation-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: nextHistory }),
      });
      if (!res.ok) throw new Error('save failed');
      setHistory(nextHistory);
      showToast("Today's check-in logged!", '📋');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSaving(false);
    }
  }
  function handleReset() {
    setChecked([]); setCustom([]);
    showToast('Reset checklist', '↺');
  }
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
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>MEDICAL TIMELINES</p>
            <h2 className="text-title2">Symptom Escalation Tracker</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleReset} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>↺ Reset</button>
            <button
              onClick={handleLogToday}
              disabled={saving}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? "Log today's check-in and update your trend" : 'Upgrade to log & track your trend'}
            >
              {isPro ? '📋' : '🔒'} {saving ? 'Logging…' : 'Log today'}
            </button>
          </div>
        </div>

        {/* Score readout */}
        <div className="ios-card-nested p-5 mb-6 flex items-center justify-between flex-wrap gap-4" style={{ background: `rgba(${ZONE_COLOR[zone]}, 0.08)` }}>
          <div>
            <p className="text-caption mb-1">URGENCY SCORE</p>
            <p className="text-callout font-bold" style={{ color: `rgb(${ZONE_COLOR[zone]})` }}>{ZONE_LABEL[zone]}</p>
            {yesterday && jump !== 0 && (
              <p className="text-caption mt-1" style={{ color: 'var(--text-secondary)' }}>
                {jump > 0 ? `▲ Up ${jump} pts since yesterday` : `▼ Down ${Math.abs(jump)} pts since yesterday`}
              </p>
            )}
          </div>
          <div className="text-largetitle tabular" style={{ color: `rgb(${ZONE_COLOR[zone]})` }}>{score}%</div>
        </div>

        {zone === 'now' && (
          <div className="ios-card-nested p-4 mb-6 flex gap-3 items-start" style={{ borderLeft: `3px solid rgb(${GLOW})` }}>
            <span className="text-lg flex-shrink-0">⚠️</span>
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
              Your checked symptoms fall in the "seek care now" range. This tool is informational, not diagnostic — if this reflects how you feel right now, contact a doctor or go to urgent/emergency care.
            </p>
          </div>
        )}

        {/* Checklist */}
        <div className="mb-6">
          <p className="text-footnote font-semibold mb-2">Which of these apply to you right now?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SYMPTOMS.map(s => {
              const isChecked = checked.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSymptom(s.id)}
                  className="ios-card-nested press flex items-center gap-2.5 p-3 text-left transition-colors"
                  style={{ border: isChecked ? `1.5px solid rgb(${ZONE_COLOR.now})` : '1.5px solid transparent', background: isChecked ? `rgba(${ZONE_COLOR.now}, 0.08)` : undefined }}
                >
                  <span className="text-base flex-shrink-0">{s.emoji}</span>
                  <span className="text-footnote flex-1">{s.label}</span>
                  <span className="text-caption flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{'+'.repeat(s.weight)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom symptoms */}
        <div className="mb-6">
          <p className="text-footnote font-semibold mb-2">
            Anything else? {!isPro && <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>(Pro: up to 2 custom symptoms)</span>}
          </p>
          <div className="flex flex-wrap gap-2 mb-2">
            {custom.map(c => (
              <span key={c} className="flex items-center gap-1 text-xs ios-card-nested pl-2.5 pr-1 py-1">
                {c}
                <button onClick={() => removeCustom(c)} className="text-gray-400 hover:text-red-500 px-1">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              disabled={!isPro || custom.length >= customSlots}
              placeholder={isPro ? 'Describe a symptom…' : 'Upgrade to add custom symptoms'}
              className="ios-card-nested flex-1 px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
            />
            <button onClick={addCustom} disabled={!isPro || custom.length >= customSlots} className="ios-card-nested press text-xs px-3 py-2 disabled:opacity-40">Add</button>
          </div>
        </div>

        {/* Trend */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <p className="text-footnote font-semibold">7-day trend</p>
            {isPro && streak > 0 && <span className="pill text-[10px]" style={{ background: `rgba(${GLOW}, 0.15)`, color: `rgb(${GLOW})` }}>🔥 {streak}-day streak</span>}
          </div>
          {isPro ? (
            history.length >= 2 ? (
              <div className="ios-card-nested p-3">
                <TrendChart history={history} />
                <div className="flex justify-between mt-1">
                  {[...history].slice(0, 7).reverse().map(h => (
                    <span key={h.date} className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{dayLabel(h.date)}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ios-card-nested p-6 text-center">
                <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>Log at least 2 days to see your trend line.</p>
              </div>
            )
          ) : (
            <div className="relative">
              <div className="pointer-events-none select-none ios-card-nested p-6" style={{ filter: 'blur(3px)', opacity: 0.55 }}>
                <div className="h-16" />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-4">
                <span className="text-2xl">🔒</span>
                <p className="text-footnote font-bold">Track your trend day-to-day</p>
                <p className="text-caption max-w-xs">Upgrade to log daily check-ins and see whether things are escalating or improving.</p>
              </div>
            </div>
          )}
        </div>

        {!isPro && (
          <div className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap" style={{ border: '1px solid var(--border-hairline)' }}>
            <div>
              <p className="text-footnote font-bold mb-0.5">🔒 Free plan: check-in only, no history</p>
              <p className="text-caption">Upgrade to log daily, track your trend, build a streak, and add custom symptoms.</p>
            </div>
            <button className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Upgrade to Premium — $4/mo</button>
          </div>
        )}

        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: toolLiked ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>
            <span style={{ transform: toolLiked ? 'scale(1.2)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>{toolLiked ? '❤️' : '🤍'}</span>
            <span className="text-footnote font-semibold">{toolLikeCount}</span>
          </button>
          <button onClick={handleShare} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>🔗 <span className="text-footnote font-semibold">Share</span></button>
          <button onClick={handleCommentJump} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>💬 <span className="text-footnote font-semibold">Comment</span></button>
        </div>
      </div>

      <ToolCommentSection seedComments={SYMPTOM_TRACKER_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />
      <ToastHost toast={toast} />
    </div>
  );
}
