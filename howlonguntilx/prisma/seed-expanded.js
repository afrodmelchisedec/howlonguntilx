
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

function nextDate(month, day) {
  const now = new Date();
  const d = new Date(now.getFullYear(), month - 1, day);
  if (d <= now) d.setFullYear(d.getFullYear() + 1);
  return d;
}

const events = [
  // Holidays
  { slug: 'christmas', name: 'Christmas', category: 'holidays', targetDate: nextDate(12, 25) },
  { slug: 'new-year', name: 'New Year', category: 'holidays', targetDate: new Date(new Date().getFullYear() + 1, 0, 1) },
  { slug: 'halloween', name: 'Halloween', category: 'holidays', targetDate: nextDate(10, 31) },
  { slug: 'valentines-day', name: "Valentine's Day", category: 'holidays', targetDate: nextDate(2, 14) },
  { slug: 'thanksgiving', name: 'Thanksgiving', category: 'holidays', targetDate: nextDate(11, 27) },
  { slug: 'easter', name: 'Easter', category: 'holidays', targetDate: new Date('2027-03-28') },
  { slug: 'independence-day', name: 'Independence Day (US)', category: 'holidays', targetDate: nextDate(7, 4) },
  { slug: 'mothers-day', name: "Mother's Day", category: 'holidays', targetDate: nextDate(5, 11) },
  { slug: 'fathers-day', name: "Father's Day", category: 'holidays', targetDate: nextDate(6, 15) },
  { slug: 'black-friday', name: 'Black Friday', category: 'shopping', targetDate: nextDate(11, 28) },
  { slug: 'cyber-monday', name: 'Cyber Monday', category: 'shopping', targetDate: nextDate(12, 1) },
  { slug: 'amazon-prime-day', name: 'Amazon Prime Day', category: 'shopping', targetDate: nextDate(7, 8) },
  // Nature
  { slug: 'summer-solstice', name: 'Summer Solstice', category: 'nature', targetDate: nextDate(6, 21) },
  { slug: 'winter-solstice', name: 'Winter Solstice', category: 'nature', targetDate: nextDate(12, 21) },
  { slug: 'spring-equinox', name: 'Spring Equinox', category: 'nature', targetDate: nextDate(3, 20) },
  { slug: 'autumn-equinox', name: 'Autumn Equinox', category: 'nature', targetDate: nextDate(9, 22) },
  // Sports
  { slug: 'super-bowl', name: 'Super Bowl', category: 'sports', targetDate: nextDate(2, 8) },
  { slug: 'fifa-world-cup', name: 'FIFA World Cup 2026', category: 'sports', targetDate: new Date('2026-06-11') },
  { slug: 'olympics-2028', name: 'Olympics 2028', category: 'sports', targetDate: new Date('2028-07-14') },
  { slug: 'champions-league-final', name: 'Champions League Final', category: 'sports', targetDate: nextDate(5, 31) },
  { slug: 'wimbledon', name: 'Wimbledon', category: 'sports', targetDate: nextDate(6, 30) },
  // Tech
  { slug: 'apple-event', name: 'Next Apple Event', category: 'tech', targetDate: nextDate(9, 10) },
  { slug: 'ces', name: 'CES Tech Show', category: 'tech', targetDate: nextDate(1, 7) },
  { slug: 'google-io', name: 'Google I/O', category: 'tech', targetDate: nextDate(5, 20) },
  // Finance Uganda
  { slug: 'salary-uganda', name: 'Salary Day Uganda', category: 'finance', targetDate: (() => { const d = new Date(); d.setDate(28); if (d <= new Date()) d.setMonth(d.getMonth()+1); return d; })() },
  { slug: 'ura-tax-deadline', name: 'URA Tax Deadline', category: 'finance', targetDate: nextDate(6, 30) },
  { slug: 'budget-day-uganda', name: 'Uganda Budget Day', category: 'finance', targetDate: nextDate(6, 13) },
  // Entertainment
  { slug: 'new-years-eve', name: "New Year's Eve", category: 'entertainment', targetDate: nextDate(12, 31) },
  { slug: 'oscars', name: 'The Oscars', category: 'entertainment', targetDate: nextDate(3, 2) },
  { slug: 'grammy-awards', name: 'Grammy Awards', category: 'entertainment', targetDate: nextDate(2, 2) },
  // Space
  { slug: 'next-solar-eclipse', name: 'Next Solar Eclipse', category: 'space', targetDate: new Date('2026-08-12') },
  { slug: 'next-lunar-eclipse', name: 'Next Lunar Eclipse', category: 'space', targetDate: new Date('2026-03-03') },
];

async function main() {
  let count = 0;
  for (const ev of events) {
    await p.event.upsert({ where: { slug: ev.slug }, update: { targetDate: ev.targetDate }, create: ev });
    count++;
  }
  console.log('Seeded', count, 'events');
  await p.$disconnect();
}

main().catch(e => { console.error(e); p.$disconnect(); process.exit(1); });
