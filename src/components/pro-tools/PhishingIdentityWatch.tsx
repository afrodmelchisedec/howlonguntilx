// FILE: src/components/pro-tools/PhishingIdentityWatch.tsx
'use client';
import { useState, useRef, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { PHISHING_IDENTITY_COMMENTS } from './phishingIdentityComments';

interface Flag { key: string; text: string; weight: number; pro?: boolean }
interface QuizCard { id: string; sender: string; snippet: string; isPhish: boolean; explanation: string }
interface WatchCategory { id: string; name: string; emoji: string; cadenceDays: number; lastChecked: string; custom?: boolean }

const GLOW = '6, 182, 212';
const SAFE_COLOR = '52, 199, 89';
const SUS_COLOR = '255, 159, 10';
const PHISH_COLOR = '255, 69, 58';

const FREE_MAX_WATCH = 3;
const PRO_MAX_WATCH = 8;
const FREE_QUIZ_SIZE = 5;
const PRO_QUIZ_SIZE = 10;

const FLAGS: Flag[] = [
  { key: 'sender',      text: "Sender email doesn't match the claimed organization", weight: 20 },
  { key: 'urgent',      text: 'Urgent or threatening language ("act now", "account suspended")', weight: 15 },
  { key: 'credentials', text: 'Asks for your password, PIN, or SSN directly', weight: 25 },
  { key: 'linkMismatch',text: "Link text doesn't match where it actually goes", weight: 20 },
  { key: 'attachment',  text: "Unexpected attachment you weren't expecting", weight: 15 },
  { key: 'greeting',    text: 'Generic greeting instead of your name', weight: 8 },
  { key: 'tooGood',     text: 'Too-good-to-be-true offer or prize', weight: 15, pro: true },
  { key: 'grammar',     text: 'Poor grammar or spelling throughout', weight: 8, pro: true },
  { key: 'giftcards',   text: 'Requests payment via gift cards or crypto', weight: 22, pro: true },
  { key: 'domain',      text: 'Suspicious or misspelled URL domain', weight: 18, pro: true },
  { key: 'bypass',      text: 'Pressure to bypass normal verification steps', weight: 15, pro: true },
  { key: 'unsolicited', text: "Unsolicited contact about an account you don't have", weight: 12, pro: true },
];

const QUIZ_CARDS: QuizCard[] = [
  { id: 'q1', sender: 'security@paypa1.com', snippet: 'Your account has been limited. Click here within 24 hours to verify your identity or it will be permanently suspended.', isPhish: true, explanation: 'Misspelled domain ("paypa1" with a numeral 1) plus urgency pressure — classic phishing markers.' },
  { id: 'q2', sender: 'noreply@netflix.com', snippet: 'Your monthly statement is ready to view in your account settings.', isPhish: false, explanation: 'Routine notification — no urgency, no request for credentials or payment.' },
  { id: 'q3', sender: 'hr@yourcompany-payroll.net', snippet: 'Please confirm your direct deposit details by replying with your bank account and routing number.', isPhish: true, explanation: 'Legitimate payroll changes never happen by email reply — always a secure portal login.' },
  { id: 'q4', sender: 'support@amazon.com', snippet: 'Your recent order has shipped. Track your package here.', isPhish: false, explanation: 'Standard shipping notification, no credential request.' },
  { id: 'q5', sender: 'prize-notify@international-lotto.org', snippet: "Congratulations! You've won $1,000,000. Send a $200 processing fee in gift cards to claim your prize.", isPhish: true, explanation: 'Gift-card payment requests are a near-universal giveaway of a scam.' },
  { id: 'q6', sender: 'billing@yourbank.com', snippet: "A new device signed into your account. If this wasn't you, review your recent activity in the app.", isPhish: false, explanation: 'Directs you into the official app rather than an embedded link — a good sign.' },
  { id: 'q7', sender: 'it-helpdesk@compnay.com', snippet: 'Your password expires in 1 hour. Click here immediately to keep access to your email.', isPhish: true, explanation: 'Misspelled sender domain plus an artificial 1-hour deadline designed to rush you.' },
  { id: 'q8', sender: 'no-reply@github.com', snippet: 'A new SSH key was added to your account. If this was you, no action is needed.', isPhish: false, explanation: 'Informational security alert — no link to click, no action requested.' },
  { id: 'q9', sender: 'apple-id-verify@icloud-secure.com', snippet: 'Your Apple ID has been locked for security reasons. Verify now to restore access.', isPhish: true, explanation: 'Not an official apple.com domain, and manufactures fear of losing account access.' },
  { id: 'q10', sender: 'updates@linkedin.com', snippet: 'You have 3 new profile views this week.', isPhish: false, explanation: 'Routine engagement notification — no urgency, no sensitive request.' },
];

const WATCH_TEMPLATES = [
  { name: 'Email breach check',           emoji: '📧', cadenceDays: 90 },
  { name: 'Financial statement review',   emoji: '💳', cadenceDays: 30 },
  { name: 'Credit report review',         emoji: '📊', cadenceDays: 120 },
  { name: 'Phone number check',           emoji: '📱', cadenceDays: 180 },
  { name: 'Social media privacy audit',   emoji: '🔒', cadenceDays: 120 },
  { name: 'Password manager audit',       emoji: '🗝️', cadenceDays: 90 },
  { name: 'SSN / govt ID monitoring',     emoji: '🪪', cadenceDays: 365 },
  { name: 'Data broker opt-out check',    emoji: '🕵️', cadenceDays: 180 },
];

function isoDaysAgo(days: number): string {
  const d = new Date(); d.setDate(d.getDate() - days); d.setHours(9, 0, 0, 0);
  return d.toISOString();
}
function buildDefaultWatch(): WatchCategory[] {
  return [
    { id: 'w-1', name: 'Email breach check', emoji: '📧', cadenceDays: 90, lastChecked: isoDaysAgo(70) },
    { id: 'w-2', name: 'Financial statement review', emoji: '💳', cadenceDays: 30, lastChecked: isoDaysAgo(25) },
    { id: 'w-3', name: 'Credit report review', emoji: '📊', cadenceDays: 120, lastChecked: isoDaysAgo(140) },
  ];
}
function formatDate(d: Date): string { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function daysSince(dateStr: string): number { return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000); }

function gaugePoint(value: number, r: number) {
  const angleDeg = 180 - (Math.max(0, Math.min(100, value)) / 100) * 180;
  const rad = (angleDeg * Math.PI) / 180;
  return { x: 150 + r * Math.cos(rad), y: 150 - r * Math.sin(rad) };
}
function bandArcPath(v1: number, v2: number, r: number): string {
  const p1 = gaugePoint(v1, r);
  const p2 = gaugePoint(v2, r);
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}`;
}

// ---- editable weight (Pro) ----
function EditableWeight({ value, onCommit, disabled }: { value: number; onCommit: (v: number) => void; disabled?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select(); } }, [editing]);
  function commit() { onCommit(Math.max(0, Math.min(30, Math.round(Number(draft) || 0)))); setEditing(false); }
  if (editing) {
    return (
      <input
        ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); } }}
        inputMode="numeric"
        className="text-caption font-bold bg-transparent outline-none border-b tabular"
        style={{ width: '3ch', borderColor: `rgb(${GLOW})` }}
      />
    );
  }
  return (
    <button onClick={() => { if (disabled) return; setDraft(String(value)); setEditing(true); }} disabled={disabled}
      className="text-caption font-bold press underline decoration-dotted underline-offset-2 tabular disabled:no-underline disabled:opacity-70"
      title={disabled ? 'Upgrade to Pro to edit weight' : 'Click to edit weight'}>
      +{value}
    </button>
  );
}

export function PhishingIdentityWatch() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const maxWatch = isPro ? PRO_MAX_WATCH : FREE_MAX_WATCH;
  const quizSize = isPro ? PRO_QUIZ_SIZE : FREE_QUIZ_SIZE;

  const [checkedFlags, setCheckedFlags] = useState<Set<string>>(new Set());
  const [weightOverrides, setWeightOverrides] = useState<Record<string, number>>({});

  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizGuess, setQuizGuess] = useState<'phish' | 'legit' | null>(null);
  const [quizStats, setQuizStats] = useState({ attempts: 0, correct: 0 });

  const [watchList, setWatchList] = useState<WatchCategory[]>(buildDefaultWatch);
  const [tick, setTick] = useState(0);

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('🛡️');
  const [customCadence, setCustomCadence] = useState('90');

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(21);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 60000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/phishing-identity-watch')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          if (Array.isArray(data.config.watchCategories)) setWatchList(data.config.watchCategories.slice(0, PRO_MAX_WATCH));
          if (data.config.flagWeightOverrides) setWeightOverrides(data.config.flagWeightOverrides);
          if (data.config.quizStats) setQuizStats(data.config.quizStats);
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const visibleFlags = isPro ? FLAGS : FLAGS.filter(f => !f.pro);
  function effectiveWeight(flag: Flag): number {
    return isPro && weightOverrides[flag.key] != null ? weightOverrides[flag.key] : flag.weight;
  }
  const threatScore = useMemo(() => {
    let sum = 0;
    for (const f of visibleFlags) if (checkedFlags.has(f.key)) sum += effectiveWeight(f);
    return Math.min(100, sum);
  }, [checkedFlags, visibleFlags, weightOverrides, isPro]);

  const verdict: 'safe' | 'suspicious' | 'phishing' = threatScore < 25 ? 'safe' : threatScore < 55 ? 'suspicious' : 'phishing';
  const verdictColor = { safe: SAFE_COLOR, suspicious: SUS_COLOR, phishing: PHISH_COLOR }[verdict];
  const verdictLabel = {
    safe: '✅ Looks safe',
    suspicious: '⚠️ Suspicious — verify independently',
    phishing: "🚨 Likely phishing — don't click, don't reply",
  }[verdict];

  const needlePt = gaugePoint(threatScore, 105);

  const deck = QUIZ_CARDS.slice(0, quizSize);
  const currentCard = deck[quizIndex % deck.length];
  const quizAccuracy = quizStats.attempts > 0 ? Math.round((quizStats.correct / quizStats.attempts) * 100) : null;

  const withDue = useMemo(() => watchList.map(w => {
    const since = daysSince(w.lastChecked);
    const daysUntilDue = w.cadenceDays - since;
    const status: 'overdue' | 'soon' | 'ok' = daysUntilDue < 0 ? 'overdue' : daysUntilDue <= 7 ? 'soon' : 'ok';
    return { cat: w, daysUntilDue, status };
  }), [watchList, tick]);
  const sortedWatch = useMemo(() => [...withDue].sort((a, b) => a.daysUntilDue - b.daysUntilDue), [withDue]);
  const overdueCount = withDue.filter(w => w.status === 'overdue').length;

  const health: 'overdue' | 'soon' | 'ok' | 'empty' =
    watchList.length === 0 ? 'empty' : overdueCount > 0 ? 'overdue' : withDue.some(w => w.status === 'soon') ? 'soon' : 'ok';
  const healthLabel = {
    overdue: `🚨 ${overdueCount} check${overdueCount === 1 ? '' : 's'} overdue`,
    soon: '⚠️ A check is coming up soon',
    ok: '✅ All checks up to date',
    empty: '➕ Add something to monitor',
  }[health];
  const healthColor = { overdue: PHISH_COLOR, soon: SUS_COLOR, ok: SAFE_COLOR, empty: '160, 160, 170' }[health];

  const atFreeLimit = !isPro && watchList.length >= FREE_MAX_WATCH;

  function toggleFlag(key: string) {
    setCheckedFlags(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  }
  function updateWeight(key: string, w: number) {
    if (!isPro) return;
    setWeightOverrides(prev => ({ ...prev, [key]: w }));
  }
  function resetInspector() { setCheckedFlags(new Set()); }

  function answerQuiz(guess: 'phish' | 'legit') {
    if (quizAnswered) return;
    const correct = (guess === 'phish') === currentCard.isPhish;
    setQuizGuess(guess);
    setQuizAnswered(true);
    setQuizStats(prev => ({ attempts: prev.attempts + 1, correct: prev.correct + (correct ? 1 : 0) }));
  }
  function nextQuizCard() {
    setQuizIndex(i => (i + 1) % deck.length);
    setQuizAnswered(false);
    setQuizGuess(null);
  }

  function addWatchCategory(template: typeof WATCH_TEMPLATES[number]) {
    if (watchList.length >= maxWatch) {
      showToast(isPro ? `You can monitor up to ${maxWatch} categories` : 'Upgrade to Pro to monitor more categories', isPro ? '⚠️' : '⭐');
      return;
    }
    setWatchList(prev => [...prev, { id: `w-${Date.now()}`, name: template.name, emoji: template.emoji, cadenceDays: template.cadenceDays, lastChecked: isoDaysAgo(0) }]);
  }
  function removeWatchCategory(id: string) { setWatchList(prev => prev.filter(w => w.id !== id)); }
  function markCheckedToday(id: string) { setWatchList(prev => prev.map(w => w.id === id ? { ...w, lastChecked: new Date().toISOString() } : w)); }
  function updateCadence(id: string, days: number) {
    if (!isPro) return;
    setWatchList(prev => prev.map(w => w.id === id ? { ...w, cadenceDays: Math.max(1, days) } : w));
  }

  function openCustomForm() {
    if (!isPro) { showToast('Upgrade to Pro to add a custom category', '⭐'); return; }
    if (watchList.length >= PRO_MAX_WATCH) { showToast(`You can monitor up to ${PRO_MAX_WATCH} categories`, '⚠️'); return; }
    setCustomName(''); setCustomEmoji('🛡️'); setCustomCadence('90');
    setShowCustomForm(true);
  }
  function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!isPro) return;
    setWatchList(prev => [...prev, {
      id: `w-${Date.now()}`, name: customName.trim() || 'Custom check', emoji: customEmoji.trim() || '🛡️',
      cadenceDays: Math.max(1, Math.round(Number(customCadence) || 90)), lastChecked: new Date().toISOString(), custom: true,
    }]);
    setShowCustomForm(false);
    showToast('Custom category added', '✨');
  }

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save your setup', '⭐'); return; }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/tools/phishing-identity-watch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchCategories: watchList, flagWeightOverrides: weightOverrides, quizStats }),
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
    setWatchList(buildDefaultWatch());
    setWeightOverrides({});
    setCheckedFlags(new Set());
    setQuizStats({ attempts: 0, correct: 0 });
    setQuizIndex(0); setQuizAnswered(false); setQuizGuess(null);
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
      `Threat gauge score: ${threatScore}% — ${verdictLabel}`,
      quizAccuracy !== null ? `Spot the Phish accuracy: ${quizAccuracy}%` : '',
      '',
      'Identity Watch:',
      ...sortedWatch.map(w => `- ${w.cat.emoji} ${w.cat.name}: ${w.status === 'overdue' ? `overdue by ${Math.abs(w.daysUntilDue)}d` : `due in ${w.daysUntilDue}d`}`),
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Copied!', '📋')).catch(() => showToast('Could not copy', '⚠️'));
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
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>PHISHING & IDENTITY THEFT</p>
            <h2 className="text-title2">Phishing Radar & Identity Watch</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>↺ Reset</button>
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? 'Save your setup to your account' : 'Upgrade to save your setup'}
            >
              {isPro ? '💾' : '🔒'} {savingConfig ? 'Saving…' : 'Save'}
            </button>
            <div className="pill press transition-all duration-500" style={{ background: `rgba(${healthColor}, 0.15)`, color: `rgb(${healthColor})` }}>{healthLabel}</div>
          </div>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            { label: 'Threat score', value: `${threatScore}%`, color: verdictColor },
            { label: 'Quiz accuracy', value: quizAccuracy !== null ? `${quizAccuracy}%` : '—' },
            { label: 'Watch categories', value: `${watchList.length} / ${maxWatch}` },
            { label: 'Checks overdue', value: String(overdueCount), color: overdueCount > 0 ? PHISH_COLOR : undefined },
          ].map(stat => (
            <div key={stat.label} className="ios-card-nested p-3 text-center">
              <div className="text-title3 tabular" style={{ color: `rgb(${stat.color ?? GLOW})` }}>{stat.value}</div>
              <div className="text-caption mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Threat Gauge */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Threat Gauge — check what applies to a suspicious message</p>
            <button onClick={resetInspector} className="text-caption press" style={{ color: 'var(--text-secondary)' }}>clear</button>
          </div>
          <svg viewBox="0 0 300 170" width="100%" style={{ maxWidth: 360, display: 'block', margin: '0 auto' }}>
            <path d={bandArcPath(0, 25, 120)} fill="none" stroke={`rgb(${SAFE_COLOR})`} strokeWidth={14} strokeLinecap="round" opacity={0.85} />
            <path d={bandArcPath(25, 55, 120)} fill="none" stroke={`rgb(${SUS_COLOR})`} strokeWidth={14} opacity={0.85} />
            <path d={bandArcPath(55, 100, 120)} fill="none" stroke={`rgb(${PHISH_COLOR})`} strokeWidth={14} strokeLinecap="round" opacity={0.85} />
            <line x1={150} y1={150} x2={needlePt.x} y2={needlePt.y} stroke="white" strokeWidth={4} strokeLinecap="round" style={{ transition: 'all 0.3s ease-out' }} />
            <circle cx={150} cy={150} r={8} fill="white" />
            <text x={150} y={140} textAnchor="middle" fontSize="26" fontWeight="bold" fill={`rgb(${verdictColor})`}>{threatScore}%</text>
          </svg>
          <p className="text-center text-footnote font-bold mb-4" style={{ color: `rgb(${verdictColor})` }}>{verdictLabel}</p>
          <div className="flex flex-col gap-2">
            {visibleFlags.map(flag => (
              <label key={flag.key} className="ios-card-nested p-3 flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={checkedFlags.has(flag.key)} onChange={() => toggleFlag(flag.key)} />
                <span className="text-footnote flex-1" style={{ color: 'var(--text-secondary)' }}>{flag.text}</span>
                <EditableWeight value={effectiveWeight(flag)} onCommit={v => updateWeight(flag.key, v)} disabled={!isPro} />
              </label>
            ))}
            {!isPro && (
              <div className="ios-card-nested p-3 text-center">
                <p className="text-caption">🔒 {FLAGS.length - visibleFlags.length} more red flags unlock with Pro</p>
              </div>
            )}
          </div>
        </div>

        {/* Spot the Phish quiz */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Spot the Phish</p>
            <p className="text-caption">card {(quizIndex % deck.length) + 1} / {deck.length}</p>
          </div>
          <div className="ios-card-nested p-4">
            <p className="text-caption mb-1" style={{ color: 'var(--text-secondary)' }}>From: {currentCard.sender}</p>
            <p className="text-footnote mb-4">"{currentCard.snippet}"</p>
            {!quizAnswered ? (
              <div className="flex items-center gap-3">
                <button onClick={() => answerQuiz('phish')} className="ios-card-nested press flex-1 py-2 text-sm font-semibold">🎣 Phishing</button>
                <button onClick={() => answerQuiz('legit')} className="ios-card-nested press flex-1 py-2 text-sm font-semibold">✅ Legit</button>
              </div>
            ) : (
              <div className="anim-fade-up">
                <p className="text-footnote font-bold mb-1" style={{ color: (quizGuess === 'phish') === currentCard.isPhish ? `rgb(${SAFE_COLOR})` : `rgb(${PHISH_COLOR})` }}>
                  {(quizGuess === 'phish') === currentCard.isPhish ? '✅ Correct — ' : '❌ Not quite — '}
                  this was {currentCard.isPhish ? 'phishing' : 'legitimate'}.
                </p>
                <p className="text-caption mb-3">{currentCard.explanation}</p>
                <button onClick={nextQuizCard} className="btn-filled press text-sm w-full">Next card →</button>
              </div>
            )}
          </div>
        </div>

        {/* Identity Watch */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-footnote font-semibold">Identity Watch</p>
            <button onClick={openCustomForm} className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5" style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
              {isPro ? '✨' : '🔒'} Add custom category
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {sortedWatch.length === 0 && (
              <div className="ios-card-nested p-6 text-center">
                <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>Nothing monitored yet — add a category below.</p>
              </div>
            )}
            {sortedWatch.map(({ cat, daysUntilDue, status }) => {
              const color = { overdue: PHISH_COLOR, soon: SUS_COLOR, ok: SAFE_COLOR }[status];
              return (
                <div key={cat.id} className="ios-card-nested p-3 flex flex-col gap-2" style={{ borderLeft: `3px solid rgb(${color})` }}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="text-footnote font-bold">{cat.name}</span>
                      {cat.custom && <span className="pill text-[9px]" style={{ background: `rgba(${GLOW}, 0.15)`, color: `rgb(${GLOW})` }}>custom</span>}
                    </div>
                    <button onClick={() => removeWatchCategory(cat.id)} className="press text-caption" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2 text-caption">
                    <span style={{ color: `rgb(${color})`, fontWeight: 700 }}>
                      {status === 'overdue' ? `🚨 Overdue by ${Math.abs(daysUntilDue)}d` : `Due in ${daysUntilDue}d`}
                    </span>
                    <span className="flex items-center gap-1.5">
                      cadence: {isPro ? (
                        <input type="number" min={1} value={cat.cadenceDays} onChange={e => updateCadence(cat.id, Number(e.target.value) || 1)}
                          className="w-14 rounded-lg px-1.5 py-0.5 text-caption bg-transparent outline-none tabular" style={{ border: '1px solid var(--border-hairline)' }} />
                      ) : <strong>{cat.cadenceDays}</strong>}d
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-caption">Last checked {formatDate(new Date(cat.lastChecked))}</span>
                    <button onClick={() => markCheckedToday(cat.id)} className="ios-card-nested press text-xs px-2.5 py-1.5">Mark checked today</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {WATCH_TEMPLATES.filter(t => !watchList.some(w => w.name === t.name)).map(t => (
              <button key={t.name} onClick={() => addWatchCategory(t)} className="ios-card-nested press px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5" style={{ opacity: watchList.length >= maxWatch ? 0.5 : 1 }}>
                {t.emoji} {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Custom category form (Pro only) */}
        {showCustomForm && isPro && (
          <form onSubmit={handleAddCustom} className="ios-card-nested p-4 mb-6 flex flex-col gap-3 anim-fade-up">
            <div className="flex items-center justify-between">
              <p className="text-footnote font-semibold">✨ Add custom watch category</p>
              <button type="button" onClick={() => setShowCustomForm(false)} className="press text-caption" style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 col-span-2">
                <span className="text-caption">Name</span>
                <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. VPN subscription review" maxLength={40}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Emoji</span>
                <input value={customEmoji} onChange={e => setCustomEmoji(e.target.value)} maxLength={2}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Cadence (days)</span>
                <input type="number" min={1} value={customCadence} onChange={e => setCustomCadence(e.target.value)}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none tabular" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
            </div>
            <button type="submit" className="btn-filled press text-sm">Add to watch list</button>
          </form>
        )}

        <div className="flex items-center justify-end mb-7">
          <button onClick={handleCopyPlan} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>📋 Copy summary</button>
        </div>

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
              <p className="text-footnote font-bold mb-0.5">{atFreeLimit ? "⭐ You've hit the free limit" : `🔒 Free plan: 6 red flags, 5-card quiz, ${FREE_MAX_WATCH} watch categories`}</p>
              <p className="text-caption">Upgrade to Premium for all 12 red flags with editable weights, the full 10-card quiz, up to {PRO_MAX_WATCH} watch categories with custom cadence, custom categories, and saving your setup.</p>
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

      <ToolCommentSection seedComments={PHISHING_IDENTITY_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />
      <ToastHost toast={toast} />
    </div>
  );
}
