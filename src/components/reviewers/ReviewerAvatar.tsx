// FILE: src/components/reviewers/ReviewerAvatar.tsx
'use client';
import { useState } from 'react';

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ReviewerAvatar({
  photoUrl,
  name,
  size = 96,
}: {
  photoUrl?: string | null;
  name: string;
  size?: number;
}) {
  // Tracks whether the <img> actually finished loading successfully — this is
  // what lets us fall back to initials instead of a broken-image icon when
  // photoUrl is missing, invalid, or 404s.
  const [failed, setFailed] = useState(false);
  const showImage = !!photoUrl && !failed;

  if (showImage) {
    return (
      <img
        src={photoUrl!}
        alt={name}
        onError={() => setFailed(true)}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: 'rgba(83,74,183,0.15)',
        color: 'rgb(83,74,183)',
        fontSize: size * 0.36,
      }}
      aria-hidden="true"
    >
      {initialsFor(name)}
    </div>
  );
}
