// FILE: src/components/pro-tools/LaborOnsetPredictor.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { CommentThread } from '@/components/community/CommentThread';
import { EmbedCodeButton } from '@/components/embeds/EmbedCodeButton';

const GLOW = '255, 122, 89';

type SignKey = 'mucusPlug' | 'babyDropped';

// Illustrative day-since-sign -> "likelihood this week" score curves.
// These are deliberately wide/soft — no home sign reliably times labor.
const MUCUS_PLUG_CURVE: { d: number; s: number }[] = [
  { d: 0, s: 22 }, { d: 1, s: 38 }, { d: 2, s: 50 }, { d: 3, s: 55 },
  { d: 5, s: 50 }, { d: 7, s: 40 }, { d: 10, s: 26 }, { d: 14, s: 15 }, { d: 21, s: 8 },
];
const BABY_DROPPED_CURVE: { d: number; s: number }[] = [
  { d: 0, s: 14 }, { d: 3, s: 18 }, { d: 7, s: 24 }, { d: 14, s: 30 },
  { d: 21, s: 36 }, { d: 28, s: 40 },
];

function daysSince(dateIso: string | null): number | null {
  if (!dateIso) return null;
  return Math.max(0, Math.round((Date.now() - new Date(dateIso).getTime()) / 86400000));
}

function scoreFromCurve(curve: { d: number; s: number }[], days: number | null): number | null {
  if (days === null) return null;
  if (days <= curve[0].d) return curve[0].s;
  if (days >= curve[curve.length - 1].d) return curve[curve.length - 1].s;
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i], b = curve[i + 1];
    if (days >= a.d && days <= b.d) {
      const t = (days - a.d) / (b.d - a.d);
      return a.s + t * (b.s - a.s);
    }
  }
  return null;
}

interface Contraction { start: string; end: string }

// 5-1-1 rule: contractions every 5 min, lasting 1 min, for at least 1 hour.
function checkFiveOneOne(log: Contraction[]): boolean {
  const oneHourAgo = Date.now() - 3600_000;
  const recent = log
    .filter(c => new Date(c.start).getTime() >= oneHourAgo)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  if (recent.length < 6) return false; // need a real sustained hour of data
  const durationsOk = recent.every(c => (new Date(c.end).getTime() - new Date(c.start).getTime()) >= 55_000);
  let intervalsOk = true;
  for (let i = 1; i < recent.length; i++) {
    const gap = (new Date(recent[i].start).getTime() - new Date(recent[i - 1].start).getTime()) / 60000;
    if (gap > 5.5) intervalsOk = false;
  }
  return durationsOk && intervalsOk;
}

