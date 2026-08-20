// FILE: src/lib/blobStorage.ts
import { getStore } from '@netlify/blobs';

const STORE_NAME = 'user-event-images';

// Netlify Blobs gets store context automatically when deployed on Netlify
// or run via `netlify dev` — but NOT under plain `npm run dev`. For local
// development, set NETLIFY_SITE_ID and NETLIFY_BLOBS_TOKEN in .env (from
// Netlify dashboard: Site settings -> Site details -> Site ID, and a
// Personal Access Token from User settings -> Applications) to configure
// the store manually instead.
function store() {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  if (siteID && token) {
    return getStore({ name: STORE_NAME, siteID, token });
  }
  return getStore(STORE_NAME);
}

export async function uploadImage(key: string, data: ArrayBuffer, contentType: string): Promise<string> {
  await store().set(key, data, { metadata: { contentType } });
  return `/api/blobs/${key}`;
}

export async function getImage(key: string): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const result = await store().getWithMetadata(key, { type: 'arrayBuffer' });
  if (!result) return null;
  return {
    data: result.data,
    contentType: (result.metadata as any)?.contentType ?? 'application/octet-stream',
  };
}

export async function deleteImage(key: string): Promise<void> {
  await store().delete(key);
}
