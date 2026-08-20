// FILE: src/lib/username.ts
import { prisma } from './db';

// Usernames that would collide with real routes or read as impersonating
// the site itself.
const RESERVED = new Set([
  'admin', 'root', 'api', 'support', 'help', 'howlonguntilx',
  'community', 'dashboard', 'auth', 'settings', 'u',
]);

/**
 * Same kebab-case convention as userEventSlug.ts's toKebabCase, capped
 * shorter — usernames appear in URLs like /u/{username} and should stay
 * readable rather than hitting event-slug's 80-char ceiling.
 */
export function toUsernameSlug(source: string): string {
  return source
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}

/**
 * Prefers the display name; falls back to the email local-part since
 * Credentials signup allows a blank name. Numeric suffix on collision
 * (base2, base3, ...) — deliberately different from userEventSlug's
 * random 4-char suffix, since usernames are user-facing/memorable.
 */
export async function generateUniqueUsername(name: string | null, email: string | null): Promise<string> {
  const source = (name && name.trim()) || (email ? email.split('@')[0] : '') || 'user';
  let base = toUsernameSlug(source) || 'user';
  if (RESERVED.has(base)) base = base + '-user';

  const existing = await prisma.user.findUnique({ where: { username: base }, select: { id: true } });
  if (!existing) return base;

  const MAX_ATTEMPTS = 1000;
  for (let n = 2; n <= MAX_ATTEMPTS; n++) {
    const candidate = `${base}${n}`;
    const clash = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!clash) return candidate;
  }

  // Last-resort fallback: timestamp is guaranteed unique.
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * Generates and persists a username for a just-created (or pre-existing,
 * for the backfill script) user. No-op if they already have one — safe
 * to call defensively from every signup path without double-checking first.
 */
export async function assignUsernameForNewUser(userId: string, name: string | null, email: string | null): Promise<void> {
  const current = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
  if (current?.username) return;

  const username = await generateUniqueUsername(name, email);
  try {
    await prisma.user.update({ where: { id: userId }, data: { username } });
  } catch (err: any) {
    // Extremely rare race on the unique constraint — retry once with a
    // fresh generation pass rather than leaving the user without one.
    if (err?.code === 'P2002') {
      const retry = await generateUniqueUsername(name, email);
      await prisma.user.update({ where: { id: userId }, data: { username: retry } });
    } else {
      throw err;
    }
  }
}
