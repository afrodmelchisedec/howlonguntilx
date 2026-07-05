// FILE: src/components/ui/Toast.tsx
'use client';
import { useState, useCallback, useRef } from 'react';

interface ToastState { message: string; icon?: string; id: number }

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const counter = useRef(0);

  const showToast = useCallback((message: string, icon?: string) => {
    counter.current += 1;
    const id = counter.current;
    setToast({ message, icon, id });
    setTimeout(() => {
      setToast(curr => (curr?.id === id ? null : curr));
    }, 2600);
  }, []);

  return { toast, showToast };
}

export function ToastHost({ toast }: { toast: { message: string; icon?: string; id: number } | null }) {
  if (!toast) return null;
  return (
    <div key={toast.id} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] anim-fade-up" style={{ pointerEvents: 'none' }}>
      <div className="ios-card px-5 py-3 flex items-center gap-2" style={{ boxShadow: 'var(--shadow-elevated)', pointerEvents: 'auto' }}>
        {toast.icon && <span className="text-lg">{toast.icon}</span>}
        <span className="text-footnote font-semibold">{toast.message}</span>
      </div>
    </div>
  );
}
