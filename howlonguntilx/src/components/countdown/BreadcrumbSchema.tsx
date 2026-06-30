
interface Props { event: { name: string; slug: string; category: string } }

export function BreadcrumbSchema({ event }: Props) {
  const base = process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: event.category.charAt(0).toUpperCase() + event.category.slice(1), item: base + '/categories/' + event.category },
      { '@type': 'ListItem', position: 3, name: 'How Long Until ' + event.name, item: base + '/how-long-until-' + event.slug },
    ],
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  );
}
