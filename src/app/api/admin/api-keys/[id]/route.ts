// FILE: src/app/api/admin/api-keys/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

// Manual admin overrides only — this never talks to PayPal. Revoking here
// stops the key from working immediately (apiAuth.ts checks status==='active')
// but does NOT cancel the underlying PayPal subscription, so the customer
// would keep being billed unless the admin also cancels it on PayPal's side.
// That's intentional: "revoke" = kill switch for abuse/fraud, not a refund
// mechanism. Flag this distinction to the admin in the UI.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await isAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const adminEmail = session.user?.email ?? 'unknown';

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { action, creditLimit, creditsUsed } = body as {
    action?: 'revoke' | 'reactivate' | 'adjustCredits';
    creditLimit?: number;
    creditsUsed?: number;
  };

  const existing = await prisma.apiKey.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 });
  }

  try {
    if (action === 'revoke') {
      const updated = await prisma.apiKey.update({
        where: { id: params.id },
        data: { status: 'cancelled', revokedAt: new Date() },
      });
      console.log('[admin/api-keys] revoked', { id: params.id, by: adminEmail });
      return NextResponse.json({ ok: true, key: updated });
    }

    if (action === 'reactivate') {
      // Reactivating does not reset revokedAt to null on purpose — keep the
      // audit trail of "this key was revoked once" even after restoring it.
      const updated = await prisma.apiKey.update({
        where: { id: params.id },
        data: { status: 'active' },
      });
      console.log('[admin/api-keys] reactivated', { id: params.id, by: adminEmail });
      return NextResponse.json({ ok: true, key: updated });
    }

    if (action === 'adjustCredits') {
      const data: { creditLimit?: number; creditsUsed?: number } = {};
      if (typeof creditLimit === 'number' && creditLimit >= 0) data.creditLimit = Math.floor(creditLimit);
      if (typeof creditsUsed === 'number' && creditsUsed >= 0) data.creditsUsed = Math.floor(creditsUsed);

      if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: 'Provide creditLimit and/or creditsUsed as non-negative numbers' }, { status: 400 });
      }

      const updated = await prisma.apiKey.update({ where: { id: params.id }, data });
      console.log('[admin/api-keys] credits adjusted', { id: params.id, data, by: adminEmail });
      return NextResponse.json({ ok: true, key: updated });
    }

    return NextResponse.json({ error: 'Unknown action. Use revoke, reactivate, or adjustCredits.' }, { status: 400 });
  } catch (err) {
    console.error('API key admin update error:', err);
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
  }
}
