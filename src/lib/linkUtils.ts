// FILE: src/lib/linkUtils.ts

// Domains you're confident enough in to pass link equity to (dofollow).
// Keep this short and deliberate — every domain here is a small vote of trust from your site.
const TRUSTED_EXTERNAL_DOMAINS = [
  'nasa.gov',
  'noaa.gov',
  'nist.gov',
  'npl.co.uk',
  'wikipedia.org',
  'merriam-webster.com',
  'timessquarenyc.org',
  'longnow.org',
  'guinnessworldrecords.com',
];

function hostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function isTrusted(url: string): boolean {
  const host = hostname(url);
  if (!host) return false;
  return TRUSTED_EXTERNAL_DOMAINS.some(d => host === d || host.endsWith(`.${d}`));
}

// Returns the full rel string to put on an <a> tag.
// - Internal links (relative paths): no rel needed, always dofollow.
// - Trusted external sources: noopener only — dofollow, since citing them is the whole point.
// - Everything else external: noopener + nofollow — safe default until you've vetted the source.
export function externalRel(url: string): string {
  return isTrusted(url) ? 'noopener' : 'noopener nofollow';
}

export function isInternalHref(href: string): boolean {
  return href.startsWith('/') || href.startsWith('#');
}
