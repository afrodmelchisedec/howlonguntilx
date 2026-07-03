'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

export interface FaqItem {
  id: string;
  question: string;
  slug: string;
  targetDate: string;
}

const PAGE_SIZE = 10;
const MAX_PAGES = 5;
const AUTO_ADVANCE_MS = 6000;
const RESUME_AFTER_DRAG_MS = 2500;

// Cycles through your existing category glow colors for visual variety per row
const GLOW_CLASSES = ['gc-holidays', 'gc-sports', 'gc-tech', 'gc-finance', 'gc-personal', 'gc-travel', 'gc-nature', 'gc-space'];

function daysLeft(targetDate: string): number {
  const diff = new Date(targetDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function FaqRow({ item, index }: { item: FaqItem; index: number }) {
  const [days, setDays] = useState(() => daysLeft(item.targetDate));

  useEffect(() => {
    const id = setInterval(() => setDays(daysLeft(item.targetDate)), 60_000);
    return () => clearInterval(id);
  }, [item.targetDate]);

  const glowClass = GLOW_CLASSES[index % GLOW_CLASSES.length];

  return (
    <Link
      href={`/how-long-until-${item.slug}`}
      className={`faq-row ios-card glow interactive press anim-fade-up ${glowClass}`}
      style={{ animationDelay: `${(index % PAGE_SIZE) * 50}ms` }}
    >
      <span className="faq-row-dot" style={{ background: `rgb(var(--glow))` }} />
      <span className="faq-row-question">{item.question}</span>
      <span className="faq-row-days" style={{ color: 'rgb(var(--glow))', background: 'rgba(var(--glow), 0.12)' }}>
        {days}d
      </span>
      <span className="faq-row-arrow">→</span>
    </Link>
  );
}

export function FaqSection({ initialFaqs }: { initialFaqs: FaqItem[] }) {
  const [tab, setTab] = useState<'live' | 'archive'>('live');

  // ── LIVE SLIDER ─────────────────────────────────────────
  const pages = chunk(initialFaqs, PAGE_SIZE).slice(0, MAX_PAGES);
  const [pageIndex, setPageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((i: number) => {
    if (pages.length === 0) return;
    setPageIndex(((i % pages.length) + pages.length) % pages.length);
  }, [pages.length]);

  useEffect(() => {
    if (isPaused || pages.length <= 1) return;
    const id = setInterval(() => setPageIndex(p => (p + 1) % pages.length), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [isPaused, pages.length]);

  function pauseThenResume() {
    setIsPaused(true);
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(() => setIsPaused(false), RESUME_AFTER_DRAG_MS);
  }

  function onPointerDown(e: React.PointerEvent) {
    dragStartX.current = e.clientX;
  }
  function onPointerUp(e: React.PointerEvent) {
    if (dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (dx > 50) { goTo(pageIndex - 1); pauseThenResume(); }
    else if (dx < -50) { goTo(pageIndex + 1); pauseThenResume(); }
  }

  // ── ARCHIVE TAB ──────────────────────────────────────────
  const [archiveItems, setArchiveItems] = useState<FaqItem[]>([]);
  const [archivePage, setArchivePage] = useState(0);
  const [archiveHasMore, setArchiveHasMore] = useState(true);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveLoaded, setArchiveLoaded] = useState(false);

  const loadArchive = useCallback(async () => {
    setArchiveLoading(true);
    const nextPage = archivePage + 1;
    try {
      const res = await fetch(`/api/faqs/archive?page=${nextPage}&limit=${PAGE_SIZE}`);
      const data = await res.json();
      setArchiveItems(prev => [...prev, ...(data.faqs ?? [])]);
      setArchivePage(nextPage);
      setArchiveHasMore(Boolean(data.hasMore));
    } catch {
      setArchiveHasMore(false);
    } finally {
      setArchiveLoading(false);
      setArchiveLoaded(true);
    }
  }, [archivePage]);

  useEffect(() => {
    if (tab === 'archive' && !archiveLoaded) loadArchive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  if (pages.length === 0 && tab === 'live') return null;

  return (
    <div className="py-16">
      <div className="max-w-3xl mx-auto px-4">

        {/* Header + tabs */}
        <div className="flex items-end justify-between flex-wrap gap-5 mb-8 anim-fade-up">
          <div>
            <p className="text-caption mb-2" style={{ color: 'rgb(var(--accent-brand))' }}>PEOPLE ARE ASKING</p>
            <h2 className="text-title1">Frequently counted questions</h2>
          </div>

          <div className="segmented">
            <button className={`segmented-item ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')}>
              Live
            </button>
            <button className={`segmented-item ${tab === 'archive' ? 'active' : ''}`} onClick={() => setTab('archive')}>
              Archives
            </button>
          </div>
        </div>

        {/* LIVE SLIDER */}
        {tab === 'live' && (
          <div
            className="faq-slider"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => { if (dragStartX.current === null) setIsPaused(false); }}
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
                <button className="faq-arrow-btn press" onClick={() => { goTo(pageIndex - 1); pauseThenResume(); }} aria-label="Previous page">‹</button>
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
                <button className="faq-arrow-btn press" onClick={() => { goTo(pageIndex + 1); pauseThenResume(); }} aria-label="Next page">›</button>
              </div>
            )}
          </div>
        )}

        {/* ARCHIVE LIST */}
        {tab === 'archive' && (
          <div className="anim-fade-up">
            {archiveItems.length === 0 && !archiveLoading && (
              <p className="text-footnote text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                No archived questions yet.
              </p>
            )}

            <div className="flex flex-col gap-2.5">
              {archiveItems.map((item, i) => (
                <FaqRow key={item.id} item={item} index={i} />
              ))}
            </div>

            {archiveHasMore && (
              <button className="faq-load-more press" onClick={loadArchive} disabled={archiveLoading}>
                {archiveLoading ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
