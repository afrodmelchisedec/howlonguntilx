// FILE: src/components/ui/FaqSection.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

export interface FaqItem {
  id: string;
  question: string;
  slug: string;
  targetDate: string;
  type: 'COUNTDOWN' | 'ELAPSED' | 'RELATIVE';
  archived: boolean;
}

const PAGE_SIZE = 10;
const MAX_PAGES = 5;
const AUTO_ADVANCE_MS = 6000;
const RESUME_AFTER_DRAG_MS = 2500;

const GLOW_CLASSES = [
  'gc-holidays', 'gc-sports', 'gc-tech', 'gc-finance',
  'gc-personal', 'gc-travel', 'gc-nature', 'gc-space',
];

type Tab = 'live-future' | 'archive-future' | 'live-past' | 'archive-past';

const TAB_CONFIG: { id: Tab; label: string; color: string }[] = [
  { id: 'live-future',    label: '🟢 Live',            color: '#22c55e' },
  { id: 'archive-future', label: '🟠 Archive',         color: '#f97316' },
  { id: 'live-past',      label: '🟣 Elapsed',         color: '#a78bfa' },
  { id: 'archive-past',   label: '⚫ History',         color: '#64748b' },
];

// ── Classify: archived flag is the source of truth for archive tabs ──
function classifyItem(item: FaqItem): Tab {
  const isFuture =
    item.type === 'COUNTDOWN' &&
    new Date(item.targetDate).getTime() > Date.now();

  if (item.archived) {
    return isFuture ? 'archive-future' : 'archive-past';
  }
  return isFuture ? 'live-future' : 'live-past';
}

// ── Label helpers ─────────────────────────────────────────────────────
function formatFutureLabel(ms: number): string {
  const days = Math.ceil(ms / 86_400_000);
  return `${days}d`;
}

