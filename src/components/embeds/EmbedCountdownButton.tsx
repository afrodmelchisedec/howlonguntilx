// FILE: src/components/embeds/EmbedCountdownButton.tsx
'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';

export function EmbedCountdownButton({ slug, name, id, type, onEmbedCopy }: { slug: string; name: string; id?: string; type?: 'event' | 'userEvent'; onEmbedCopy?: () => void }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [copied, setCopied] = useState<'html' | 'wp' | null>(null);
  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';
  const embedUrl = `${BASE}/embed/widget?event=${slug}&theme=${theme}`;

  const htmlSnippet = `<iframe src="${embedUrl}" width="300" height="230" frameborder="0" loading="lazy" style="border:none;border-radius:8px;"></iframe>`;
  const wpSnippet = `[howlonguntilx event="${slug}" theme="${theme}"]`;

  function copy(text: string, which: 'html' | 'wp') {
    navigator.clipboard.writeText(text);
    setCopied(which);
    if (id && type) {
      fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, platform: 'embed' }),
      }).catch(() => {});
      onEmbedCopy?.();
    }
    setTimeout(() => setCopied(null), 1500);
  }

  const pillCls = "press px-3 py-1.5 text-sm rounded-full transition-colors";
  const pillStyle = { border: '1px solid var(--border-hairline)', color: 'var(--text-secondary)' };

  return (
    <>
      <button onClick={() => setOpen(true)} className={pillCls} style={pillStyle}>
        Embed only this countdown
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setOpen(false)}>
          <div className="ios-card p-6" style={{ maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <p className="text-headline mb-1">Embed this countdown</p>
            <p className="text-footnote mb-4" style={{ color: 'var(--text-secondary)' }}>
              Just the live timer for "{name}" — no article, minimal branding. Auto-updates, no JS needed on your end.
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
              <iframe key={theme} src={`/embed/widget?event=${slug}&theme=${theme}`} width={300} height={230}
                style={{ border: '1px solid var(--border-hairline)', borderRadius: 8 }} title="Countdown preview" />
            </div>

            <p className="text-caption font-semibold mb-1" style={{ color: 'rgb(var(--accent-brand))' }}>HTML / any website</p>
            <textarea readOnly value={htmlSnippet} rows={3} className="w-full text-caption p-2 mb-2" style={{ background: 'var(--fill-secondary)', color: 'var(--text-primary)', borderRadius: 8, fontFamily: 'monospace' }} />
            <button onClick={() => copy(htmlSnippet, 'html')} className="btn-filled press text-xs px-4 py-2 mb-4">{copied === 'html' ? 'Copied!' : 'Copy HTML'}</button>

            <p className="text-caption font-semibold mb-1" style={{ color: 'rgb(var(--accent-brand))' }}>WordPress shortcode</p>
            <div className="flex gap-2 mb-2">
              <code className="flex-1 text-caption p-2" style={{ background: 'var(--fill-secondary)', borderRadius: 8 }}>{wpSnippet}</code>
              <button onClick={() => copy(wpSnippet, 'wp')} className="btn-filled press text-xs px-4">{copied === 'wp' ? 'Copied!' : 'Copy'}</button>
            </div>
            <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>Requires the HowLongUntil Countdown plugin.</p>

            <button onClick={() => setOpen(false)} className="ios-card-nested press w-full py-2.5 mt-4 text-footnote font-semibold">Close</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
