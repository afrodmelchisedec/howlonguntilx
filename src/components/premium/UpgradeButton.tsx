'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  async function handleClick() {
    if (!session) { router.push('/auth/signin'); return; }
    setLoading(true);
    const res  = await fetch('/api/stripe/checkout', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { setLoading(false); router.push('/upgrade'); }
  }

  return (
    <button onClick={handleClick} disabled={loading}
      className="w-full text-xs font-bold py-1.5 rounded-xl transition-colors text-white disabled:opacity-60"
      style={{ background: 'rgba(255,255,255,0.2)' }}
      onMouseEnter={e => !loading && (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}>
      {loading ? 'Loading…' : 'Upgrade — $4/mo →'}
    </button>
  );
}
