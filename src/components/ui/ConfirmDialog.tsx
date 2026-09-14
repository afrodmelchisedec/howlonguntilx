'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type ConfirmDialogState = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
} | null;

export function ConfirmDialog({
  state,
  onClose,
}: {
  state: ConfirmDialogState;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  // Drive the enter/exit transition off a rAF so the initial mount
  // paints at scale/opacity 0 before we animate to 1.
  useEffect(() => {
    if (state) {
      setBusy(false);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
    }
  }, [state]);

  useEffect(() => {
    if (!state) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state, busy, onClose]);

  if (!state || typeof document === 'undefined') return null;

  async function handleConfirm() {
    if (!state) return;
    try {
      setBusy(true);
      await state.onConfirm();
    } finally {
      onClose();
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-[300px] overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl transition-all duration-200 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(1.06)',
        }}
      >
        <div className="px-5 pt-5 pb-4 text-center">
          <p id="confirm-dialog-title" className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
            {state.title}
          </p>
          <p id="confirm-dialog-message" className="mt-1.5 text-[13px] leading-snug text-gray-500 dark:text-gray-400">
            {state.message}
          </p>
        </div>

        <div className="flex border-t border-gray-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 border-r border-gray-200 dark:border-white/10 py-3 text-[15px] font-medium text-brand-600 dark:text-brand-400 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 active:bg-gray-100 dark:active:bg-white/10"
          >
            {state.cancelLabel ?? 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={
              'flex-1 py-3 text-[15px] font-semibold transition-colors hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-60 active:bg-gray-100 dark:active:bg-white/10 ' +
              (state.destructive
                ? 'text-red-500 dark:text-red-400'
                : 'text-brand-600 dark:text-brand-400')
            }
          >
            {busy ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {state.confirmLabel ?? 'Confirm'}
              </span>
            ) : (
              state.confirmLabel ?? 'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
