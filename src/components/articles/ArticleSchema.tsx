// FILE: src/components/articles/ArticleSchema.tsx
import { extractFaq, extractHeroCountdown } from './ArticleBlocks';

// SITE_URL must be an absolute origin (no trailing slash), e.g. "https://howlonguntil.example".
// Wire this to your real env var — schema.org requires absolute URLs, relative ones are silently ignored by validators.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

export function ArticleSchema({
  article,
  toolName,
  toolSlug,
}: {
  article: any;
  toolName: string;
  toolSlug: string;
}) {
  const hero = extractHeroCountdown(article.blocks as any);
  const faqItems = extractFaq(article.blocks as any);
  const pageUrl = `${SITE_URL}/tools/${toolSlug}/${article.slug}`;
  const toolUrl = `${SITE_URL}/tools/${toolSlug}`;

  const graph: any[] = [
    {
      '@type': 'Article',
      '@id': `${pageUrl}#article`,
      headline: article.title,
      description: article.dek,
      image: article.heroImageUrl ? [article.heroImageUrl] : undefined,
      author: { '@type': 'Organization', name: article.authorName, url: `${SITE_URL}/about` },
      publisher: { '@type': 'Organization', name: 'How Long Until', url: `${SITE_URL}/about` },
      ...(article.reviewerName
        ? { reviewedBy: { '@type': 'Person', name: article.reviewerName, ...(article.reviewerCredentials ? { jobTitle: article.reviewerCredentials } : {}) } }
        : {}),
      datePublished: article.publishedAt ?? undefined,
      dateModified: article.updatedAt ?? article.publishedAt ?? undefined,
      mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL || undefined },
        { '@type': 'ListItem', position: 2, name: toolName, item: toolUrl },
        { '@type': 'ListItem', position: 3, name: article.title, item: pageUrl },
      ],
    },
  ];

  // Event schema only fires when the article actually carries a countdown target —
  // this is what makes "when is X" eligible for date-rich results in search.
  if (hero) {
    graph.push({
      '@type': 'Event',
      name: hero.label,
      startDate: hero.targetDate,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      description: article.dek,
      url: pageUrl,
      ...(hero.locationName
        ? {
            location: {
              '@type': 'Place',
              name: hero.locationName,
              address: {
                '@type': 'PostalAddress',
                ...(hero.streetAddress ? { streetAddress: hero.streetAddress } : {}),
                ...(hero.addressLocality ? { addressLocality: hero.addressLocality } : {}),
                ...(hero.addressRegion ? { addressRegion: hero.addressRegion } : {}),
                ...(hero.postalCode ? { postalCode: hero.postalCode } : {}),
                ...(hero.addressCountry ? { addressCountry: hero.addressCountry } : {}),
              },
            },
          }
        : {}),
    });
  }

  if (faqItems && faqItems.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqItems.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
  }

  const jsonLd = { '@context': 'https://schema.org', '@graph': graph };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
