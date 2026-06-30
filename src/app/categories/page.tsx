
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Countdown Categories',
  description: 'Countdowns for holidays, sports, finance, tech, nature and more.',
};

const CATEGORIES = [
  { slug: 'holidays', label: 'Holidays & Celebrations', emoji: '🎄', desc: 'Christmas, Easter, Halloween and every holiday worldwide' },
  { slug: 'sports', label: 'Sports & Games', emoji: '⚽', desc: 'World Cup, Olympics, Super Bowl and major sporting events' },
  { slug: 'finance', label: 'Money & Milestones', emoji: '💰', desc: 'Salary day, tax deadlines, budget announcements' },
  { slug: 'tech', label: 'Tech Events', emoji: '💻', desc: 'Apple events, Google I/O, CES and major launches' },
  { slug: 'nature', label: 'Nature & Sky', emoji: '🌍', desc: 'Solstices, equinoxes, eclipses and natural events' },
  { slug: 'shopping', label: 'Shopping & Deals', emoji: '🛍️', desc: 'Black Friday, Prime Day, Cyber Monday' },
  { slug: 'entertainment', label: 'Entertainment', emoji: '🎬', desc: 'Oscars, Grammys, award shows and releases' },
  { slug: 'space', label: 'Space & Astronomy', emoji: '🚀', desc: 'Eclipses, meteor showers, rocket launches' },
];

export default function CategoriesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-medium mb-2">Browse by category</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-10">Find countdowns for every type of event</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CATEGORIES.map(cat => (
          <Link key={cat.slug} href={"/categories/" + cat.slug}
            className="flex gap-4 items-start p-5 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-brand-500 transition-colors group">
            <span className="text-3xl">{cat.emoji}</span>
            <div>
              <div className="font-medium group-hover:text-brand-500 transition-colors">{cat.label}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{cat.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
