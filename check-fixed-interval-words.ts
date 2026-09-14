// Run with: npx tsx check-fixed-interval-words.ts
// Mirrors computeEventSeoScore's word-count logic from AdminClient.tsx exactly:
// sums words across every block in content.body that has a `text` field.
import { FIXED_INTERVAL_EVENTS } from './src/lib/fixedIntervalEventTemplates';

for (const [key, item] of Object.entries(FIXED_INTERVAL_EVENTS)) {
  const words = (item.content.body ?? []).reduce(
    (sum: number, b: any) => sum + String(b?.text ?? '').trim().split(/\s+/).filter(Boolean).length,
    0
  );
  const status = words >= 300 ? 'PASS' : 'FAIL';
  console.log(`${status}  ${key}: ${words} words`);
}
