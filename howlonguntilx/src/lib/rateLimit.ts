import { NextRequest } from 'next/server';

// Simple in-memory rate limiter (swap for Upstash Redis in production)
const store = new Map<string, { count: number; reset: number }>();
const LIMIT = 60;
const WINDOW_MS = 60_000;

export async function rateLimit(req: NextRequest): Promise<boolean> {
  const ip = req.headers.get('x-forwarded-for') ?? 'anon';
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.reset) {
    store.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  if (entry.count > LIMIT) return true;
  return false;
}
