// FILE: src/components/embeds/EmbedCodeButton.tsx
'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';

export function EmbedCodeButton({ slug, title, glow }: { slug: string; title: string; glow: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<'html' | 'wp' | null>(null);
  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';
  const embedUrl = `${BASE}/embed/${slug}`;
  const toolUrl = `${BASE}/tools/${slug}`;

  const htmlSnippet = `<iframe id="hlux-${slug}" src="${embedUrl}" style="width:100%;max-width:460px;border:0;" scrolling="no"></iframe>
<script>
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'hlux-embed-resize') {
    var f = document.getElementById('hlux-${slug}');
    if (f) f.style.height = e.data.height + 'px';
  }
});
</script>
<p style="font-size:11px;text-align:center;margin-top:6px;">
  ${title} — powered by
  <a href="${BASE}" target="_blank" rel="noopener">Until X</a>
</p>`;

  const wpSnippet = `[hlux_tool slug="${slug}"]`;

  function copy(text: string, which: 'html' | 'wp') {
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="ios-card-nested press flex items-center gap-2.5 p-3 text-left w-full sm:w-auto mt-4">
        <span className="text-lg">🧩</span>
        <span className="text-footnote font-semibold">Embed this tool</span>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setOpen(false)}>
          <div className="ios-card p-6" style={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: `0 0 0 1.5px rgba(${glow}, 0.3)` }} onClick={e => e.stopPropagation()}>
            <p className="text-headline mb-1">Embed {title}</p>
            <p className="text-footnote mb-4" style={{ color: 'var(--text-secondary)' }}>Paste this on your site — auto-resizes and links back to us.</p>

            <p className="text-caption font-semibold mb-1" style={{ color: `rgb(${glow})` }}>HTML / any website</p>
            <textarea readOnly value={htmlSnippet} rows={6} className="w-full text-caption p-2 mb-2" style={{ background: 'var(--fill-secondary)', color: 'var(--text-primary)', borderRadius: 8, fontFamily: 'monospace' }} />
            <button onClick={() => copy(htmlSnippet, 'html')} className="btn-filled press text-xs px-4 py-2 mb-4">{copied === 'html' ? 'Copied!' : 'Copy HTML'}</button>

            <p className="text-caption font-semibold mb-1" style={{ color: `rgb(${glow})` }}>WordPress shortcode</p>
            <div className="flex gap-2 mb-2">
              <code className="flex-1 text-caption p-2" style={{ background: 'var(--fill-secondary)', borderRadius: 8 }}>{wpSnippet}</code>
              <button onClick={() => copy(wpSnippet, 'wp')} className="btn-filled press text-xs px-4">{copied === 'wp' ? 'Copied!' : 'Copy'}</button>
            </div>
            <p className="text-caption" style={{ color: "var(--text-tertiary)" }}>Requires the Until X Tools plugin — <a href="/plugins" className="underline font-semibold" style={{ color: `rgb(${glow})` }}>see the plugin page</a>.</p>

            <button onClick={() => setOpen(false)} className="ios-card-nested press w-full py-2.5 mt-4 text-footnote font-semibold">Close</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
