'use client';
import { useRouter } from 'next/navigation';

export function UpgradeButton() {
  const router = useRouter();

  return (
    <button onClick={() => router.push('/upgrade')}
      className="w-full text-xs font-bold py-1.5 rounded-xl transition-colors text-white"
      style={{ background: 'rgba(255,255,255,0.2)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}>
      Start free trial →
    </button>
  );
}
