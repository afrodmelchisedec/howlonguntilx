// FILE: src/components/pro-tools/SportsGamesTracker.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { SPORTS_GAMES_COMMENTS } from './sportsGamesComments';

interface Team { name: string; color: string; }
interface GameEvent {
  id: string;
  sportKey: string;
  teamA: Team;
  teamB: Team;
  date: string; // ISO
  venue: string;
  prediction: number; // 0-100, chance teamA wins
  result: 'A' | 'B' | 'draw' | null;
  watchParty: boolean;
}

const GLOW = '0, 209, 255';

const FREE_MAX_EVENTS = 3;
const PRO_MAX_EVENTS = 10;
const FREE_HEATMAP_WEEKS = 4;
const PRO_HEATMAP_WEEKS = 12;

const SPORT_TYPES = [
  { key: 'football',   name: 'Football',   emoji: '🏈' },
  { key: 'basketball', name: 'Basketball', emoji: '🏀' },
  { key: 'soccer',      name: 'Soccer',     emoji: '⚽' },
  { key: 'baseball',    name: 'Baseball',   emoji: '⚾' },
  { key: 'esports',     name: 'Esports',    emoji: '🎮' },
  { key: 'boardgame',   name: 'Board Game', emoji: '🎲' },
  { key: 'tennis',      name: 'Tennis',     emoji: '🎾' },
  { key: 'fantasy',     name: 'Fantasy',    emoji: '🏆' },
];
function sportOf(key: string) { return SPORT_TYPES.find(s => s.key === key) ?? SPORT_TYPES[0]; }
function nextSport(key: string): string {
  const idx = SPORT_TYPES.findIndex(s => s.key === key);
  return SPORT_TYPES[(idx + 1) % SPORT_TYPES.length].key;
}

const TEAM_COLORS = ['255, 69, 58', '0, 122, 255', '255, 159, 10', '52, 199, 89', '196, 132, 252', '255, 122, 165', '100, 200, 255', '255, 214, 10'];
function nextColor(current: string): string {
  const idx = TEAM_COLORS.indexOf(current);
  return TEAM_COLORS[(idx + 1) % TEAM_COLORS.length];
}

const EVENT_TEMPLATES = [
  { sportKey: 'football',   teamAName: 'Home Team',   teamBName: 'Away Team',   daysOut: 21, venue: 'Home Stadium' },
  { sportKey: 'fantasy',    teamAName: 'You',          teamBName: 'The League',  daysOut: 5,  venue: 'Draft Room' },
  { sportKey: 'soccer',     teamAName: 'Reds',         teamBName: 'Blues',       daysOut: 2,  venue: 'City Park' },
  { sportKey: 'basketball', teamAName: 'Home Squad',   teamBName: 'Visitors',    daysOut: 14, venue: 'Arena' },
  { sportKey: 'esports',    teamAName: 'Team Alpha',   teamBName: 'Team Omega',  daysOut: 9,  venue: 'Online' },
  { sportKey: 'boardgame',  teamAName: 'Player 1',      teamBName: 'Player 2',    daysOut: 3,  venue: 'Game Night' },
  { sportKey: 'tennis',     teamAName: 'Player A',      teamBName: 'Player B',    daysOut: 12, venue: 'Court 1' },
];

