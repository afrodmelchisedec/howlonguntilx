'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Props { eventName: string }

export function SignupTeaser({ eventName }: Props) {
  const { data: session } = useSession();
  if (session) return null;
  return (
    <div className="max-w-2xl mx-auto px-4 pb-8">
      <div className="relative overflow-hidden rounded-[24px] p-6 text-white text-center"
        style={{ background: 'linear-gradient(135deg, rgb(var(--accent-brand)), rgb(var(--accent-purple)))' }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />
        <div className="relative z-10">
          <p className="text-xs font-medium uppercase tracking-widest opacity-80 mb-2">Free account</p>
          <h3 className="text-title3 mb-2 text-white">Save this countdown + get reminded</h3>
          <p className="text-sm opacity-80 mb-5">
            Get notified before {eventName}. Track all your important dates. Takes 10 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup" className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: '#fff', color: 'rgb(var(--accent-brand))' }}>
              Create free account →
            </Link>
            <Link href="/auth/signin" className="px-6 py-2.5 rounded-xl text-sm text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.4)' }}>
              Already have an account
            </Link>
          </div>
          <p className="text-xs opacity-60 mt-3">No credit card · No spam · Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}
