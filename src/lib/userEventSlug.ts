// FILE: src/lib/userEventSlug.ts
import { prisma } from '@/lib/db';

/**
 * Pure kebab-case conversion. Unit-testable in isolation — no I/O.
 * "Sarah's Wedding!!"  -> "sarahs-wedding"
 * "  Q4   Launch  "    -> "q4-launch"
 */
export function toKebabCase(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/'/g, '') // "Sarah's" -> "sarahs", not "sarah-s"
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80); // keep slugs reasonable for URLs
}

/**
 * Random 4-char lowercase alphanumeric suffix, e.g. "a8f3".
 * Excludes visually ambiguous chars (0/o, 1/l/i) to avoid confusion
 * if a user ever has to read a slug aloud or type it manually.
 */
function randomSuffix(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/**
 * Generates a unique UserEvent slug from a title, checking against the
 * DB and appending a random 4-char suffix on collision (same convention
 * as Timer.slug). Retries a handful of times before giving up — a
 * collision on a *suffixed* slug is astronomically unlikely, so this
 * should never realistically exhaust its retries.
 */
export async function generateUniqueUserEventSlug(title: string): Promise<string> {
  const base = toKebabCase(title) || 'event';

  const existing = await prisma.userEvent.findUnique({
    where: { slug: base },
    select: { id: true },
  });
  if (!existing) return base;

  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = `${base}-${randomSuffix()}`;
    const clash = await prisma.userEvent.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
  }

  // Last-resort fallback: timestamp is guaranteed unique.
  return `${base}-${Date.now().toString(36)}`;
}
