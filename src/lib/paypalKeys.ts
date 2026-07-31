// FILE: src/lib/paypalKeys.ts
// Isolated PayPal helper for API-key billing only. Deliberately does not
// import or touch anything from the site's existing Pro-plan PayPal code,
// so a bug here can't affect real Pro subscriptions.
import crypto from 'crypto';

const MODE = process.env.NEXT_PUBLIC_PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
const IS_LIVE = MODE === 'live';

const API_BASE = IS_LIVE ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

function env(name: string): string {
  const suffix = IS_LIVE ? '_LIVE' : '_SANDBOX';
  const value = process.env[`${name}${suffix}`];
  if (!value) throw new Error(`Missing env var ${name}${suffix}`);
  return value;
}

export function generateApiKey(): string {
  const prefix = IS_LIVE ? 'hlx_live_' : 'hlx_test_';
  return prefix + crypto.randomBytes(20).toString('hex');
}

async function getAccessToken(): Promise<string> {
  const clientId = env('PAYPAL_CLIENT_ID');
  const clientSecret = env('PAYPAL_CLIENT_SECRET');
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal OAuth token request failed: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

// Verifies the webhook actually came from PayPal, per PayPal's documented
// verify-webhook-signature endpoint. Returns true/false — never throws for
// a bad signature (throws only on our own misconfiguration).
export async function verifyApiKeysWebhookSignature(
  headers: Headers,
  rawBody: string
): Promise<boolean> {
  const accessToken = await getAccessToken();
  const webhookId = env('PAYPAL_API_KEYS_WEBHOOK_ID');

  const verifyPayload = {
    auth_algo: headers.get('paypal-auth-algo'),
    cert_url: headers.get('paypal-cert-url'),
    transmission_id: headers.get('paypal-transmission-id'),
    transmission_sig: headers.get('paypal-transmission-sig'),
    transmission_time: headers.get('paypal-transmission-time'),
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody),
  };

  const res = await fetch(`${API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(verifyPayload),
  });

  if (!res.ok) return false;
  const data = await res.json();
  return data.verification_status === 'SUCCESS';
}
