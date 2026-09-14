'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type AlertDialogState = {
  title?: string;
  message: string;
} | null;

export function AlertDialog({
  state,
  onClose,
}: {
  state: AlertDialogState;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (state) {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
    }
  }, [state]);

  useEffect(() => {
    if (!state) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === 'Enter') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state, onClose]);

  if (!state || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-message"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
      />

      <div
        className="relative w-full max-w-[300px] overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl transition-all duration-200 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(1.06)',
        }}
      >
        <div className="px-5 pt-5 pb-4 text-center">
          {state.title && (
            <p id="alert-dialog-title" className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
              {state.title}
            </p>
          )}
          <p
            id="alert-dialog-message"
            className={'text-[13px] leading-snug text-gray-500 dark:text-gray-400' + (state.title ? ' mt-1.5' : '')}
          >
            {state.message}
          </p>
        </div>

        <div className="flex border-t border-gray-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-[15px] font-semibold text-brand-600 dark:text-brand-400 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10"
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
