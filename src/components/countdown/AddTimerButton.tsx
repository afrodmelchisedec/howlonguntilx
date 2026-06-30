'use client';
import { useState } from 'react';
import { AddTimerModal } from './AddTimerModal';

interface Timer { id: string; name: string; targetDate: Date | string; category: string }

export function AddTimerButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-filled press">
        + Add countdown
      </button>
      {open && (
        <AddTimerModal
          onClose={() => setOpen(false)}
          onAdded={(_t: Timer) => { setOpen(false); window.location.reload(); }}
        />
      )}
    </>
  );
}
