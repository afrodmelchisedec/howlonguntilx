// FILE: src/components/pro-tools/BirthControlEffectivenessCountdown.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { CommentThread } from '@/components/community/CommentThread';
import { EmbedCodeButton } from '@/components/embeds/EmbedCodeButton';

const GLOW = '150, 111, 255';

type Method = 'PILL_COMBINED' | 'PILL_MINI' | 'PATCH' | 'RING' | 'SHOT' | 'IUD_HORMONAL' | 'IUD_COPPER' | 'IMPLANT' | 'PLAN_B' | 'CONDOM';

// Typical/general timing windows only — not personalized medical advice.
// Always defer to the instructions in the specific product's insert or a provider.
const METHOD_INFO: Record<Method, {
  label: string; emoji: string; category: 'ongoing' | 'emergency' | 'immediate';
  daysToEffective: number; immediateIfEarlyCycle: boolean;
  refillCycleDays?: number; durationYears?: number;
}> = {
  PILL_COMBINED: { label: 'Combined Pill', emoji: '💊', category: 'ongoing', daysToEffective: 7, immediateIfEarlyCycle: true, refillCycleDays: 28 },
  PILL_MINI:     { label: 'Mini Pill',     emoji: '💊', category: 'ongoing', daysToEffective: 2, immediateIfEarlyCycle: false, refillCycleDays: 28 },
  PATCH:         { label: 'Patch',         emoji: '🩹', category: 'ongoing', daysToEffective: 7, immediateIfEarlyCycle: true, refillCycleDays: 7 },
  RING:          { label: 'Ring',          emoji: '⭕', category: 'ongoing', daysToEffective: 7, immediateIfEarlyCycle: true, refillCycleDays: 21 },
  SHOT:          { label: 'Shot (Depo)',   emoji: '💉', category: 'ongoing', daysToEffective: 7, immediateIfEarlyCycle: true, refillCycleDays: 84 },
  IUD_HORMONAL:  { label: 'Hormonal IUD',  emoji: '🌀', category: 'ongoing', daysToEffective: 7, immediateIfEarlyCycle: true, durationYears: 5 },
  IUD_COPPER:    { label: 'Copper IUD',    emoji: '🌀', category: 'immediate', daysToEffective: 0, immediateIfEarlyCycle: true, durationYears: 10 },
  IMPLANT:       { label: 'Implant',       emoji: '🦴', category: 'ongoing', daysToEffective: 7, immediateIfEarlyCycle: true, durationYears: 3 },
  CONDOM:        { label: 'Condom',        emoji: '🛡️', category: 'immediate', daysToEffective: 0, immediateIfEarlyCycle: true },
  PLAN_B:        { label: 'Emergency (Plan B)', emoji: '🚨', category: 'emergency', daysToEffective: 0, immediateIfEarlyCycle: true },
};

function fullyEffectiveDate(method: Method, startDate: string, cycleDayAtStart: number): Date {
  const info = METHOD_INFO[method];
  const start = new Date(startDate + 'T00:00:00');
  const immediate = info.immediateIfEarlyCycle && cycleDayAtStart <= 5;
  const days = immediate ? 0 : info.daysToEffective;
  return new Date(start.getTime() + days * 86400000);
}

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

function RadialGauge({ percent, label, color, size = 168 }: { percent: number; label: string; color: string; size?: number }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--fill-secondary)" strokeWidth={12} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`rgb(${color})`} strokeWidth={12}
          strokeDasharray={c} strokeDashoffset={c - (clamped / 100) * c} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-title1 font-bold tabular" style={{ color: `rgb(${color})` }}>{Math.round(clamped)}%</span>
        <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      </div>
    </div>
  );
}

