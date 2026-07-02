import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com';
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard/'] },
    sitemap: `${base}/api/sitemap-index`,
  };
}
