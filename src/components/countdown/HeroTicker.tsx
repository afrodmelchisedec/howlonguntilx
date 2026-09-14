'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { CalendarEvent } from '@/lib/calendar-shared';

type Mode = 'future' | 'past';
type SlideDir = 'left' | 'right' | null;

function getTimeParts(target: Date, mode: Mode) {
  const rawDiff = mode === 'future'
    ? target.getTime() - Date.now()
    : Date.now() - target.getTime();
  const diff = Math.max(rawDiff, 0);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

function pad(n: number) { return String(n).padStart(2, '0'); }

function buzz(ms: number) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(ms);
  }
}

interface Props {
  events: CalendarEvent[];
  pastEvents: CalendarEvent[];
}

export function HeroTicker({ events, pastEvents }: Props) {
  const router = useRouter();
  const futureList = events.filter(ev => !!ev.date);
  const pastList = pastEvents.filter(ev => !!ev.date);

  const [mode, setMode] = useState<Mode>('future');
  const [futureIndex, setFutureIndex] = useState(0);
  const [pastIndex, setPastIndex] = useState(0);
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [fade, setFade] = useState(true);
  const [slideDir, setSlideDir] = useState<SlideDir>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [pressing, setPressing] = useState(false);
  const autoRef = useRef<NodeJS.Timeout | null>(null);
  const modeRef = useRef<Mode>('future');

  useEffect(() => { modeRef.current = mode; }, [mode]);

  const activeList = mode === 'future' ? futureList : pastList;
  const activeIndex = mode === 'future' ? futureIndex : pastIndex;

  function transitionTo(nextMode: Mode, nextIndex: number, direction: SlideDir = null) {
    setSlideDir(direction);
    setFade(false);
    setTimeout(() => {
      setMode(nextMode);
      if (nextMode === 'future') setFutureIndex(nextIndex);
      else setPastIndex(nextIndex);
      setFade(true);
    }, 280);
  }

  function resetAuto() {
    if (autoRef.current) clearInterval(autoRef.current);
    if (futureList.length <= 1) return;
    autoRef.current = setInterval(() => {
      if (modeRef.current !== 'future') return;
      setFutureIndex(i => {
        const next = (i + 1) % futureList.length;
        setSlideDir('left');
        setFade(false);
        setTimeout(() => setFade(true), 280);
        return next;
      });
    }, 6000);
  }

  useEffect(() => {
    resetAuto();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [futureList.length]);

  useEffect(() => {
    if (activeList.length === 0) return;
    const ev = activeList[activeIndex];
    if (!ev?.date) return;
    const tick = () => setTime(getTimeParts(new Date(ev.date!), mode));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [mode, activeIndex, activeList.length]);

  function handleAction(direction: 'left' | 'right') {
    buzz(6);
    if (direction === 'left') {
      if (mode === 'future') {
        if (pastList.length === 0) return;
        transitionTo('past', 0, 'left');
      } else {
        if (pastList.length <= 1) return;
        const next = (pastIndex + 1) % pastList.length;
        transitionTo('past', next, 'left');
      }
    } else {
      if (mode === 'future') {
        if (futureList.length <= 1) return;
        const next = Math.min(futureIndex + 1, futureList.length - 1);
        transitionTo('future', next, 'right');
      } else {
        transitionTo('future', 0, 'right');
      }
    }
    resetAuto();
  }

  function onPointerDown(e: React.PointerEvent) {
    setDragStart(e.clientX);
    setDragDelta(0);
    setPressing(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (dragStart === null) return;
    setDragDelta(e.clientX - dragStart);
  }

  function onPointerUp(e: React.PointerEvent) {
    setPressing(false);
    if (dragStart === null) return;
    const delta = e.clientX - dragStart;
    const target = e.target as HTMLElement;
    const hitButton = target.closest('button') !== null;
    setDragStart(null);
    setDragDelta(0);
    if (hitButton) return;

    if (Math.abs(delta) > 40) {
      handleAction(delta < 0 ? 'left' : 'right');
      return;
    }
    const ev = activeList[activeIndex];
    if (ev?.slug) {
      router.push(`/questions/${ev.slug}`);
    }
  }

  if (activeList.length === 0) return null;

  const ev = activeList[activeIndex];
  const glow = ev.color ?? '125, 118, 255';
  const isPast = mode === 'past';
  const isClickable = !!ev.slug;

  const canGoLeft = isPast ? pastList.length > 1 : pastList.length > 0;
  const canGoRight = isPast ? true : futureList.length > 1;

  const hint = isPast
    ? 'Past event · swipe right for future'
    : pastList.length > 0
      ? 'Swipe left for past · right for more'
      : 'Swipe right for more upcoming';

  const dragOffset = dragStart !== null ? dragDelta * 0.06 : 0;
  const settleOffset = !fade && slideDir ? (slideDir === 'left' ? 18 : -18) : 0;
  const cardScale = pressing ? 0.985 : (!fade ? 0.97 : 1);

  const chevronBtnClass = "active:scale-90 transition-transform duration-150";

  return (
    <div className="my-8 mx-auto w-full" style={{ maxWidth: 680 }}>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="ios-card relative overflow-hidden select-none"
        role={isClickable ? 'link' : undefined}
        aria-label={isClickable ? `View details for ${ev.event}` : undefined}
        style={{
          border: `1px solid rgba(${glow}, 0.35)`,
          boxShadow: `0 0 48px rgba(${glow}, 0.14), 0 0 0 1px rgba(${glow}, 0.1)`,
          opacity: fade ? 1 : 0,
          filter: isPast ? 'saturate(0.55) brightness(0.92)' : 'none',
          transform: `translateX(${dragOffset || settleOffset}px) scale(${cardScale})`,
          transition: dragStart !== null ? 'transform 0.05s' : 'opacity 0.28s ease, transform 0.4s var(--spring), border-color 0.4s, box-shadow 0.4s, filter 0.4s',
          cursor: dragStart !== null ? 'grabbing' : (isClickable ? 'pointer' : 'grab'),
          padding: '20px 24px 18px',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, rgb(${glow}), transparent)`, transition: 'background 0.4s' }} />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 22 }}>{ev.emoji ?? '📅'}</span>
            <span className="text-callout font-bold" style={{ color: 'var(--text-primary)' }}>{ev.event}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isPast ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke={`rgb(${glow})`} strokeWidth="2" />
                <path d="M12 7v5l3.5 2" stroke={`rgb(${glow})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <div className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: `rgb(${glow})`, '--glow': glow } as React.CSSProperties} />
            )}
            <span className="text-caption font-bold" style={{ color: `rgb(${glow})` }}>{isPast ? 'PAST' : 'LIVE'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <button
            aria-label="Show past events"
            onClick={(e) => { e.stopPropagation(); handleAction('left'); }}
            disabled={!canGoLeft}
            className={chevronBtnClass}
            style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: canGoLeft ? 1 : 0.25,
              cursor: canGoLeft ? 'pointer' : 'default',
              background: `rgba(${glow}, 0.08)`,
              border: `1px solid rgba(${glow}, 0.2)`,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke={`rgb(${glow})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="grid grid-cols-4 gap-3 flex-1">
            {[
              { val: time.d, label: 'DAYS' },
              { val: time.h, label: 'HRS' },
              { val: time.m, label: 'MIN' },
              { val: time.s, label: 'SEC' },
            ].map(({ val, label }, i) => (
              <div key={label} className="rounded-2xl py-4 text-center"
                style={{
                  background: `rgba(${glow}, ${i === 0 ? 0.12 : 0.05})`,
                  border: `1px solid rgba(${glow}, ${i === 0 ? 0.3 : 0.1})`,
                }}>
                <div className="tabular font-black" style={{
                  fontSize: i === 0 ? 48 : 38,
                  lineHeight: 1,
                  color: i === 0 ? `rgb(${glow})` : 'var(--text-primary)',
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: i === 0 ? `0 0 24px rgba(${glow}, 0.5)` : 'none',
                  transition: 'color 0.3s',
                }}>
                  {i === 0 ? val : pad(val)}
                </div>
                <div className="text-caption mt-1.5" style={{ color: `rgba(${glow}, ${i === 0 ? 0.9 : 0.75})`, letterSpacing: '0.08em' }}>{label}</div>
              </div>
            ))}
          </div>

          <button
            aria-label="Show future events"
            onClick={(e) => { e.stopPropagation(); handleAction('right'); }}
            disabled={!canGoRight}
            className={chevronBtnClass}
            style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: canGoRight ? 1 : 0.25,
              cursor: canGoRight ? 'pointer' : 'default',
              background: `rgba(${glow}, 0.08)`,
              border: `1px solid rgba(${glow}, 0.2)`,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke={`rgb(${glow})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="progress-track mb-4" style={{ height: 5 }}>
          <div style={{
            width: `${(time.s / 60) * 100}%`,
            background: `linear-gradient(90deg, rgba(${glow},0.5), rgb(${glow}))`,
            transition: 'width 1s linear',
            height: '100%', borderRadius: 999,
          }} />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{hint}</p>
          {activeList.length > 1 && (
            <div className="flex gap-1.5">
              {activeList.map((_, i) => (
                <button key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    transitionTo(mode, i, i > activeIndex ? 'left' : 'right');
                    resetAuto();
                  }}
                  className="active:scale-75 transition-transform duration-150"
                  style={{
                    width: i === activeIndex ? 20 : 6, height: 6,
                    borderRadius: 999,
                    background: i === activeIndex ? `rgb(${glow})` : `rgba(${glow}, 0.25)`,
                    transition: 'all 0.3s var(--spring)',
                    border: 'none', cursor: 'pointer', padding: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