function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(19, 0, 0, 0);
  return d.toISOString();
}
function buildDefaultEvents(): GameEvent[] {
  return [
    { id: 'evt-1', sportKey: 'football', teamA: { name: 'Home Team', color: '255, 69, 58' }, teamB: { name: 'Away Team', color: '0, 122, 255' }, date: isoInDays(21), venue: 'Home Stadium', prediction: 55, result: null, watchParty: true },
    { id: 'evt-2', sportKey: 'fantasy',  teamA: { name: 'You', color: '52, 199, 89' },        teamB: { name: 'The League', color: '196, 132, 252' }, date: isoInDays(5), venue: 'Draft Room', prediction: 70, result: null, watchParty: false },
    { id: 'evt-3', sportKey: 'soccer',   teamA: { name: 'Reds', color: '255, 159, 10' },       teamB: { name: 'Blues', color: '100, 200, 255' }, date: isoInDays(2), venue: 'City Park', prediction: 40, result: null, watchParty: true },
  ];
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
}
function formatCountdownLabel(event: GameEvent): string {
  if (event.result) return 'Final';
  const days = daysUntil(event.date);
  if (days < 0) return 'Awaiting result';
  if (days === 0) return '🔥 Today!';
  if (days === 1) return 'Tomorrow';
  return `in ${days}d`;
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
        style={{ color: `rgb(${colorRgb})`, borderColor: `rgb(${colorRgb})`, width: `${Math.max(draft.length, 4)}ch` }}
      />
    );
  }
  return (
    <button onClick={() => { setDraft(value); setEditing(true); }} className="text-footnote font-bold press underline decoration-dotted underline-offset-2" style={{ color: `rgb(${colorRgb})` }} title="Click to rename">
      {value}
    </button>
  );
}

