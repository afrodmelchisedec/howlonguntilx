// FILE: src/lib/indexnow.ts
// Real, working, instant indexing signal for Bing/Yandex/Seznam/Naver (NOT Google — no such endpoint exists for Google).
export async function pingIndexNow(urls: string[]) {
  const key = process.env.INDEXNOW_KEY; // TODO: generate a key file, host it at https://www.howlonguntilx.com/<key>.txt, set this env var
  if (!key || urls.length === 0) return;
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host: 'www.howlonguntilx.com', key, urlList: urls }),
    });
  } catch { /* best-effort, never block publish on this */ }
}
