export type NavLink = {
  label: string;
  href: string;
  cls: string;
  icon: string;
  description: string;
  ext?: boolean; // true = opens in a new tab (target="_blank")
};

export const NAV_LINKS: NavLink[] = [
  { label: 'Categories', href: '/categories', cls: 'gc-brand',   icon: '🗂️', description: 'Browse every countdown by topic' },
  { label: 'Tools',      href: '/tools',      cls: 'gc-finance', icon: '🧰', description: 'Interactive calculators & planners' },
  { label: 'Calendar',   href: '/calendar',   cls: 'gc-travel',  icon: '📅', description: 'Every day, one random fact away' },
  { label: 'Embed',      href: '/embed',      cls: 'gc-sports',  icon: '🔗', description: 'Add a live countdown to your site' },
  { label: 'API',        href: '/api',        cls: 'gc-finance', icon: '⚡', description: 'Build on our countdown data' },
];

export const INFO_LINKS = [
  { label: 'About',   href: '/about'   },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms',   href: '/terms'   },
  { label: 'Pricing', href: '/upgrade' },
];
