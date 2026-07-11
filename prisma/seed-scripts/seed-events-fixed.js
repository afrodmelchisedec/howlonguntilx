const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

function nextDate(month, day) {
  const now = new Date();
  const d = new Date(now.getFullYear(), month - 1, day);
  if (d <= now) d.setFullYear(d.getFullYear() + 1);
  return d;
}

const CATEGORY_MAP = {
  holidays: 'holidays-celebrations',
  shopping: 'shopping-deals',
  nature: 'nature-space-sky',
  space: 'nature-space-sky',
  sports: 'sports-games',
  tech: 'tech-events',
  finance: 'money-milestones',
  entertainment: 'entertainment',
};

const events = [
  { slug: 'christmas', name: 'Christmas', tag: 'holidays', targetDate: nextDate(12, 25) },
  { slug: 'new-year', name: 'New Year', tag: 'holidays', targetDate: new Date(new Date().getFullYear() + 1, 0, 1) },
  { slug: 'halloween', name: 'Halloween', tag: 'holidays', targetDate: nextDate(10, 31) },
  { slug: 'valentines-day', name: "Valentine's Day", tag: 'holidays', targetDate: nextDate(2, 14) },
  { slug: 'thanksgiving', name: 'Thanksgiving', tag: 'holidays', targetDate: nextDate(11, 27) },
  { slug: 'easter', name: 'Easter', tag: 'holidays', targetDate: new Date('2027-03-28') },
  { slug: 'independence-day', name: 'Independence Day (US)', tag: 'holidays', targetDate: nextDate(7, 4) },
  { slug: 'mothers-day', name: "Mother's Day", tag: 'holidays', targetDate: nextDate(5, 11) },
  { slug: 'fathers-day', name: "Father's Day", tag: 'holidays', targetDate: nextDate(6, 15) },
  { slug: 'black-friday', name: 'Black Friday', tag: 'shopping', targetDate: nextDate(11, 28) },
  { slug: 'cyber-monday', name: 'Cyber Monday', tag: 'shopping', targetDate: nextDate(12, 1) },
  { slug: 'amazon-prime-day', name: 'Amazon Prime Day', tag: 'shopping', targetDate: nextDate(7, 8) },
  { slug: 'summer-solstice', name: 'Summer Solstice', tag: 'nature', targetDate: nextDate(6, 21) },
  { slug: 'winter-solstice', name: 'Winter Solstice', tag: 'nature', targetDate: nextDate(12, 21) },
  { slug: 'spring-equinox', name: 'Spring Equinox', tag: 'nature', targetDate: nextDate(3, 20) },
  { slug: 'autumn-equinox', name: 'Autumn Equinox', tag: 'nature', targetDate: nextDate(9, 22) },
  { slug: 'super-bowl', name: 'Super Bowl', tag: 'sports', targetDate: nextDate(2, 8) },
  { slug: 'fifa-world-cup', name: 'FIFA World Cup 2026', tag: 'sports', targetDate: new Date('2026-06-11') },
  { slug: 'olympics-2028', name: 'Olympics 2028', tag: 'sports', targetDate: new Date('2028-07-14') },
  { slug: 'champions-league-final', name: 'Champions League Final', tag: 'sports', targetDate: nextDate(5, 31) },
  { slug: 'wimbledon', name: 'Wimbledon', tag: 'sports', targetDate: nextDate(6, 30) },
  { slug: 'apple-event', name: 'Next Apple Event', tag: 'tech', targetDate: nextDate(9, 10) },
  { slug: 'ces', name: 'CES Tech Show', tag: 'tech', targetDate: nextDate(1, 7) },
  { slug: 'google-io', name: 'Google I/O', tag: 'tech', targetDate: nextDate(5, 20) },
  { slug: 'salary-uganda', name: 'Salary Day Uganda', tag: 'finance', targetDate: (() => { const d = new Date(); d.setDate(28); if (d <= new Date()) d.setMonth(d.getMonth()+1); return d; })() },
  { slug: 'ura-tax-deadline', name: 'URA Tax Deadline', tag: 'finance', targetDate: nextDate(6, 30) },
  { slug: 'budget-day-uganda', name: 'Uganda Budget Day', tag: 'finance', targetDate: nextDate(6, 13) },
  { slug: 'new-years-eve', name: "New Year's Eve", tag: 'entertainment', targetDate: nextDate(12, 31) },
  { slug: 'oscars', name: 'The Oscars', tag: 'entertainment', targetDate: nextDate(3, 2) },
  { slug: 'grammy-awards', name: 'Grammy Awards', tag: 'entertainment', targetDate: nextDate(2, 2) },
  { slug: 'next-solar-eclipse', name: 'Next Solar Eclipse', tag: 'space', targetDate: new Date('2026-08-12') },
  { slug: 'next-lunar-eclipse', name: 'Next Lunar Eclipse', tag: 'space', targetDate: new Date('2026-03-03') },
  { slug: 'independence-day-uganda', name: 'Uganda Independence Day', tag: 'holidays', targetDate: nextDate(10, 9) },
  { slug: 'martyrs-day-uganda', name: "Uganda Martyrs' Day", tag: 'holidays', targetDate: nextDate(6, 3) },
  { slug: 'heroes-day-uganda', name: 'Uganda Heroes Day', tag: 'holidays', targetDate: nextDate(6, 9) },
  { slug: 'salary-kenya', name: 'Salary Day Kenya', tag: 'finance', targetDate: (() => { const d = new Date(); d.setDate(28); if (d <= new Date()) d.setMonth(d.getMonth()+1); return d; })() },
  { slug: 'independence-day-kenya', name: 'Kenya Independence Day', tag: 'holidays', targetDate: nextDate(12, 12) },
  { slug: 'madaraka-day-kenya', name: 'Madaraka Day Kenya', tag: 'holidays', targetDate: nextDate(6, 1) },
  { slug: 'salary-nigeria', name: 'Salary Day Nigeria', tag: 'finance', targetDate: (() => { const d = new Date(); d.setDate(28); if (d <= new Date()) d.setMonth(d.getMonth()+1); return d; })() },
  { slug: 'independence-day-nigeria', name: 'Nigeria Independence Day', tag: 'holidays', targetDate: nextDate(10, 1) },
  { slug: 'salary-india', name: 'Salary Day India', tag: 'finance', targetDate: (() => { const d = new Date(); d.setDate(28); if (d <= new Date()) d.setMonth(d.getMonth()+1); return d; })() },
  { slug: 'diwali', name: 'Diwali', tag: 'holidays', targetDate: nextDate(10, 20) },
  { slug: 'holi', name: 'Holi', tag: 'holidays', targetDate: nextDate(3, 14) },
  { slug: 'independence-day-india', name: 'India Independence Day', tag: 'holidays', targetDate: nextDate(8, 15) },
  { slug: 'salary-uk', name: 'Salary Day UK', tag: 'finance', targetDate: (() => { const d = new Date(); d.setDate(28); if (d <= new Date()) d.setMonth(d.getMonth()+1); return d; })() },
  { slug: 'uk-budget-day', name: 'UK Budget Day', tag: 'finance', targetDate: nextDate(3, 26) },
  { slug: 'bonfire-night', name: 'Bonfire Night UK', tag: 'holidays', targetDate: nextDate(11, 5) },
  { slug: 'tax-day-usa', name: 'Tax Day USA', tag: 'finance', targetDate: nextDate(4, 15) },
  { slug: 'memorial-day-usa', name: 'Memorial Day USA', tag: 'holidays', targetDate: nextDate(5, 26) },
];

async function main() {
  const categories = await p.category.findMany();
  const bySlug = Object.fromEntries(categories.map(c => [c.slug, c.id]));

  let ok = 0, skipped = 0;
  for (const ev of events) {
    const realSlug = CATEGORY_MAP[ev.tag] || 'leisure';
    const categoryId = bySlug[realSlug];
    if (!categoryId) {
      console.log(`⚠️  Skipped "${ev.name}" — category slug "${realSlug}" not found.`);
      skipped++;
      continue;
    }
    await p.event.upsert({
      where: { slug: ev.slug },
      update: { targetDate: ev.targetDate, categoryId, categorySlug: realSlug },
      create: { slug: ev.slug, name: ev.name, targetDate: ev.targetDate, categoryId, categorySlug: realSlug },
    });
    ok++;
  }
  console.log(`✅ Seeded/updated ${ok} events. ${skipped} skipped.`);
  await p.$disconnect();
}

main().catch(e => { console.error(e); p.$disconnect(); process.exit(1); });
