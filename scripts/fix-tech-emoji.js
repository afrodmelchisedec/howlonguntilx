const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

function cp(...points) { return String.fromCodePoint(...points); }

const fixes = {
  'ces-2027': cp(0x1F5A5, 0xFE0F),
  'samsung-galaxy-unpacked-2027': cp(0x1F4F1),
  'mwc-barcelona-2027': cp(0x1F4E1),
  'gdc-2027': cp(0x1F3AE),
  'google-i-o-2027': cp(0x1F916),
  'apple-wwdc-2027': cp(0x1F34E),
  'prime-day-tech-drop-2027': cp(0x1F4E6),
  'ifa-berlin-2026': cp(0x1F30D),
  'apple-september-event-2026': cp(0x1F680),
  'meta-connect-2026': cp(0x1F576, 0xFE0F),
  'microsoft-ignite-2026': cp(0x1F4BC),
};

Promise.all(Object.entries(fixes).map(([slug, emoji]) =>
  p.event.update({ where: { slug }, data: { emoji } })
)).then(() => {
  console.log('Fixed', Object.keys(fixes).length, 'emoji values');
  return p.event.findMany({ where: { content: { path: ['kind'], equals: 'tech' } }, select: { slug: true, emoji: true } });
}).then(rows => {
  rows.forEach(r => console.log(r.slug, '->', Buffer.from(r.emoji, 'utf8').toString('hex')));
  return p.$disconnect();
});
