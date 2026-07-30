// FILE: src/components/LeadMagnetBanner.tsx
'use client';

import { useEffect, useState } from 'react';

const REGIONS = [
  { value: 'AMERICAS', label: '🌎 Americas' },
  { value: 'EUROPE', label: '🌍 Europe' },
  { value: 'ASIA', label: '🌏 Asia' },
  { value: 'AFRICA', label: '🌍 Africa' },
  { value: 'MIDDLE_EAST', label: '🕌 Middle East' },
  { value: 'AUSTRALIA', label: '🦘 Australia' },
];

const DISMISS_KEY = 'hlux_lead_magnet_dismissed_v1';

type Config = {
  headline: string;
  description: string;
  ctaLabel: string;
  active: boolean;
};

export default function LeadMagnetBanner() {
  const [config, setConfig] = useState<Config | null>(null);
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', region: '' });

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    fetch('/api/lead-magnet/public-config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.config?.active) return;
        setConfig(data.config);
        setVisible(true);
      })
      .catch(() => {});
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/lead-magnet/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong.');
        return;
      }
      setStatus('success');
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      setStatus('error');
      setErrorMsg('Network error — please try again.');
    }
  }

  if (!visible || !config) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        display: 'flex',
        justifyContent: 'center',
        padding: 12,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          width: '100%',
          maxWidth: open ? 460 : 720,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(20,20,28,0.72)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          color: '#fff',
          padding: 18,
        }}
      >
        {status === 'success' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: '#a78bfa', margin: 0 }}>
                CHECK YOUR INBOX
              </p>
              <p style={{ fontSize: 14, margin: '4px 0 0', color: '#d5d5db' }}>
                We just emailed your download to {form.email}.
              </p>
            </div>
            <button onClick={dismiss} style={closeBtnStyle} aria-label="Close">✕</button>
          </div>
        ) : !open ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#a78bfa', margin: 0 }}>
                🎁 FREE DOWNLOAD
              </p>
              <p style={{ fontSize: 15, fontWeight: 600, margin: '4px 0 2px' }}>{config.headline}</p>
              <p style={{ fontSize: 13, color: '#a8a8b3', margin: 0, maxWidth: 480 }}>{config.description}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setOpen(true)} style={ctaBtnStyle}>{config.ctaLabel}</button>
              <button onClick={dismiss} style={closeBtnStyle} aria-label="Close">✕</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>{config.headline}</p>
              <button type="button" onClick={dismiss} style={closeBtnStyle} aria-label="Close">✕</button>
            </div>
            <input
              required
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
            />
            <input
              required
              type="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={{ ...inputStyle, marginTop: 8 }}
            />
            <select
              required
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              style={{ ...inputStyle, marginTop: 8 }}
            >
              <option value="" disabled>Select your region</option>
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {status === 'error' && (
              <p style={{ color: '#ff6b6b', fontSize: 12, marginTop: 8 }}>{errorMsg}</p>
            )}
            <button type="submit" disabled={status === 'loading'} style={{ ...ctaBtnStyle, width: '100%', marginTop: 12 }}>
              {status === 'loading' ? 'Sending…' : config.ctaLabel}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const ctaBtnStyle: React.CSSProperties = {
  background: '#7c5cff',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 16px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#8a8a95',
  fontSize: 14,
  cursor: 'pointer',
  padding: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#fff',
  fontSize: 14,
  outline: 'none',
};
