'use client';
import { useMemo, useState } from 'react';
import { ToolProGate } from './ToolProGate';

function estimateSeconds(pw: string): number {
  if (!pw) return 0;
  let charset = 0;
  if (/[a-z]/.test(pw)) charset += 26;
  if (/[A-Z]/.test(pw)) charset += 26;
  if (/[0-9]/.test(pw)) charset += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) charset += 32;
  charset = Math.max(charset, 10);
  const entropyBits = pw.length * Math.log2(charset);
  const guessesPerSecond = 1e10; // fast offline-attack estimate
  return Math.pow(2, entropyBits) / guessesPerSecond;
}

function formatSeconds(seconds: number): string {
  if (seconds < 1) return 'instantly';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000 * 100) return `${Math.round(seconds / 31536000)} years`;
  return `${(seconds / 31536000).toExponential(1)} years`;
}

function pctFromSeconds(seconds: number): number {
  if (seconds <= 0) return 0;
  const logSeconds = Math.log10(seconds + 1);
  return Math.min(100, Math.round((logSeconds / 15) * 100));
}

function PasswordRaceInner() {
  const [pw, setPw] = useState('');
  const [bestSeconds, setBestSeconds] = useState(0);

  const seconds = useMemo(() => estimateSeconds(pw), [pw]);
  const pct = pctFromSeconds(seconds);
  const color = pct < 30 ? 'rgb(var(--accent-red))' : pct < 70 ? 'rgb(var(--accent-orange))' : 'rgb(var(--accent-green))';

  function handleChange(v: string) {
    setPw(v);
    const s = estimateSeconds(v);
    if (s > bestSeconds) setBestSeconds(s);
  }

  const tips: string[] = [];
  if (pw.length > 0 && pw.length < 12) tips.push('Add more characters — length matters more than complexity.');
  if (pw.length > 0 && !/[0-9]/.test(pw)) tips.push('Try adding a number.');
  if (pw.length > 0 && !/[^a-zA-Z0-9]/.test(pw)) tips.push('Try adding a symbol like ! or #.');
  if (pw.length > 0 && !/[A-Z]/.test(pw)) tips.push('Try mixing in a capital letter.');

  return (
    <div className="ios-card p-6 gc-work glow">
      <h3 className="text-headline mb-1">🔐 Password Strength Race</h3>
      <p className="text-footnote mb-4">
        Watch the crack-time meter move as you type. <strong>Never enter a real password</strong> — this is processed locally in your browser and never sent or stored anywhere.
      </p>

      <input
        type="text"
        value={pw}
        onChange={e => handleChange(e.target.value)}
        placeholder="Try a fake password…"
        className="ios-card-nested w-full px-3 py-2 mb-4 text-callout"
        style={{ color: 'var(--text-primary)' }}
      />

      <div className="progress-track mb-2" style={{ height: 10 }}>
        <div className="progress-fill transition-all duration-300" style={{ width: pct + '%', background: color }} />
      </div>
      <p className="text-footnote mb-4">
        Estimated time to crack: <strong style={{ color }}>{formatSeconds(seconds)}</strong>
      </p>

      {tips.length > 0 && (
        <div className="space-y-1 mb-3">
          {tips.map(t => <p key={t} className="text-footnote">💡 {t}</p>)}
        </div>
      )}

      {bestSeconds > 0 && (
        <p className="text-footnote" style={{ color: 'rgb(var(--accent-brand))' }}>
          Best this session: {formatSeconds(bestSeconds)}
        </p>
      )}
    </div>
  );
}

export function PasswordStrengthRace({ isPro = false }: { isPro?: boolean }) {
  return (
    <ToolProGate isPro={isPro} title="Track your strongest passwords with Premium" desc="Unlock saved history of your strength scores and weekly security tips.">
      <PasswordRaceInner />
    </ToolProGate>
  );
}
