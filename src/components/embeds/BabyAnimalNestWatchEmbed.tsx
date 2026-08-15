// FILE: src/components/embeds/BabyAnimalNestWatchEmbed.tsx
'use client';
import { useState } from 'react';

const GLOW = '255, 179, 71';

type Species = 'bird' | 'bunny' | 'kitten' | 'puppy';
const SPECIES_META: Record<Species, { label: string; emoji: string }> = {
  bird:   { label: 'Baby Bird',  emoji: '🐦' },
  bunny:  { label: 'Baby Bunny', emoji: '🐰' },
  kitten: { label: 'Kitten',     emoji: '🐱' },
  puppy:  { label: 'Puppy',      emoji: '🐶' },
};

// Simplified single-headline milestone per species for the embed preview.
const HEADLINE: Record<Species, string> = {
  bird: 'Eyes open around day 4, fully feathered and ready to fledge by ~day 12–14.',
  bunny: 'Eyes open around day 10, fully weaned and independent by ~day 21–28.',
  kitten: 'Eyes open around day 8–10, weaned and eating solid food by ~day 42–56.',
  puppy: 'Eyes open around day 10–14, weaned and eating solid food by ~day 42–49.',
};

const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25)` };

export function BabyAnimalNestWatchEmbed() {
  const [species, setSpecies] = useState<Species | null>(null);

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>NEST WATCH</p>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>What did you find?</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {(Object.keys(SPECIES_META) as Species[]).map(s => (
          <button key={s} onClick={() => setSpecies(s)}
            style={{ flex: '1 1 40%', fontSize: 12, padding: '10px 8px', borderRadius: 10, border: `1px solid ${species === s ? `rgb(${GLOW})` : '#3a3a40'}`, background: '#2a2a30', color: '#f2f2f2', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 20 }}>{SPECIES_META[s].emoji}</span>
            {SPECIES_META[s].label}
          </button>
        ))}
      </div>

      {species && (
        <div style={{ background: '#2a2a30', borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <p style={{ fontSize: 13, lineHeight: 1.5 }}>{HEADLINE[species]}</p>
        </div>
      )}

      <p style={{ fontSize: 10.5, opacity: 0.5, lineHeight: 1.4 }}>
        General timelines only. If you're worried an animal is orphaned or injured, contact a local wildlife rehabilitator, shelter, or vet rather than waiting on general ranges.
      </p>
    </div>
  );
}
