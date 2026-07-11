// FILE: src/components/articles/AdSlot.tsx
'use client';
import { useEffect, useRef } from 'react';

// Set these two once you have an approved AdSense account:
//   NEXT_PUBLIC_ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX"
// Also load the loader script ONCE, globally, in your root layout <head>:
//   <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`} crossOrigin="anonymous" />
// Do not add it per-slot — that fires it once per ad and AdSense will flag it.
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';

export function AdSlot({ slotId, minHeight = 280 }: { slotId: string; minHeight?: number }) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT || pushed.current) return;
    try {
      // @ts-ignore — provided by the adsbygoogle loader script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Loader not present yet (e.g. local dev without the script tag) — silently skip.
    }
  }, []);

  // Reserve real space up front so the ad never causes layout shift once it loads —
  // CLS is both a Core Web Vitals ranking factor and something AdSense reviewers check.
  return (
    <div className="my-8 anim-fade-up" style={{ minHeight }}>
      <p className="text-caption text-center mb-1.5" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
        ADVERTISEMENT
      </p>
      {ADSENSE_CLIENT ? (
        <ins
          ref={ref as any}
          className="adsbygoogle"
          style={{ display: 'block', minHeight }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        // Dev/pre-approval placeholder so layout and spacing can be reviewed before the account is live.
        <div
          className="rounded-2xl flex items-center justify-center text-caption"
          style={{ minHeight, background: 'var(--surface-secondary, rgba(255,255,255,0.03))', color: 'var(--text-secondary)', border: '1px dashed rgba(255,255,255,0.12)' }}
        >
          Ad slot ({slotId})
        </div>
      )}
    </div>
  );
}