// ---- prediction tug-of-war ----
function PredictionTug({ confidence, onChange, teamA, teamB, disabled }: {
  confidence: number; onChange: (v: number) => void; teamA: Team; teamB: Team; disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleMove = useCallback((clientX: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onChange(Math.round(ratio * 100));
  }, [onChange]);

  useEffect(() => {
    if (!dragging) return;
    function onMove(e: PointerEvent) { handleMove(e.clientX); }
    function onUp() { setDragging(false); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [dragging, handleMove]);

  return (
    <div style={{ opacity: disabled ? 0.55 : 1 }}>
      <div className="flex items-center justify-between text-caption mb-1">
        <span style={{ color: `rgb(${teamA.color})` }}>{teamA.name} {confidence}%</span>
        <span style={{ color: `rgb(${teamB.color})` }}>{teamB.name} {100 - confidence}%</span>
      </div>
      <div ref={ref} className="relative h-6 rounded-full overflow-hidden flex" style={{ touchAction: 'none' }}>
        <div className="transition-all duration-150" style={{ width: `${confidence}%`, background: `rgb(${teamA.color})` }} />
        <div className="transition-all duration-150" style={{ width: `${100 - confidence}%`, background: `rgb(${teamB.color})` }} />
        <div
          onPointerDown={() => !disabled && setDragging(true)}
          className="absolute top-1/2 rounded-full flex items-center justify-center"
          style={{ left: `${confidence}%`, width: 24, height: 24, transform: 'translate(-50%, -50%)', background: 'white', border: '3px solid rgba(0,0,0,0.3)', cursor: disabled ? 'not-allowed' : 'grab', touchAction: 'none', fontSize: 11 }}
        >
          🏆
        </div>
      </div>
    </div>
  );
}

export function SportsGamesTracker() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const maxEvents = isPro ? PRO_MAX_EVENTS : FREE_MAX_EVENTS;
  const heatmapWeeks = isPro ? PRO_HEATMAP_WEEKS : FREE_HEATMAP_WEEKS;

  const [events, setEvents] = useState<GameEvent[]>(buildDefaultEvents);
  const [tick, setTick] = useState(0);

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customSportKey, setCustomSportKey] = useState('football');
  const [customTeamAName, setCustomTeamAName] = useState('');
  const [customTeamAColor, setCustomTeamAColor] = useState(TEAM_COLORS[0]);
  const [customTeamBName, setCustomTeamBName] = useState('');
  const [customTeamBColor, setCustomTeamBColor] = useState(TEAM_COLORS[1]);
  const [customDateStr, setCustomDateStr] = useState('');
  const [customVenue, setCustomVenue] = useState('');

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(27);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/sports-games-tracker')
      .then(r => r.json())
      .then(data => {
        if (data.config && Array.isArray(data.config.events)) setEvents(data.config.events.slice(0, PRO_MAX_EVENTS));
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const sortedUpcoming = useMemo(
    () => [...events].filter(e => !e.result).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events, tick]
  );
  const nextEvent = sortedUpcoming[0] ?? null;

  const loggedEvents = useMemo(() => events.filter(e => e.result), [events]);
  const correctCount = useMemo(() => loggedEvents.filter(e => {
    if (e.result === 'draw') return false;
    const predictedA = e.prediction >= 50;
    return (predictedA && e.result === 'A') || (!predictedA && e.result === 'B');
  }).length, [loggedEvents]);
  const accuracyPct = loggedEvents.length > 0 ? Math.round((correctCount / loggedEvents.length) * 100) : null;

  const heatmap = useMemo(() => {
    const start = startOfWeek(new Date());
    const weeks: { date: Date; count: number }[][] = [];
    for (let w = 0; w < heatmapWeeks; w++) {
      const row: { date: Date; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(start);
        day.setDate(day.getDate() + w * 7 + d);
        const count = events.filter(e => sameDay(new Date(e.date), day)).length;
        row.push({ date: day, count });
      }
      weeks.push(row);
    }
    return weeks;
  }, [events, heatmapWeeks, tick]);
  const gamesThisWeek = heatmap[0]?.reduce((a, c) => a + c.count, 0) ?? 0;

  const rivalries = useMemo(() => {
    if (!isPro) return [];
    const map = new Map<string, { key: string; teamAName: string; teamBName: string; wins: Record<string, number>; draws: number; total: number }>();
    for (const e of events) {
      if (!e.result) continue;
      const names = [e.teamA.name, e.teamB.name].sort();
      const key = names.join(' vs ');
      if (!map.has(key)) map.set(key, { key, teamAName: names[0], teamBName: names[1], wins: { [names[0]]: 0, [names[1]]: 0 }, draws: 0, total: 0 });
      const r = map.get(key)!;
      r.total++;
      if (e.result === 'draw') r.draws++;
      else {
        const winnerName = e.result === 'A' ? e.teamA.name : e.teamB.name;
        r.wins[winnerName] = (r.wins[winnerName] ?? 0) + 1;
      }
    }
    return [...map.values()].filter(r => r.total >= 2);
  }, [events, isPro]);

  const health: 'today' | 'soon' | 'planned' | 'empty' =
    events.length === 0 ? 'empty' : nextEvent && daysUntil(nextEvent.date) <= 0 ? 'today' : nextEvent && daysUntil(nextEvent.date) <= 3 ? 'soon' : nextEvent ? 'planned' : 'empty';
  const healthLabel = {
    today: '🔥 Game day!',
    soon: '📅 Coming up fast',
    planned: '🗓️ On the calendar',
    empty: '➕ Add your first game',
  }[health];
  const healthColor = { today: '255, 69, 58', soon: '255, 159, 10', planned: GLOW, empty: '160, 160, 170' }[health];

  const atFreeLimit = !isPro && events.length >= FREE_MAX_EVENTS;

  function addEvent() {
    if (events.length >= maxEvents) {
      showToast(isPro ? `You can track up to ${maxEvents} events` : 'Upgrade to Pro to track more events', isPro ? '⚠️' : '⭐');
      return;
    }
    const used = new Set(events.map(e => `${e.teamA.name} vs ${e.teamB.name}`));
    const template = EVENT_TEMPLATES.find(t => !used.has(`${t.teamAName} vs ${t.teamBName}`)) ?? EVENT_TEMPLATES[events.length % EVENT_TEMPLATES.length];
    setEvents(prev => [...prev, {
      id: `evt-${Date.now()}`,
      sportKey: template.sportKey,
      teamA: { name: template.teamAName, color: TEAM_COLORS[prev.length % TEAM_COLORS.length] },
      teamB: { name: template.teamBName, color: TEAM_COLORS[(prev.length + 1) % TEAM_COLORS.length] },
      date: isoInDays(template.daysOut),
      venue: template.venue,
      prediction: 50,
      result: null,
      watchParty: false,
    }]);
  }

  function openCustomForm() {
    if (!isPro) { showToast('Upgrade to Pro to add a custom event', '⭐'); return; }
    if (events.length >= PRO_MAX_EVENTS) { showToast(`You can track up to ${PRO_MAX_EVENTS} events`, '⚠️'); return; }
    setCustomSportKey('football'); setCustomTeamAName(''); setCustomTeamAColor(TEAM_COLORS[0]);
    setCustomTeamBName(''); setCustomTeamBColor(TEAM_COLORS[1]); setCustomVenue('');
    const d = new Date(); d.setDate(d.getDate() + 14);
    setCustomDateStr(d.toISOString().slice(0, 10));
    setShowCustomForm(true);
  }
  function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!isPro) return;
    setEvents(prev => [...prev, {
      id: `evt-${Date.now()}`,
      sportKey: customSportKey,
      teamA: { name: customTeamAName.trim() || 'Team A', color: customTeamAColor },
      teamB: { name: customTeamBName.trim() || 'Team B', color: customTeamBColor },
      date: new Date(`${customDateStr}T19:00:00`).toISOString(),
      venue: customVenue.trim() || 'TBD',
      prediction: 50,
      result: null,
      watchParty: false,
    }]);
    setShowCustomForm(false);
    showToast('Custom event added', '✨');
  }

  function removeEvent(id: string) { setEvents(prev => prev.filter(e => e.id !== id)); }
  function cycleSport(id: string) { setEvents(prev => prev.map(e => e.id === id ? { ...e, sportKey: nextSport(e.sportKey) } : e)); }
  function cycleTeamColor(id: string, which: 'A' | 'B') {
    setEvents(prev => prev.map(e => {
      if (e.id !== id) return e;
      return which === 'A' ? { ...e, teamA: { ...e.teamA, color: nextColor(e.teamA.color) } } : { ...e, teamB: { ...e.teamB, color: nextColor(e.teamB.color) } };
    }));
  }
  function renameTeam(id: string, which: 'A' | 'B', name: string) {
    setEvents(prev => prev.map(e => {
      if (e.id !== id) return e;
      return which === 'A' ? { ...e, teamA: { ...e.teamA, name } } : { ...e, teamB: { ...e.teamB, name } };
    }));
  }
  function setPrediction(id: string, value: number) {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, prediction: value } : e));
  }
  function logResult(id: string, result: 'A' | 'B' | 'draw') {
    if (!isPro) { showToast('Upgrade to Pro to log results and track accuracy', '⭐'); return; }
    setEvents(prev => prev.map(e => e.id === id ? { ...e, result } : e));
  }
  function toggleWatchParty(id: string) {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, watchParty: !e.watchParty } : e));
  }

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save your tracker', '⭐'); return; }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/tools/sports-games-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
      if (!res.ok) throw new Error('save failed');
      showToast('Saved!', '💾');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSavingConfig(false);
    }
  }
  function handleReset() {
    setEvents(buildDefaultEvents());
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
    navigator.clipboard.writeText(window.location.href).then(() => showToast('Link copied!', '🔗')).catch(() => showToast('Could not copy link', '⚠️'));
  }
  function handleInvite(event: GameEvent) {
    const text = `Join me for ${event.teamA.name} vs ${event.teamB.name} on ${formatDate(new Date(event.date))}! ${sportOf(event.sportKey).emoji}`;
    navigator.clipboard.writeText(text).then(() => showToast('Invite copied!', '📤')).catch(() => showToast('Could not copy', '⚠️'));
  }
  function handleCopyPlan() {
    const lines = [
      `My tracked games${accuracyPct !== null ? ` (prediction accuracy: ${accuracyPct}%)` : ''}:`,
      ...[...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(e => `- ${sportOf(e.sportKey).emoji} ${e.teamA.name} vs ${e.teamB.name}: ${formatDate(new Date(e.date))} · ${formatCountdownLabel(e)}`),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Plan copied!', '📋')).catch(() => showToast('Could not copy', '⚠️'));
  }
  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>SPORTS & GAMES</p>
            <h2 className="text-title2">Game Day Tracker</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>↺ Reset</button>
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? 'Save your tracker to your account' : 'Upgrade to save your tracker'}
            >
              {isPro ? '💾' : '🔒'} {savingConfig ? 'Saving…' : 'Save'}
            </button>
            <div className="pill press transition-all duration-500" style={{ background: `rgba(${healthColor}, 0.15)`, color: `rgb(${healthColor})` }}>{healthLabel}</div>
          </div>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            { label: 'Next game', value: nextEvent ? formatCountdownLabel(nextEvent) : '—' },
            { label: 'Events tracked', value: `${events.length} / ${maxEvents}` },
            { label: 'Prediction accuracy', value: isPro ? (accuracyPct !== null ? `${accuracyPct}%` : '—') : '🔒' },
            { label: 'Games this week', value: String(gamesThisWeek) },
          ].map(stat => (
            <div key={stat.label} className="ios-card-nested p-3 text-center">
              <div className="text-title3 tabular" style={{ color: `rgb(${GLOW})` }}>{stat.value}</div>
              <div className="text-caption mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Scoreboard hero */}
        {nextEvent ? (
          <div className="rounded-2xl overflow-hidden mb-7 anim-fade-up" style={{ background: '#0a0e14', border: `1.5px solid rgba(${GLOW}, 0.35)`, boxShadow: `0 0 30px rgba(${GLOW}, 0.15)` }}>
            <div className="flex items-center justify-between px-5 pt-4">
              <span className="text-caption" style={{ color: `rgb(${nextEvent.teamA.color})` }}>{sportOf(nextEvent.sportKey).emoji} {nextEvent.venue}</span>
              <span className="text-caption" style={{ color: `rgb(${GLOW})` }}>{formatDate(new Date(nextEvent.date))}</span>
            </div>
            <div className="flex items-center justify-center gap-4 sm:gap-8 py-6 px-4">
              <div className="text-center flex-1">
                <div className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center font-bold text-sm" style={{ background: `rgb(${nextEvent.teamA.color})`, color: '#0a0e14' }}>
                  {nextEvent.teamA.name.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-footnote font-bold" style={{ color: `rgb(${nextEvent.teamA.color})` }}>{nextEvent.teamA.name}</p>
              </div>
              <div className="text-center">
                <div className="text-caption mb-1" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em' }}>VS</div>
                <div className="text-largetitle font-bold tabular" style={{ color: `rgb(${GLOW})`, textShadow: `0 0 16px rgba(${GLOW}, 0.6)` }}>
                  {Math.max(0, daysUntil(nextEvent.date))}d
                </div>
              </div>
              <div className="text-center flex-1">
                <div className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center font-bold text-sm" style={{ background: `rgb(${nextEvent.teamB.color})`, color: '#0a0e14' }}>
                  {nextEvent.teamB.name.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-footnote font-bold" style={{ color: `rgb(${nextEvent.teamB.color})` }}>{nextEvent.teamB.name}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="ios-card-nested p-6 text-center mb-7">
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>No upcoming games — add one below to see your scoreboard.</p>
          </div>
        )}

        {/* Game-density heatmap */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Game density</p>
            <p className="text-caption">{isPro ? `${PRO_HEATMAP_WEEKS} weeks` : `${FREE_HEATMAP_WEEKS} weeks (Pro: ${PRO_HEATMAP_WEEKS})`}</p>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {heatmap.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1 flex-shrink-0">
                {week.map((day, di) => {
                  const isToday = sameDay(day.date, new Date());
                  const bg = day.count === 0 ? 'var(--border-hairline)' : day.count === 1 ? `rgba(${GLOW}, 0.45)` : `rgba(${GLOW}, 0.9)`;
                  return (
                    <div
                      key={di}
                      title={`${formatDate(day.date)}: ${day.count} game${day.count === 1 ? '' : 's'}`}
                      className="rounded-sm"
                      style={{ width: 12, height: 12, background: bg, boxShadow: day.count > 1 ? `0 0 6px rgba(${GLOW}, 0.6)` : 'none', border: isToday ? `1.5px solid rgb(${GLOW})` : 'none' }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Event cards */}
        <div className="flex flex-col gap-3 mb-4">
          {events.length === 0 && (
            <div className="ios-card-nested p-6 text-center">
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>Nothing tracked yet — add your first game below.</p>
            </div>
          )}
          {[...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(e => {
            const sport = sportOf(e.sportKey);
            const isPast = daysUntil(e.date) < 0 && !e.result;
            return (
              <div key={e.id} className="ios-card-nested p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => cycleSport(e.id)} className="text-lg press" title="Click to change sport">{sport.emoji}</button>
                    <button onClick={() => cycleTeamColor(e.id, 'A')} className="w-3 h-3 rounded-full press" style={{ background: `rgb(${e.teamA.color})` }} title="Click to change color" />
                    <EditableName value={e.teamA.name} onCommit={v => renameTeam(e.id, 'A', v)} colorRgb={e.teamA.color} />
                    <span className="text-caption">vs</span>
                    <button onClick={() => cycleTeamColor(e.id, 'B')} className="w-3 h-3 rounded-full press" style={{ background: `rgb(${e.teamB.color})` }} title="Click to change color" />
                    <EditableName value={e.teamB.name} onCommit={v => renameTeam(e.id, 'B', v)} colorRgb={e.teamB.color} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-footnote font-bold" style={{ color: e.result ? 'var(--text-secondary)' : `rgb(${GLOW})` }}>{formatCountdownLabel(e)}</span>
                    <button onClick={() => removeEvent(e.id)} className="press text-caption" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                  </div>
                </div>

                <p className="text-caption">{formatDate(new Date(e.date))} · {e.venue}</p>

                <PredictionTug confidence={e.prediction} onChange={v => setPrediction(e.id, v)} teamA={e.teamA} teamB={e.teamB} disabled={!!e.result} />

                {e.result && (
                  <div className="pill text-[11px] self-start" style={{ background: `rgba(${GLOW}, 0.15)`, color: `rgb(${GLOW})` }}>
                    Final: {e.result === 'draw' ? 'Draw' : e.result === 'A' ? `${e.teamA.name} won` : `${e.teamB.name} won`}
                  </div>
                )}

                {isPast && !e.result && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-caption" style={{ color: 'var(--text-secondary)' }}>Log result{!isPro && ' 🔒'}:</span>
                    <button onClick={() => logResult(e.id, 'A')} className="ios-card-nested press text-xs px-2.5 py-1.5">{e.teamA.name} won</button>
                    <button onClick={() => logResult(e.id, 'draw')} className="ios-card-nested press text-xs px-2.5 py-1.5">Draw</button>
                    <button onClick={() => logResult(e.id, 'B')} className="ios-card-nested press text-xs px-2.5 py-1.5">{e.teamB.name} won</button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleWatchParty(e.id)}
                    className="ios-card-nested press text-xs px-2.5 py-1.5"
                    style={{ color: e.watchParty ? `rgb(${GLOW})` : 'var(--text-secondary)' }}
                  >
                    {e.watchParty ? '📺 Watch party on' : '📺 Watch party'}
                  </button>
                  {e.watchParty && (
                    <button onClick={() => handleInvite(e)} className="ios-card-nested press text-xs px-2.5 py-1.5" style={{ color: 'var(--text-secondary)' }}>📤 Invite friends</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button onClick={addEvent} className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5" style={{ color: events.length < maxEvents ? 'var(--text-secondary)' : 'var(--text-tertiary)', opacity: events.length >= maxEvents ? 0.5 : 1 }}>
              {atFreeLimit ? '🔒' : '+'} Add event
            </button>
            <button onClick={openCustomForm} className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5" style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
              {isPro ? '✨' : '🔒'} Custom event
            </button>
          </div>
          <button onClick={handleCopyPlan} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>📋 Copy plan</button>
        </div>

        {/* Custom event form (Pro only) */}
        {showCustomForm && isPro && (
          <form onSubmit={handleAddCustom} className="ios-card-nested p-4 mb-6 flex flex-col gap-3 anim-fade-up">
            <div className="flex items-center justify-between">
              <p className="text-footnote font-semibold">✨ New custom event</p>
              <button type="button" onClick={() => setShowCustomForm(false)} className="press text-caption" style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-caption">Sport</span>
                <select value={customSportKey} onChange={e => setCustomSportKey(e.target.value)} className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none" style={{ border: '1px solid var(--border-hairline)' }}>
                  {SPORT_TYPES.map(s => <option key={s.key} value={s.key}>{s.emoji} {s.name}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Venue</span>
                <input value={customVenue} onChange={e => setCustomVenue(e.target.value)} placeholder="e.g. Home Court" maxLength={40}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Team A</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setCustomTeamAColor(nextColor(customTeamAColor))} className="w-5 h-5 rounded-full press flex-shrink-0" style={{ background: `rgb(${customTeamAColor})` }} />
                  <input value={customTeamAName} onChange={e => setCustomTeamAName(e.target.value)} placeholder="Team A name" maxLength={24}
                    className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none flex-1" style={{ border: '1px solid var(--border-hairline)' }} />
                </div>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Team B</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setCustomTeamBColor(nextColor(customTeamBColor))} className="w-5 h-5 rounded-full press flex-shrink-0" style={{ background: `rgb(${customTeamBColor})` }} />
                  <input value={customTeamBName} onChange={e => setCustomTeamBName(e.target.value)} placeholder="Team B name" maxLength={24}
                    className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none flex-1" style={{ border: '1px solid var(--border-hairline)' }} />
                </div>
              </label>
              <label className="flex flex-col gap-1 col-span-2">
                <span className="text-caption">Date</span>
                <input type="date" value={customDateStr} onChange={e => setCustomDateStr(e.target.value)}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none tabular" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
            </div>
            <button type="submit" className="btn-filled press text-sm">Add event</button>
          </form>
        )}

        {/* Rivalries (Pro) */}
        {rivalries.length > 0 && (
          <div className="mb-7">
            <p className="text-footnote font-semibold mb-3">🥊 Head-to-head rivalries</p>
            <div className="flex flex-col gap-2">
              {rivalries.map(r => (
                <div key={r.key} className="ios-card-nested p-3 flex items-center justify-between">
                  <span className="text-footnote font-semibold">{r.teamAName} vs {r.teamBName}</span>
                  <span className="text-caption tabular" style={{ color: `rgb(${GLOW})` }}>
                    {r.wins[r.teamAName] ?? 0} – {r.wins[r.teamBName] ?? 0}{r.draws > 0 ? ` (${r.draws} draw${r.draws === 1 ? '' : 's'})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Free-tier banner */}
        {!isPro && (
          <div
            className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap"
            style={{
              border: atFreeLimit ? '1.5px solid rgba(var(--accent-orange), 0.4)' : '1px solid var(--border-hairline)',
              boxShadow: atFreeLimit ? '0 0 20px rgba(var(--accent-orange), 0.1)' : 'none',
            }}
          >
            <div>
              <p className="text-footnote font-bold mb-0.5">{atFreeLimit ? "⭐ You've hit the free limit" : `🔒 Free plan: ${FREE_MAX_EVENTS} events, ${FREE_HEATMAP_WEEKS}-week heatmap`}</p>
              <p className="text-caption">Upgrade to Premium for up to {PRO_MAX_EVENTS} events, a {PRO_HEATMAP_WEEKS}-week heatmap, result logging with a running Prediction Accuracy score, head-to-head rivalries, custom events, and saving.</p>
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

      <ToolCommentSection seedComments={SPORTS_GAMES_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />
      <ToastHost toast={toast} />
    </div>
  );
}
