// FILE: src/components/articles/EmbedDurationButton.tsx
'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';

export function EmbedDurationButton({ toolSlug, articleSlug, title, id }: { toolSlug: string; articleSlug: string; title: string; id: string }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [copied, setCopied] = useState(false);
  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';
  const embedUrl = `${BASE}/embed/duration?tool=${toolSlug}&article=${articleSlug}&theme=${theme}`;

  const htmlSnippet = `<iframe src="${embedUrl}" width="300" height="260" frameborder="0" loading="lazy" style="border:none;border-radius:8px;"></iframe>`;

  function copy() {
    navigator.clipboard.writeText(htmlSnippet);
    setCopied(true);
    fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type: 'article', platform: 'embed' }),
    }).catch(() => {});
    setTimeout(() => setCopied(false), 1500);
  }

  const pillCls = "press px-3 py-1.5 text-sm rounded-full transition-colors";
  const pillStyle = { border: '1px solid var(--border-hairline)', color: 'var(--text-secondary)' };

  return (
    <>
      <button onClick={() => setOpen(true)} className={pillCls} style={pillStyle}>
        Embed this estimate
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setOpen(false)}>
          <div className="ios-card p-6" style={{ maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <p className="text-headline mb-1">Embed this estimate</p>
            <p className="text-footnote mb-4" style={{ color: 'var(--text-secondary)' }}>
              Just the min/max/typical numbers for "{title}" — no article, minimal branding.
            </p>

            <div className="segmented w-fit mb-4">
              {(['light', 'dark'] as const).map(opt => (
                <button key={opt} onClick={() => setTheme(opt)}
                  className={`segmented-item ${theme === opt ? 'active' : ''}`}>
                  {opt === 'light' ? '☀️ Light' : '🌙 Dark'}
                </button>
              ))}
            </div>

            <div className="ios-card-nested p-4 mb-4 flex justify-center">
              <iframe key={theme} src={`/embed/duration?tool=${toolSlug}&article=${articleSlug}&theme=${theme}`} width={300} height={260}
                style={{ border: '1px solid var(--border-hairline)', borderRadius: 8 }} title="Estimate preview" />
            </div>

            <p className="text-caption font-semibold mb-1" style={{ color: 'rgb(var(--accent-brand))' }}>HTML / any website</p>
            <textarea readOnly value={htmlSnippet} rows={3} className="w-full text-caption p-2 mb-2" style={{ background: 'var(--fill-secondary)', color: 'var(--text-primary)', borderRadius: 8, fontFamily: 'monospace' }} />
            <button onClick={copy} className="btn-filled press text-xs px-4 py-2 mb-4">{copied ? 'Copied!' : 'Copy HTML'}</button>

            <button onClick={() => setOpen(false)} className="ios-card-nested press w-full py-2.5 mt-4 text-footnote font-semibold">Close</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
