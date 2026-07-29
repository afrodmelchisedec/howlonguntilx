// FILE: src/lib/affiliateBanners.ts
import { prisma } from './db';

export async function getAffiliateBanner(categorySlug: string | null | undefined) {
  if (!categorySlug) return null;
  const banner = await prisma.affiliateBanner.findUnique({ where: { categorySlug } });
  return banner && banner.active ? banner : null;
}