function formatElapsedLabel(absMs: number): string {
  const totalSeconds = Math.floor(absMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  if (days > 365) return `${Math.floor(days / 365)}y`;
  if (days > 30)  return `${Math.floor(days / 30)}mo`;
  if (days > 0)   return `${days}d`;
  const hours = Math.floor(totalSeconds / 3600);
  if (hours > 0)  return `${hours}h`;
  return `${Math.floor(totalSeconds / 60)}m`;
}

function getRelativeMs(relativeType: string): number {
  const now = new Date();
  if (relativeType === 'yesterday') {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    y.setHours(0, 0, 0, 0);
    return now.getTime() - y.getTime();
  }
  if (relativeType === 'noon') {
    const n = new Date(now);
    n.setHours(12, 0, 0, 0);
    if (n.getTime() > now.getTime()) n.setDate(n.getDate() - 1);
    return now.getTime() - n.getTime();
  }
  // today / midnight / default
  const t = new Date(now);
  t.setHours(0, 0, 0, 0);
  return now.getTime() - t.getTime();
}

// ── Single row ────────────────────────────────────────────────────────
function FaqRow({ item, index }: { item: FaqItem; index: number }) {
  const [label, setLabel] = useState('…');
  const glowClass = GLOW_CLASSES[index % GLOW_CLASSES.length];

  const isPast =
    item.type === 'ELAPSED' ||
    item.type === 'RELATIVE' ||
    new Date(item.targetDate).getTime() < Date.now();

  useEffect(() => {
    function update() {
      if (item.type === 'RELATIVE') {
        // Use relativeType from content if available; fall back to targetDate diff
        const absMs = getRelativeMs('today'); // default; detail page handles per-type
        setLabel(formatElapsedLabel(absMs));
        return;
      }
      const diff = new Date(item.targetDate).getTime() - Date.now();
      if (item.type === 'ELAPSED' || diff < 0) {
        setLabel(formatElapsedLabel(Math.abs(diff)));
      } else {
        setLabel(formatFutureLabel(diff));
      }
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [item]);

  return (
    <Link
      href={`/how-long-until-${item.slug}`}
      className={`faq-row ios-card glow interactive press anim-fade-up ${glowClass}`}
      style={{ animationDelay: `${(index % PAGE_SIZE) * 50}ms` }}
    >
      <span className="faq-row-dot" style={{ background: `rgb(var(--glow))` }} />
      <span className="faq-row-question">{item.question}</span>
      <span
        className="faq-row-days"
        style={{
          color: isPast ? 'rgb(var(--accent-brand))' : 'rgb(var(--glow))',
          background: isPast
            ? 'rgba(var(--accent-brand), 0.12)'
            : 'rgba(var(--glow), 0.12)',
        }}
      >
        {label}
      </span>
      <span className="faq-row-arrow">→</span>
    </Link>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── Main component ────────────────────────────────────────────────────
export function FaqSection({ initialFaqs }: { initialFaqs: FaqItem[] }) {
  const [tab, setTab] = useState<Tab>('live-future');

  // Classify all items — archived flag is the source of truth
  const classified = initialFaqs.reduce<Record<Tab, FaqItem[]>>(
    (acc, item) => {
      const bucket = classifyItem(item);
      acc[bucket].push(item);
      return acc;
    },
    { 'live-future': [], 'archive-future': [], 'live-past': [], 'archive-past': [] }
  );

  const currentItems = classified[tab];
  const pages = chunk(currentItems, PAGE_SIZE).slice(0, MAX_PAGES);

  const [pageIndex, setPageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset page on tab change
  useEffect(() => { setPageIndex(0); }, [tab]);

  const goTo = useCallback(
    (i: number) => {
      if (pages.length === 0) return;
      setPageIndex(((i % pages.length) + pages.length) % pages.length);
    },
    [pages.length]
  );

  useEffect(() => {
    if (isPaused || pages.length <= 1) return;
    const id = setInterval(
      () => setPageIndex(p => (p + 1) % pages.length),
      AUTO_ADVANCE_MS
    );
    return () => clearInterval(id);
  }, [isPaused, pages.length]);

  function pauseThenResume() {
    setIsPaused(true);
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(
      () => setIsPaused(false),
      RESUME_AFTER_DRAG_MS
    );
  }

  function onPointerDown(e: React.PointerEvent) {
    dragStartX.current = e.clientX;
  }
  function onPointerUp(e: React.PointerEvent) {
    if (dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (dx > 50)       { goTo(pageIndex - 1); pauseThenResume(); }
    else if (dx < -50) { goTo(pageIndex + 1); pauseThenResume(); }
  }

  return (
    <div className="py-16">
      <div className="max-w-3xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-5 mb-6 anim-fade-up">
          <div>
            <p className="text-caption mb-2" style={{ color: 'rgb(var(--accent-brand))' }}>
              PEOPLE ARE ASKING
            </p>
            <h2 className="text-title1">Frequently counted questions</h2>
          </div>
        </div>

        {/* 4-tab bar */}
        <div className="flex gap-2 flex-wrap mb-6">
          {TAB_CONFIG.map(t => {
            const count = classified[t.id].length;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="press flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: isActive ? t.color : 'var(--bg-elevated-2)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  border: `1.5px solid ${isActive ? t.color : 'transparent'}`,
                }}
              >
                {t.label}
                {count > 0 && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.2)' : `${t.color}22`,
                      color: isActive ? '#fff' : t.color,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Slider or empty state */}
        {pages.length === 0 ? (
          <p
            className="text-footnote text-center py-12"
            style={{ color: 'var(--text-tertiary)' }}
          >
            No questions in this tab yet.
          </p>
        ) : (
          <div
            className="faq-slider"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => {
              if (dragStartX.current === null) setIsPaused(false);
            }}
          >
            <div
              className="faq-track"
              style={{ transform: `translateX(-${pageIndex * 100}%)` }}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
            >
              {pages.map((pageItems, pIdx) => (
                <div className="faq-page" key={pIdx}>
                  {pageItems.map((item, i) => (
                    <FaqRow key={item.id} item={item} index={i} />
                  ))}
                </div>
              ))}
            </div>

            {pages.length > 1 && (
              <div className="faq-controls">
                <button
                  className="faq-arrow-btn press"
                  onClick={() => { goTo(pageIndex - 1); pauseThenResume(); }}
                  aria-label="Previous page"
                >
                  ‹
                </button>
                <div className="faq-dots">
                  {pages.map((_, i) => (
                    <button
                      key={i}
                      className={`faq-dot ${i === pageIndex ? 'faq-dot-active' : ''}`}
                      onClick={() => { goTo(i); pauseThenResume(); }}
                      aria-label={`Go to page ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  className="faq-arrow-btn press"
                  onClick={() => { goTo(pageIndex + 1); pauseThenResume(); }}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