export function LaborOnsetPredictor() {
  const { data: session } = useSession();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const { toast, showToast } = useToast();

  const [loaded, setLoaded] = useState(false);
  const [mucusPlugDate, setMucusPlugDate] = useState<string | null>(null);
  const [babyDropped, setBabyDropped] = useState(false);
  const [babyDroppedDate, setBabyDroppedDate] = useState<string | null>(null);
  const [waterBroke, setWaterBroke] = useState(false);
  const [waterBrokeDate, setWaterBrokeDate] = useState<string | null>(null);
  const [contractionLog, setContractionLog] = useState<Contraction[]>([]);
  const [activeContractionStart, setActiveContractionStart] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!activeContractionStart) { setElapsedSec(0); return; }
    const startMs = new Date(activeContractionStart).getTime();
    const tick = () => setElapsedSec(Math.floor((Date.now() - startMs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeContractionStart]);
  const [notifyOnThreshold, setNotifyOnThreshold] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [toolLiked, setToolLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(76);

  useEffect(() => {
    fetch('/api/tools/labor-onset-predictor')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setMucusPlugDate(data.config.mucusPlugDate ? String(data.config.mucusPlugDate).slice(0, 10) : null);
          setBabyDropped(!!data.config.babyDropped);
          setBabyDroppedDate(data.config.babyDroppedDate ? String(data.config.babyDroppedDate).slice(0, 10) : null);
          setWaterBroke(!!data.config.waterBroke);
          setWaterBrokeDate(data.config.waterBrokeDate ? String(data.config.waterBrokeDate).slice(0, 10) : null);
          setContractionLog(Array.isArray(data.config.contractionLog) ? data.config.contractionLog : []);
          setNotifyOnThreshold(!!data.config.notifyOnThreshold);
          setShareLink(data.config.shareLink ?? null);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  async function persist(partial: Record<string, any> = {}) {
    try {
      const res = await fetch('/api/tools/labor-onset-predictor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mucusPlugDate, babyDropped, babyDroppedDate,
          waterBroke, waterBrokeDate, contractionLog,
          notifyOnThreshold, shareLink,
          ...partial,
        }),
      });
      if (!res.ok) throw new Error('save failed');
      return true;
    } catch {
      return false;
    }
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

  const activeSignCount = [mucusPlugDate, babyDropped].filter(Boolean).length;

  function handleSetMucusPlug(date: string) {
    if (!isPro && babyDropped) { showToast('Free plan tracks one sign at a time — upgrade to combine signs', '⭐'); return; }
    setMucusPlugDate(date);
    persist({ mucusPlugDate: date });
  }

  function handleToggleBabyDropped() {
    if (!isPro && !babyDropped && mucusPlugDate) { showToast('Free plan tracks one sign at a time — upgrade to combine signs', '⭐'); return; }
    const next = !babyDropped;
    const nextDate = next ? new Date().toISOString().slice(0, 10) : babyDroppedDate;
    setBabyDropped(next);
    if (next) setBabyDroppedDate(nextDate);
    persist({ babyDropped: next, babyDroppedDate: nextDate });
  }

  function handleToggleWaterBroke() {
    // Always free — this is a safety signal, never gated.
    const next = !waterBroke;
    const nextDate = next ? new Date().toISOString() : waterBrokeDate;
    setWaterBroke(next);
    if (next) setWaterBrokeDate(nextDate);
    persist({ waterBroke: next, waterBrokeDate: nextDate });
    if (next) showToast('If your water has broken, contact your provider now', '🚨');
  }

  function handleContractionTap() {
    if (!isPro) { showToast('Upgrade to Pro for the contraction timer', '⭐'); return; }
    if (!activeContractionStart) {
      setActiveContractionStart(new Date().toISOString());
      return;
    }
    const entry: Contraction = { start: activeContractionStart, end: new Date().toISOString() };
    const nextLog = [...contractionLog, entry].slice(-40);
    setContractionLog(nextLog);
    setActiveContractionStart(null);
    persist({ contractionLog: nextLog });
  }

  const fiveOneOne = useMemo(() => checkFiveOneOne(contractionLog), [contractionLog]);

  async function handleToggleNotify() {
    if (!isPro) { showToast('Upgrade to Pro for threshold alerts', '⭐'); return; }
    const next = !notifyOnThreshold;
    setNotifyOnThreshold(next);
    const ok = await persist({ notifyOnThreshold: next });
    if (ok) showToast(next ? 'You will be alerted on strong combined signals' : 'Alerts turned off', next ? '🔔' : '🔕');
    else { setNotifyOnThreshold(!next); showToast('Could not save — try again', '⚠️'); }
  }

  async function handleGenerateShareLink() {
    if (!isPro) { showToast('Upgrade to Pro to share Labor Watch', '⭐'); return; }
    const token = shareLink ?? Math.random().toString(36).slice(2, 10);
    const fullUrl = `${window.location.origin}/tools/labor-onset-predictor/watch/${token}`;
    const ok = await persist({ shareLink: token });
    if (ok) {
      setShareLink(token);
      await navigator.clipboard.writeText(fullUrl);
      showToast('Labor Watch link copied!', '🔗');
    } else {
      showToast('Could not create link — try again', '⚠️');
    }
  }

  const mucusScore = scoreFromCurve(MUCUS_PLUG_CURVE, daysSince(mucusPlugDate));
  const dropScore = scoreFromCurve(BABY_DROPPED_CURVE, daysSince(babyDroppedDate));
  const activeScores = [mucusScore, dropScore].filter((s): s is number => s !== null);
  const combinedScore = activeScores.length
    ? (isPro ? activeScores.reduce((a, b) => a + b, 0) / activeScores.length : activeScores[0])
    : null;

  if (!loaded) return <div className="ios-card p-8 text-center text-callout" style={{ color: 'var(--text-secondary)' }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <ToastHost toast={toast} />
      {waterBroke && (
        <div className="ios-card p-4 mb-4 flex gap-3 items-start" style={{ background: 'rgba(220,50,50,0.1)', border: '1.5px solid rgba(220,50,50,0.4)' }}>
          <span className="text-lg flex-shrink-0">🚨</span>
          <p className="text-footnote font-semibold" style={{ color: 'rgb(220,50,50)' }}>
            You've logged that your water broke. This tool doesn't produce a countdown for this — contact your provider or go to the hospital now, regardless of what any estimate below says.
          </p>
        </div>
      )}

      {fiveOneOne && (
        <div className="ios-card p-4 mb-4 flex gap-3 items-start" style={{ background: `rgba(${GLOW}, 0.1)`, border: `1.5px solid rgba(${GLOW}, 0.4)` }}>
          <span className="text-lg flex-shrink-0">⏱️</span>
          <p className="text-footnote font-semibold" style={{ color: `rgb(${GLOW})` }}>
            Your last hour of logged contractions matches the 5-1-1 rule (every 5 min, lasting 1 min, for an hour) — call your provider.
          </p>
        </div>
      )}

      <div className="ios-card p-6 sm:p-8 mb-4" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>SIGNS YOU'VE NOTICED</p>
        <h2 className="text-title2 mb-4">Log what's happening</h2>

        <div className="flex flex-col gap-3 mb-6">
          <div className="ios-card-nested p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-headline">Lost mucus plug</p>
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>Can precede labor by hours or weeks — on its own it's a weak signal.</p>
            </div>
            <input type="date" value={mucusPlugDate ?? ''} max={new Date().toISOString().slice(0, 10)}
              onChange={e => handleSetMucusPlug(e.target.value)} className="ios-input"
              style={{ colorScheme: 'dark', color: 'var(--text-primary)', background: 'var(--fill-secondary)' }} />
          </div>

          <button onClick={handleToggleBabyDropped} className="ios-card-nested press p-4 flex items-center justify-between gap-3 text-left" style={{ opacity: !isPro && !babyDropped && mucusPlugDate ? 0.55 : 1 }}>
            <div>
              <p className="text-headline">Baby has dropped / lightening</p>
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>Timing varies widely, especially for a first pregnancy.</p>
            </div>
            <span className="text-lg">{babyDropped ? '✅' : '⬜'}</span>
          </button>

          <button onClick={handleToggleWaterBroke} className="ios-card-nested press p-4 flex items-center justify-between gap-3 text-left">
            <div>
              <p className="text-headline">Water broke</p>
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>This is an act-now signal, not a wait-and-see one.</p>
            </div>
            <span className="text-lg">{waterBroke ? '✅' : '⬜'}</span>
          </button>
        </div>

        <div className="ios-card-nested p-5 mb-2">
          <p className="text-caption font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            {combinedScore === null ? 'LOG A SIGN TO SEE A STATUS' : isPro ? 'COMBINED LIKELIHOOD THIS WEEK' : 'BASIC STATUS'}
          </p>
          {combinedScore !== null && (
            <>
              <div className="w-full h-3 rounded-full overflow-hidden mb-2" style={{ background: 'var(--fill-secondary)' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, combinedScore)}%`, background: `rgb(${GLOW})`, transition: 'width 0.4s ease' }} />
              </div>
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
                {combinedScore >= 45 ? 'Your logged signs suggest labor may be more likely this week than a typical week — this is not a diagnosis or a due date.' : 'Your logged signs are within a typical range — most people wait longer between this sign and labor.'}
              </p>
              {!isPro && activeSignCount >= 1 && (
                <p className="text-footnote mt-2" style={{ color: `rgb(${GLOW})` }}>Upgrade to Pro to combine multiple signs into one score.</p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="ios-card p-6 sm:p-8 mb-4" style={{ opacity: isPro ? 1 : 0.6 }}>
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>PRO</p>
        <h2 className="text-title2 mb-4">Contraction timer</h2>
        <p className="text-footnote mb-4" style={{ color: 'var(--text-secondary)' }}>Tap once to start a contraction, tap again to stop. We check your last hour against the 5-1-1 rule.</p>
        {activeContractionStart && (
          <div className="text-center mb-3">
            <span className="text-title1 tabular" style={{ color: 'rgb(220,50,50)' }}>
              {String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:{String(elapsedSec % 60).padStart(2, '0')}
            </span>
          </div>
        )}
        <button onClick={handleContractionTap} className="btn-filled press w-full mb-3" style={{ background: activeContractionStart ? 'rgb(220,50,50)' : `rgb(${GLOW})` }}>
          {activeContractionStart ? 'Stop contraction' : 'Start contraction'}
        </button>
        <p className="text-footnote" style={{ color: 'var(--text-tertiary)' }}>{contractionLog.length} logged in this session's history.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onClick={handleToggleNotify} className="ios-card-nested press flex items-center gap-2.5 p-3 text-left" style={{ opacity: isPro ? 1 : 0.55 }}>
          <span className="text-lg">{notifyOnThreshold ? '🔔' : '🔕'}</span>
          <span className="text-footnote font-semibold">Alert me on a strong combined signal</span>
        </button>
        <button onClick={handleGenerateShareLink} className="ios-card-nested press flex items-center gap-2.5 p-3 text-left" style={{ opacity: isPro ? 1 : 0.55 }}>
          <span className="text-lg">🔗</span>
          <span className="text-footnote font-semibold">Copy Labor Watch link</span>
        </button>
      </div>

      <div className="ios-card-nested p-4 mt-4 flex gap-3 items-start" style={{ borderLeft: '3px solid rgb(var(--accent-orange))' }}>
        <span className="text-lg flex-shrink-0">⚠️</span>
        <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
          None of these signs reliably time labor for any individual, and this tool cannot replace your provider's guidance. If you're worried at any point — not just at "water broke" or the 5-1-1 rule — call your provider or go in.
        </p>
      </div>

      <div className="ios-card-nested p-1.5 flex gap-1.5 mt-4">
        <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: toolLiked ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>
          <span style={{ transform: toolLiked ? 'scale(1.2)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>{toolLiked ? '❤️' : '🤍'}</span>
          <span className="text-footnote font-semibold">{likeCount}</span>
        </button>
        <button onClick={handleShare} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>🔗 <span className="text-footnote font-semibold">Share</span></button>
        <button onClick={handleCommentJump} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>💬 <span className="text-footnote font-semibold">Comment</span></button>
      </div>

            <div className="flex justify-center mt-4 mb-4">
        <EmbedCodeButton slug="labor-onset-predictor" title="Labor Onset Predictor" glow={GLOW} />
      </div>

      <CommentThread subjectType="tool" subjectId="labor-onset-predictor" glow={GLOW} />
    </div>
  );
}
