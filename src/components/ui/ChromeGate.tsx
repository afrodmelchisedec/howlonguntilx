// FILE: src/components/ui/ChromeGate.tsx
'use client';

import { usePathname } from 'next/navigation';

// Wraps site chrome (Nav, Footer, ConsentBanner, LeadMagnetBanner) so it
// renders everywhere EXCEPT the embed widget route. The widget is meant to
// be dropped into a small iframe on someone else's site — it must never
// show your nav bar, footer, or banners, which would otherwise render at
// full size and get crushed into a 300×160 box.
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEmbedWidget = pathname?.startsWith('/embed/widget');

  if (isEmbedWidget) return null;
  return <>{children}</>;
}
