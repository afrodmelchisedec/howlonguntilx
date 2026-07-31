// FILE: src/components/docs/CodeBlock.tsx
'use client';

import { useState } from 'react';

export function CodeBlock({ code, language = 'bash', label }: { code: string; language?: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard API unavailable — fail silently, button just won't confirm
    }
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--code-bg, #0d0d10)', border: '1px solid var(--border-hairline)' }}
    >
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: '1px solid var(--border-hairline)' }}
      >
        <span
          className="text-caption font-semibold tracking-wide"
          style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', fontSize: 11 }}
        >
          {label || language}
        </span>
        <button
          onClick={handleCopy}
          className="text-caption font-semibold px-2 py-1 rounded-md transition-colors"
          style={{ color: copied ? '#30d158' : 'var(--text-tertiary)' }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre
        className="px-4 py-3.5 overflow-x-auto text-sm leading-relaxed"
        style={{ color: '#e4e4e7', margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
