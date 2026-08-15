// FILE: src/lib/kittenMilestones.ts
// Static developmental milestone data for the Kitten Growth Tracker.
// Day estimates are widely-cited veterinary averages (ASPCA / AAHA feline
// life-stage guidelines) — ranges shown alongside the point estimate.

export type BreedSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export const BREED_SIZES: Record<BreedSize, { label: string; matureAgeDays: number; adultWeightKg: [number, number] }> = {
  SMALL:  { label: 'Small breed (e.g. Singapura, Devon Rex)', matureAgeDays: 330,  adultWeightKg: [2.5, 3.5] },
  MEDIUM: { label: 'Medium / mixed breed (most cats)',        matureAgeDays: 365,  adultWeightKg: [3.5, 5.0] },
  LARGE:  { label: 'Large breed (e.g. Maine Coon, Ragdoll)',  matureAgeDays: 600,  adultWeightKg: [5.5, 9.0] },
};

export interface KittenMilestone {
  id: string;
  emoji: string;
  label: string;
  dayEstimate: number;
  rangeDays: [number, number];
  blurb: string;
}

// dayEstimate for 'fully_grown' is overridden per breedSize at compute time.
export const KITTEN_MILESTONES: KittenMilestone[] = [
  { id: 'eyes_open',      emoji: '👁️', label: 'Eyes fully open',        dayEstimate: 10,  rangeDays: [7, 14],   blurb: 'Eyes open gradually starting around day 7–10 and are usually fully open by day 14. Vision is blurry at first.' },
  { id: 'first_steps',    emoji: '🐾', label: 'First wobbly steps',     dayEstimate: 18,  rangeDays: [15, 21],  blurb: 'Legs strengthen enough for unsteady walking around week 2–3, well before real coordination kicks in.' },
  { id: 'weaning_starts', emoji: '🍼', label: 'Weaning begins',         dayEstimate: 28,  rangeDays: [25, 32],  blurb: 'Mom starts introducing solid food around 4 weeks — nursing continues alongside it.' },
  { id: 'dry_food',       emoji: '🥣', label: 'Eating dry food',        dayEstimate: 45,  rangeDays: [42, 56],  blurb: 'Most kittens can chew dry kibble (softened at first) by 6–8 weeks.' },
  { id: 'weaned',         emoji: '✅', label: 'Fully weaned',           dayEstimate: 56,  rangeDays: [49, 63],  blurb: 'Nursing typically stops entirely by 8 weeks, sometimes stretching to 9.' },
  { id: 'ready_to_leave', emoji: '🏠', label: 'Ready to leave mom',     dayEstimate: 84,  rangeDays: [70, 98],  blurb: 'Most vets and breeders recommend waiting until at least 12 weeks (some regions require it by law) for social development, even though 8 weeks is the physical minimum.' },
  { id: 'adolescent',     emoji: '⚡', label: 'Adolescent growth spurt', dayEstimate: 180, rangeDays: [150, 210], blurb: 'Energy and appetite spike hard around 5–7 months — the "kitten zoomies" peak.' },
  { id: 'fully_grown',    emoji: '🐈', label: 'Fully grown',            dayEstimate: 365, rangeDays: [330, 600], blurb: 'Skeletal growth finishes; timing depends heavily on breed size.' },
];

export function getMilestonesForBreed(breedSize: BreedSize): KittenMilestone[] {
  const matureDays = BREED_SIZES[breedSize].matureAgeDays;
  return KITTEN_MILESTONES.map(m =>
    m.id === 'fully_grown' ? { ...m, dayEstimate: matureDays, rangeDays: [Math.round(matureDays * 0.9), Math.round(matureDays * 1.1)] } : m
  );
}

export function expectedWeightKgAtDay(day: number, breedSize: BreedSize): number {
  // Simple monotonic growth-curve approximation: birth ~0.1kg, steep first
  // 8 weeks, tapering to adult weight by matureAgeDays. Not a medical tool —
  // labeled as an approximation in the UI.
  const [minAdult, maxAdult] = BREED_SIZES[breedSize].adultWeightKg;
  const adult = (minAdult + maxAdult) / 2;
  const matureDays = BREED_SIZES[breedSize].matureAgeDays;
  const t = Math.min(1, day / matureDays);
  const curve = 1 - Math.pow(1 - t, 2.2); // fast-then-slow growth shape
  return Math.max(0.1, +(0.1 + curve * (adult - 0.1)).toFixed(2));
}

export function currentAgeParts(birthDate: Date) {
  const ms = Date.now() - birthDate.getTime();
  const days = Math.max(0, Math.floor(ms / 86400000));
  const weeks = Math.floor(days / 7);
  const months = +(days / 30.44).toFixed(1);
  return { days, weeks, months };
}