export function BirthControlEffectivenessCountdown() {
  const { data: session } = useSession();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const { toast, showToast } = useToast();

  const [loaded, setLoaded] = useState(false);
  const [method, setMethod] = useState<Method>('PILL_COMBINED');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [cycleDayAtStart, setCycleDayAtStart] = useState(1);
  const [intercourseAt, setIntercourseAt] = useState(new Date().toISOString().slice(0, 16));
  const [refillReminderDays, setRefillReminderDays] = useState(3);
  const [notifyOnFullyEffective, setNotifyOnFullyEffective] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [methodHistory, setMethodHistory] = useState<{ method: Method; startDate: string }[]>([]);
  const [toolLiked, setToolLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(58);

  useEffect(() => {
    fetch('/api/tools/birth-control-effectiveness-countdown')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setMethod(data.config.method ?? 'PILL_COMBINED');
          if (data.config.startDate) setStartDate(String(data.config.startDate).slice(0, 10));
          if (data.config.cycleDayAtStart) setCycleDayAtStart(data.config.cycleDayAtStart);
          if (data.config.intercourseAt) setIntercourseAt(String(data.config.intercourseAt).slice(0, 16));
          setRefillReminderDays(data.config.refillReminderDays ?? 3);
          setNotifyOnFullyEffective(!!data.config.notifyOnFullyEffective);
          setShareLink(data.config.shareLink ?? null);
          setMethodHistory(Array.isArray(data.config.methodHistory) ? data.config.methodHistory : []);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  async function persist(partial: Record<string, any> = {}) {
    try {
      const res = await fetch('/api/tools/birth-control-effectiveness-countdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method, startDate, cycleDayAtStart, intercourseAt,
          refillReminderDays, notifyOnFullyEffective, shareLink, methodHistory,
          ...partial,
        }),
      });
      if (!res.ok) throw new Error('save failed');
      return true;
    } catch {
      return false;
    }
  }

  function handleSelectMethod(m: Method) {
    setMethod(m);
    persist({ method: m });
  }

  function handleSwitchMethod() {
    if (!isPro) { showToast('Upgrade to Pro to keep a method history', '⭐'); return; }
    const entry = { method, startDate };
    const nextHistory = [...methodHistory, entry].slice(-12);
    setMethodHistory(nextHistory);
    setStartDate(new Date().toISOString().slice(0, 10));
    setCycleDayAtStart(1);
    persist({ methodHistory: nextHistory, startDate: new Date().toISOString().slice(0, 10), cycleDayAtStart: 1 });
    showToast('Logged previous method to your history', '📌');
  }

  async function handleToggleNotify() {
    if (!isPro) { showToast('Upgrade to Pro for effectiveness alerts', '⭐'); return; }
    const next = !notifyOnFullyEffective;
    setNotifyOnFullyEffective(next);
    const ok = await persist({ notifyOnFullyEffective: next });
    if (ok) showToast(next ? 'You will be alerted when fully effective' : 'Alert turned off', next ? '🔔' : '🔕');
    else { setNotifyOnFullyEffective(!next); showToast('Could not save — try again', '⚠️'); }
  }

  async function handleGenerateShareLink() {
    if (!isPro) { showToast('Upgrade to Pro to share Coverage Watch', '⭐'); return; }
    const token = shareLink ?? Math.random().toString(36).slice(2, 10);
    const fullUrl = `${window.location.origin}/tools/birth-control-effectiveness-countdown/watch/${token}`;
    const ok = await persist({ shareLink: token });
    if (ok) {
      setShareLink(token);
      await navigator.clipboard.writeText(fullUrl);
      showToast('Coverage Watch link copied!', '🔗');
    } else {
      showToast('Could not create link — try again', '⚠️');
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

  const info = METHOD_INFO[method];
  const isEmergency = info.category === 'emergency';

  // Ongoing methods: coverage builds UP to 100% as of fullyEffectiveDate.
  const effectiveAt = useMemo(() => fullyEffectiveDate(method, startDate, cycleDayAtStart), [method, startDate, cycleDayAtStart]);
  const coverageCountdown = useCountdown(!isEmergency ? effectiveAt.toISOString() : null);
  const coveragePercent = useMemo(() => {
    if (isEmergency) return 0;
    const start = new Date(startDate + 'T00:00:00').getTime();
    const end = effectiveAt.getTime();
    if (end <= start) return 100;
    const now = Date.now();
    return ((now - start) / (end - start)) * 100;
  }, [isEmergency, startDate, effectiveAt]);
  const isFullyEffective = !isEmergency && Date.now() >= effectiveAt.getTime();

  // Plan B: window DECLINES from the moment of intercourse — opposite shape.
  const windowCloseAt = useMemo(() => new Date(new Date(intercourseAt).getTime() + 120 * 3600000), [intercourseAt]);
  const windowCountdown = useCountdown(isEmergency ? windowCloseAt.toISOString() : null);
  const windowPercentRemaining = useMemo(() => {
    if (!isEmergency) return 0;
    const start = new Date(intercourseAt).getTime();
    const end = windowCloseAt.getTime();
    const now = Date.now();
    return Math.max(0, Math.min(100, ((end - now) / (end - start)) * 100));
  }, [isEmergency, intercourseAt, windowCloseAt]);
  const windowClosingSoon = isEmergency && windowPercentRemaining > 0 && windowPercentRemaining < 25;
  const windowClosed = isEmergency && windowPercentRemaining <= 0;

  if (!loaded) return <div className="ios-card p-8 text-center text-callout" style={{ color: 'var(--text-secondary)' }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <ToastHost toast={toast} />

      {isEmergency && (windowClosingSoon || windowClosed) && (
        <div className="ios-card p-4 mb-4 flex gap-3 items-start" style={{ background: 'rgba(220,50,50,0.1)', border: '1.5px solid rgba(220,50,50,0.4)' }}>
          <span className="text-lg flex-shrink-0">🚨</span>
          <p className="text-footnote font-semibold" style={{ color: 'rgb(220,50,50)' }}>
            {windowClosed
              ? 'The typical emergency-contraception window has passed. Contact your provider or pharmacist about next steps.'
              : 'Effectiveness declines the longer you wait — if you plan to use emergency contraception, taking it as soon as possible matters more than any other factor here.'}
          </p>
        </div>
      )}

      <div className="ios-card p-6 sm:p-8 mb-4" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>METHOD</p>
        <h2 className="text-title2 mb-4">What are you using?</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
          {(Object.keys(METHOD_INFO) as Method[]).map(m => (
            <button key={m} onClick={() => handleSelectMethod(m)} className="ios-card-nested press p-3 flex flex-col items-center gap-1 text-center"
              style={{ boxShadow: method === m ? `0 0 0 2px rgb(${GLOW})` : 'none' }}>
              <span className="text-lg">{METHOD_INFO[m].emoji}</span>
              <span className="text-caption font-semibold">{METHOD_INFO[m].label}</span>
            </button>
          ))}
        </div>

        {isEmergency ? (
          <div className="ios-card-nested p-4 mb-6">
            <p className="text-headline mb-2">When did this happen?</p>
            <input type="datetime-local" value={intercourseAt} max={new Date().toISOString().slice(0, 16)}
              onChange={e => { setIntercourseAt(e.target.value); persist({ intercourseAt: e.target.value }); }}
              className="ios-input w-full" style={{ colorScheme: 'dark', color: 'var(--text-primary)', background: 'var(--fill-secondary)' }} />
          </div>
        ) : (
          <div className="ios-card-nested p-4 mb-6">
            <p className="text-headline mb-2">When did you start?</p>
            <input type="date" value={startDate} max={new Date().toISOString().slice(0, 10)}
              onChange={e => { setStartDate(e.target.value); persist({ startDate: e.target.value }); }}
              className="ios-input w-full mb-4" style={{ colorScheme: 'dark', color: 'var(--text-primary)', background: 'var(--fill-secondary)' }} />

            <div className="flex items-center justify-between mb-1">
              <p className="text-footnote font-semibold">Day of your cycle you started</p>
              <span className="text-footnote tabular" style={{ color: `rgb(${GLOW})` }}>Day {cycleDayAtStart}</span>
            </div>
            <input type="range" min={1} max={28} value={cycleDayAtStart}
              onChange={e => setCycleDayAtStart(Number(e.target.value))}
              onMouseUp={() => persist({ cycleDayAtStart })} onTouchEnd={() => persist({ cycleDayAtStart })}
              className="w-full" style={{ accentColor: `rgb(${GLOW})` }} />
            <p className="text-footnote mt-2" style={{ color: 'var(--text-secondary)' }}>
              {cycleDayAtStart <= 5 && info.immediateIfEarlyCycle
                ? 'Started within the first 5 days of your cycle — typically counted as immediately effective.'
                : `Typically takes about ${info.daysToEffective} day${info.daysToEffective === 1 ? '' : 's'} to reach full effectiveness.`}
            </p>
          </div>
        )}

        <div className="flex flex-col items-center py-2">
          {isEmergency ? (
            <>
              <RadialGauge percent={windowPercentRemaining} label="window left" color={windowClosingSoon || windowClosed ? '220,50,50' : GLOW} />
              {!windowClosed && (
                <p className="text-footnote mt-3 tabular" style={{ color: 'var(--text-secondary)' }}>
                  {windowCountdown.days}d {windowCountdown.hours}h {windowCountdown.minutes}m remaining in the typical window
                </p>
              )}
            </>
          ) : (
            <>
              <RadialGauge percent={coveragePercent} label="covered" color={GLOW} />
              <p className="text-footnote mt-3" style={{ color: 'var(--text-secondary)' }}>
                {isFullyEffective
                  ? 'Typically considered fully effective as of today.'
                  : `${coverageCountdown.days}d ${coverageCountdown.hours}h ${coverageCountdown.minutes}m until typically fully effective`}
              </p>
            </>
          )}
        </div>
      </div>

      {!isEmergency && (
        <div className="ios-card p-6 sm:p-8 mb-4" style={{ opacity: isPro ? 1 : 0.6 }}>
          <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>PRO</p>
          <h2 className="text-title2 mb-4">Refill &amp; method history</h2>

          <div className="flex items-center justify-between mb-1">
            <p className="text-footnote font-semibold">Remind me before refill/expiry</p>
            <span className="text-footnote tabular" style={{ color: `rgb(${GLOW})` }}>{refillReminderDays} day{refillReminderDays === 1 ? '' : 's'} before</span>
          </div>
          <input type="range" min={1} max={14} value={refillReminderDays} disabled={!isPro}
            onChange={e => setRefillReminderDays(Number(e.target.value))}
            onMouseUp={() => isPro && persist({ refillReminderDays })} onTouchEnd={() => isPro && persist({ refillReminderDays })}
            className="w-full mb-4" style={{ accentColor: `rgb(${GLOW})` }} />

          <button onClick={handleSwitchMethod} className="ios-card-nested press w-full p-3 text-footnote font-semibold mb-3">
            Log current method &amp; switch to a new one
          </button>

          {methodHistory.length > 0 && (
            <div className="flex flex-col gap-2">
              {methodHistory.slice().reverse().map((h, i) => (
                <div key={i} className="ios-card-nested px-3 py-2 flex items-center justify-between">
                  <span className="text-footnote">{METHOD_INFO[h.method]?.emoji} {METHOD_INFO[h.method]?.label}</span>
                  <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>from {h.startDate}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onClick={handleToggleNotify} className="ios-card-nested press flex items-center gap-2.5 p-3 text-left" style={{ opacity: isPro ? 1 : 0.55 }}>
          <span className="text-lg">{notifyOnFullyEffective ? '🔔' : '🔕'}</span>
          <span className="text-footnote font-semibold">Alert me when fully effective</span>
        </button>
        <button onClick={handleGenerateShareLink} className="ios-card-nested press flex items-center gap-2.5 p-3 text-left" style={{ opacity: isPro ? 1 : 0.55 }}>
          <span className="text-lg">🔗</span>
          <span className="text-footnote font-semibold">Copy Coverage Watch link</span>
        </button>
      </div>

      <div className="ios-card-nested p-4 mt-4 flex gap-3 items-start" style={{ borderLeft: '3px solid rgb(var(--accent-orange))' }}>
        <span className="text-lg flex-shrink-0">⚠️</span>
        <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
          These are general, typical timing windows — not personalized medical advice. Always follow the instructions that came with your specific prescription, and check with your provider or pharmacist for anything specific to you.
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
        <EmbedCodeButton slug="birth-control-effectiveness-countdown" title="Birth Control Effectiveness Countdown" glow={GLOW} />
      </div>

      <CommentThread subjectType="tool" subjectId="birth-control-effectiveness-countdown" glow={GLOW} />
    </div>
  );
}
