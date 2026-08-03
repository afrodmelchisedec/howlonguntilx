type NavLink = {
  label: string;
  href: string;
  cls: string;
  ext?: boolean; // true = opens in a new tab (target="_blank")
};

export const NAV_LINKS: NavLink[] = [
  { label: 'Categories', href: '/categories',                    cls: 'gc-brand'  },
  { label: 'Calendar',   href: '/calendar',                      cls: 'gc-travel' },
  { label: 'Embed',      href: '/embed',                         cls: 'gc-sports' },
  { label: 'API',        href: '/api', cls: 'gc-finance' },
];

export const INFO_LINKS = [
  { label: 'About',   href: '/about'   },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms',   href: '/terms'   },
  { label: 'Pricing',   href: '/upgrade'   },
];