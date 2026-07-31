// FILE: src/lib/apiAuth.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

const FREE_MONTHLY_CREDITS = 1000;
const PERIOD_LENGTH_DAYS = 30;

export type ApiAccessResult =
  | { ok: true; tier: 'FREE' | 'GROWTH' | 'SCALE'; remaining: number }
  | { ok: false; status: 401 | 402; error: string };

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

// Call this from any metered public route AFTER the existing burst rateLimit()
// check. Enforces monthly credit quotas: keyed by API key on paid tiers,
// by IP address on the Free tier. Attach the returned headers so callers
// (and curious developers using curl -v) can see their remaining balance.
export async function checkApiCredits(req: NextRequest): Promise<ApiAccessResult> {
  const authHeader = req.headers.get('authorization') || '';
  const bearerKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (bearerKey) {
    const apiKey = await prisma.apiKey.findUnique({ where: { key: bearerKey } });
    if (!apiKey) return { ok: false, status: 401, error: 'Invalid API key.' };
    if (apiKey.status === 'pending') {
      return { ok: false, status: 401, error: 'This API key is still awaiting payment confirmation.' };
    }
    if (apiKey.status !== 'active') {
      return { ok: false, status: 401, error: 'This API key is not active. Check your subscription status.' };
    }

    const now = new Date();

    // Lazy monthly rollover — resets on the first request after periodEnd,
    // no cron job required.
    if (now > apiKey.periodEnd) {
      const newPeriodEnd = new Date(now);
      newPeriodEnd.setUTCDate(newPeriodEnd.getUTCDate() + PERIOD_LENGTH_DAYS);
      const updated = await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { creditsUsed: 1, periodStart: now, periodEnd: newPeriodEnd },
      });
      return { ok: true, tier: updated.tier, remaining: updated.creditLimit - updated.creditsUsed };
    }

    if (apiKey.creditsUsed >= apiKey.creditLimit) {
      return { ok: false, status: 402, error: 'Monthly credit limit reached. Upgrade your plan or wait for the next billing cycle.' };
    }

    const updated = await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { creditsUsed: { increment: 1 } },
    });
    return { ok: true, tier: updated.tier, remaining: updated.creditLimit - updated.creditsUsed };
  }

  // Free tier — no key provided, tracked per IP per calendar month.
  const ip = getClientIp(req);
  const yearMonth = currentYearMonth();

  const usage = await prisma.apiUsageIp.upsert({
    where: { ip_yearMonth: { ip, yearMonth } },
    create: { ip, yearMonth, count: 1 },
    update: { count: { increment: 1 } },
  });

  if (usage.count > FREE_MONTHLY_CREDITS) {
    return {
      ok: false,
      status: 402,
      error: 'Free tier monthly limit reached. Get an API key to continue: https://howlonguntilx.com/api#pricing',
    };
  }

  return { ok: true, tier: 'FREE', remaining: FREE_MONTHLY_CREDITS - usage.count };
}

// Small helper so route handlers don't repeat this three times.
export function creditHeaders(access: Extract<ApiAccessResult, { ok: true }>): Record<string, string> {
  return {
    'X-RateLimit-Tier': access.tier,
    'X-RateLimit-Remaining': String(access.remaining),
  };
}
