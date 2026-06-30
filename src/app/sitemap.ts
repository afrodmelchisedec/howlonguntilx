
import { MetadataRoute } from 'next';
import { getAllEventSlugs } from '@/lib/events';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com';
  const slugs = await getAllEventSlugs();

  const eventUrls = slugs.map(slug => ({
    url: `${base}/how-long-until-${slug}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.9,
  }));

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/embed`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ...eventUrls,
  ];
}
