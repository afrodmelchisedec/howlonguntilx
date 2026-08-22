// FILE: src/components/ui/ConsentBanner.tsx
'use client';
import { useEffect, useState } from 'react';

type ConsentState = { analytics: boolean; ads: boolean };
const STORAGE_KEY = 'hlx-consent-v1';

function applyConsent(state: ConsentState) {
  if (typeof window === 'undefined') return;
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  function gtag(...args: any[]) { w.dataLayer.push(args); }
  gtag('consent', 'update', {
    analytics_storage: state.analytics ? 'granted' : 'denied',
    ad_storage: state.ads ? 'granted' : 'denied',
    ad_user_data: state.ads ? 'granted' : 'denied',
    ad_personalization: state.ads ? 'granted' : 'denied',
  });
  // The gtag('config', ...) call in layout.tsx fires immediately on page
  // load and tries to auto-send an initial pageview - but at that point
  // analytics_storage is still 'denied' by default, so that hit gets
  // silently suppressed. Consent Mode does NOT retroactively resend a
  // suppressed hit once consent changes, so without this, anyone who
  // accepts (or who returns with a previously-saved "accepted" choice)
  // would generate zero data for their pageview. Firing it explicitly
  // here, only when analytics is actually granted, closes that gap.
  if (state.analytics) {
    gtag('event', 'page_view');
  }
}

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [draft, setDraft] = useState<ConsentState>({ analytics: false, ads: false });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setVisible(true);
      } else {
        applyConsent(JSON.parse(stored).state);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function saveConsent(state: ConsentState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, ts: Date.now() }));
    } catch {}
    applyConsent(state);
    setVisible(false);
    setManageOpen(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1000,
        background: 'var(--bg-elevated-2, #16161c)',
        borderTop: '1px solid var(--border-hairline, rgba(255,255,255,0.1))',
        padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: '8px',
        alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', maxWidth: 560 }}>
        We use cookies for analytics and, where available, ads. Choose what you're comfortable with — you can change this anytime.
      </p>

      {manageOpen ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={draft.analytics} onChange={(e) => setDraft((d) => ({ ...d, analytics: e.target.checked }))} />
            Analytics
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={draft.ads} onChange={(e) => setDraft((d) => ({ ...d, ads: e.target.checked }))} />
            Advertising
          </label>
          <button onClick={() => saveConsent(draft)} className="btn-filled press text-xs px-4 py-2">
            Save preferences
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => saveConsent({ analytics: false, ads: false })}
            className="press text-xs px-4 py-2 rounded-full"
            style={{ border: '1px solid var(--border-hairline, rgba(255,255,255,0.15))', background: 'transparent', color: 'var(--text-primary)' }}
          >
            Reject non-essential
          </button>
          <button
            onClick={() => setManageOpen(true)}
            className="press text-xs px-4 py-2 rounded-full"
            style={{ border: '1px solid var(--border-hairline, rgba(255,255,255,0.15))', background: 'transparent', color: 'var(--text-primary)' }}
          >
            Manage
          </button>
          <button onClick={() => saveConsent({ analytics: true, ads: true })} className="btn-filled press text-xs px-4 py-2">
            Accept all
          </button>
        </div>
      )}
    </div>
  );
}

export function reopenConsentBanner() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  window.location.reload();
}