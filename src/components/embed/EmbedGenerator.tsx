'use client';
import { useState } from 'react';

export function EmbedGenerator() {
  const [event, setEvent] = useState('christmas');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const base = process.env.NEXT_PUBLIC_URL ?? 'https://howlonguntilx.com';
  const code = `<iframe src="${base}/embed/widget?event=${event}&theme=${theme}" width="300" height="160" frameborder="0" loading="lazy"></iframe>`;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-footnote block mb-1.5">Event</label>
        <input className="input-glow w-full px-3 py-2" value={event} onChange={e => setEvent(e.target.value)} />
      </div>
      <div>
        <label className="text-footnote block mb-1.5">Theme</label>
        <div className="segmented w-fit">
          {(['light', 'dark'] as const).map(opt => (
            <button key={opt} onClick={() => setTheme(opt)}
              className={`segmented-item ${theme === opt ? 'active' : ''}`}>
              {opt === 'light' ? '☀️ Light' : '🌙 Dark'}
            </button>
          ))}
        </div>
      </div>
      <div className="ios-card p-4">
        <p className="text-caption mb-3">Preview</p>
        <iframe src={`/embed/widget?event=${event}&theme=${theme}`} width={300} height={160}
          style={{ border: '1px solid var(--border-hairline)', borderRadius: 14 }} />
      </div>
      <div>
        <p className="text-caption mb-2">Embed code</p>
        <pre className="ios-card-nested text-xs p-3 overflow-x-auto whitespace-pre-wrap break-all" style={{ color: 'var(--text-secondary)' }}>{code}</pre>
        <button onClick={() => navigator.clipboard.writeText(code)} className="btn-tinted mt-2 text-sm">
          Copy code
        </button>
      </div>
    </div>
  );
}
