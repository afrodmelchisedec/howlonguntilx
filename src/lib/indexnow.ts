// FILE: src/lib/indexnow.ts
// IndexNow lets us push URLs to Bing (and other participating engines like
// Yandex) the instant content changes, instead of waiting for their own
// crawl schedule. One shared key, verified once via the key file at the
// site root — https://<domain>/03963ce9e905727e27bb7e2708a77227.txt — then every ping just references it.

const INDEXNOW_KEY = '03963ce9e905727e27bb7e2708a77227';
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';
const HOST = BASE.replace(/^https?:\/\//, '');

// Bing's own endpoint. IndexNow is a shared protocol — a ping to any one
// participating engine propagates to the others (Yandex, etc.) — but we call
// Bing directly since that's the one we've verified installation with.
const INDEXNOW_ENDPOINT = 'https://www.bing.com/indexnow';

/**
 * Ping IndexNow with one or more absolute or relative URLs. Fire-and-forget —
 * failures are logged but never thrown, since a failed ping should never
 * block or fail the admin save/import action that triggered it.
 */
export async function pingIndexNow(urls: string[]) {
  if (!urls.length) return;

  const urlList = urls.map(u => (u.startsWith('http') ? u : `${BASE}${u.startsWith('/') ? '' : '/'}${u}`));

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `${BASE}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });
    if (!res.ok) {
      console.error('IndexNow ping failed:', res.status, await res.text().catch(() => ''));
    }
  } catch (e) {
    console.error('IndexNow ping error:', e);
  }
}
