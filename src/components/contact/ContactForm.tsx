// FILE: src/components/contact/ContactForm.tsx
'use client';

import { useState, useRef } from 'react';

const GLOW = '255, 159, 10';

const CATEGORY_OPTIONS = [
  { value: 'suggest_tool', label: '💡 Suggest a tool' },
  { value: 'report_bug', label: '🐛 Report a bug' },
  { value: 'partnership', label: '🤝 Partnerships' },
  { value: 'other', label: '❓ Something else' },
];

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function ContactForm({ initialCategory }: { initialCategory?: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState(initialCategory || 'other');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const renderedAt = useRef(Date.now());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          category,
          message,
          company,
          formRenderedAt: renderedAt.current,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
      setCategory('other');
    } catch (err) {
      setStatus('error');
      setError('Network error — please check your connection and try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="ios-card p-6 sm:p-8 text-center anim-fade-up">
        <div className="text-3xl mb-3">✅</div>
        <p className="text-headline mb-2">Message sent</p>
        <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
          Thanks for reaching out — we read every message ourselves and typically reply within a couple of business days.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="text-footnote font-semibold mt-4 underline"
          style={{ color: `rgb(${GLOW})` }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="ios-card p-6 sm:p-8 anim-fade-up">
      <div style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }} aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={e => setCompany(e.target.value)}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="name" className="text-footnote font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-callout"
            style={{ background: 'var(--bg-secondary, #1c1c1e)', border: '1px solid var(--border, #333)' }}
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="text-footnote font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-callout"
            style={{ background: 'var(--bg-secondary, #1c1c1e)', border: '1px solid var(--border, #333)' }}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="category" className="text-footnote font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Topic
        </label>
        <select
          id="category"
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-callout"
          style={{ background: 'var(--bg-secondary, #1c1c1e)', border: '1px solid var(--border, #333)' }}
        >
          {CATEGORY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="mb-5">
        <label htmlFor="message" className="text-footnote font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Message
        </label>
        <textarea
          id="message"
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-callout resize-none"
          style={{ background: 'var(--bg-secondary, #1c1c1e)', border: '1px solid var(--border, #333)' }}
          placeholder="Tell us what's on your mind..."
        />
      </div>

      {status === 'error' && (
        <p className="text-footnote mb-4" style={{ color: '#ff453a' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full py-3 rounded-lg text-callout font-bold transition-opacity"
        style={{ background: `rgb(${GLOW})`, color: '#1a1a1a', opacity: status === 'submitting' ? 0.6 : 1 }}
      >
        {status === 'submitting' ? 'Sending...' : 'Send message'}
      </button>
    </form>
  );
}
