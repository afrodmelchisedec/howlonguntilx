// FILE: scripts/audit-dynamic-content.js
//
// One-off maintenance script — NOT part of the app build. Run manually with:
//   node scripts/audit-dynamic-content.js
//
// Scans every Event's `content` JSON (body text, heroFact, quickFacts
// values, faqs) for hardcoded date-relative phrases like "2,446 days ago"
// or "6 years, 8 months" that would go stale over time and should probably
// be converted to {{daysSince:YYYY-MM-DD}} / {{humanSince:YYYY-MM-DD}} /
// {{today}} tokens (see src/lib/dynamicTokens.ts).
//
// This does NOT modify anything — it only prints a report so you know
// exactly which events (if any) are worth re-editing, instead of having to
// manually re-check all of them.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Matches things like: "2,446 days ago", "6 years, 8 months", "349 weeks",
// "204 days left", "since January 1, 2020" combined with a number nearby.
// Deliberately broad — false positives are fine here, this is a human-
// reviewed report, not an automated rewrite.
const SUSPECT_PATTERNS = [
  /\b[\d,]+\s*(day|week|month|year)s?\s*(ago|since|left|remaining|from now)\b/i,
  /\bas of\s+(today|[A-Z][a-z]+ \d{1,2},? \d{4})\b/i,
  /\b\d+\s*years?,\s*\d+\s*months?,\s*\d+\s*days?\b/i,
];

function findMatches(text) {
  if (typeof text !== 'string') return [];
  const hits = [];
  for (const re of SUSPECT_PATTERNS) {
    const m = text.match(re);
    if (m) hits.push(m[0]);
  }
  return hits;
}

// Walks the whole content object (body blocks, heroFact, quickFacts, faqs,
// or any future field) so nothing is missed just because it's nested.
function scanContent(content) {
  const found = [];
  function walk(value, path) {
    if (typeof value === 'string') {
      for (const hit of findMatches(value)) found.push({ path, hit, hasToken: value.includes('{{') });
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`));
    } else if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k);
    }
  }
  walk(content, '');
  return found;
}

async function main() {
  const events = await prisma.event.findMany({
    where: { content: { not: null } },
    select: { slug: true, name: true, content: true },
    orderBy: { slug: 'asc' },
  });

  console.log(`Scanned ${events.length} events with content.\n`);

  let flaggedCount = 0;
  for (const ev of events) {
    const hits = scanContent(ev.content);
    if (hits.length === 0) continue;

    const needsWork = hits.filter(h => !h.hasToken);
    if (needsWork.length === 0) continue; // already tokenized, nothing to do

    flaggedCount++;
    console.log(`⚠️  ${ev.slug}  ("${ev.name}")`);
    for (const h of needsWork) {
      console.log(`    ${h.path}: "${h.hit}"`);
    }
    console.log('');
  }

  if (flaggedCount === 0) {
    console.log('✅ No hardcoded date-relative numbers found — nothing needs conversion.');
  } else {
    console.log(`Found ${flaggedCount} event(s) with hardcoded numbers that likely need {{...}} tokens.`);
    console.log('Everything else either has no date-relative prose, or is already tokenized.');
  }
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
