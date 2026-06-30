
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

function nextDate(month, day) {
  const now = new Date();
  const d = new Date(now.getFullYear(), month - 1, day);
  if (d <= now) d.setFullYear(d.getFullYear() + 1);
  return d;
}

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

const locationEvents = [
  // Uganda
  { slug: 'salary-uganda',         name: 'Salary Day Uganda',           category: 'finance',   targetDate: (() => { const d=new Date(); d.setDate(28); if(d<=new Date()) {d.setMonth(d.getMonth()+1);} return d; })() },
  { slug: 'budget-day-uganda',      name: 'Uganda Budget Day',           category: 'finance',   targetDate: nextDate(6, 13) },
  { slug: 'ura-tax-deadline',       name: 'URA Tax Deadline Uganda',     category: 'finance',   targetDate: nextDate(6, 30) },
  { slug: 'independence-day-uganda',name: "Uganda Independence Day",     category: 'holidays',  targetDate: nextDate(10, 9) },
  { slug: 'sunrise-kampala',        name: 'Sunrise in Kampala',          category: 'nature',    targetDate: (() => { const d=new Date(); d.setDate(d.getDate()+1); d.setHours(6,54,0,0); return d; })() },
  { slug: 'sunset-kampala',         name: 'Sunset in Kampala',           category: 'nature',    targetDate: (() => { const d=new Date(); d.setHours(19,5,0,0); if(d<=new Date()) d.setDate(d.getDate()+1); return d; })() },
  { slug: 'martyrs-day-uganda',     name: "Uganda Martyrs' Day",         category: 'holidays',  targetDate: nextDate(6, 3) },
  { slug: 'heroes-day-uganda',      name: 'Uganda Heroes Day',           category: 'holidays',  targetDate: nextDate(6, 9) },
  // Kenya
  { slug: 'salary-kenya',           name: 'Salary Day Kenya',            category: 'finance',   targetDate: (() => { const d=new Date(); d.setDate(28); if(d<=new Date()) {d.setMonth(d.getMonth()+1);} return d; })() },
  { slug: 'independence-day-kenya', name: 'Kenya Independence Day',      category: 'holidays',  targetDate: nextDate(12, 12) },
  { slug: 'madaraka-day-kenya',     name: 'Madaraka Day Kenya',          category: 'holidays',  targetDate: nextDate(6, 1) },
  { slug: 'sunrise-nairobi',        name: 'Sunrise in Nairobi',          category: 'nature',    targetDate: (() => { const d=new Date(); d.setDate(d.getDate()+1); d.setHours(6,30,0,0); return d; })() },
  // Nigeria
  { slug: 'salary-nigeria',         name: 'Salary Day Nigeria',          category: 'finance',   targetDate: (() => { const d=new Date(); d.setDate(28); if(d<=new Date()) {d.setMonth(d.getMonth()+1);} return d; })() },
  { slug: 'independence-day-nigeria',name:'Nigeria Independence Day',    category: 'holidays',  targetDate: nextDate(10, 1) },
  { slug: 'sunrise-lagos',          name: 'Sunrise in Lagos',            category: 'nature',    targetDate: (() => { const d=new Date(); d.setDate(d.getDate()+1); d.setHours(6,48,0,0); return d; })() },
  // India
  { slug: 'salary-india',           name: 'Salary Day India',            category: 'finance',   targetDate: (() => { const d=new Date(); d.setDate(28); if(d<=new Date()) {d.setMonth(d.getMonth()+1);} return d; })() },
  { slug: 'diwali',                 name: 'Diwali',                      category: 'holidays',  targetDate: nextDate(10, 20) },
  { slug: 'holi',                   name: 'Holi',                        category: 'holidays',  targetDate: nextDate(3, 14) },
  { slug: 'independence-day-india', name: 'India Independence Day',      category: 'holidays',  targetDate: nextDate(8, 15) },
  { slug: 'sunrise-mumbai',         name: 'Sunrise in Mumbai',           category: 'nature',    targetDate: (() => { const d=new Date(); d.setDate(d.getDate()+1); d.setHours(6,15,0,0); return d; })() },
  // UK
  { slug: 'salary-uk',              name: 'Salary Day UK',               category: 'finance',   targetDate: (() => { const d=new Date(); d.setDate(28); if(d<=new Date()) {d.setMonth(d.getMonth()+1);} return d; })() },
  { slug: 'uk-budget-day',          name: 'UK Budget Day',               category: 'finance',   targetDate: nextDate(3, 26) },
  { slug: 'bonfire-night',          name: 'Bonfire Night UK',            category: 'holidays',  targetDate: nextDate(11, 5) },
  { slug: 'sunrise-london',         name: 'Sunrise in London',           category: 'nature',    targetDate: (() => { const d=new Date(); d.setDate(d.getDate()+1); d.setHours(5,30,0,0); return d; })() },
  // USA
  { slug: 'tax-day-usa',            name: 'Tax Day USA',                 category: 'finance',   targetDate: nextDate(4, 15) },
  { slug: 'black-friday-usa',       name: 'Black Friday USA',            category: 'shopping',  targetDate: nextDate(11, 28) },
  { slug: 'thanksgiving-usa',       name: 'Thanksgiving USA',            category: 'holidays',  targetDate: nextDate(11, 27) },
  { slug: 'memorial-day-usa',       name: 'Memorial Day USA',            category: 'holidays',  targetDate: nextDate(5, 26) },
  { slug: 'sunrise-new-york',       name: 'Sunrise in New York',         category: 'nature',    targetDate: (() => { const d=new Date(); d.setDate(d.getDate()+1); d.setHours(5,45,0,0); return d; })() },
];

async function main() {
  let count = 0;
  for (const ev of locationEvents) {
    await p.event.upsert({ where: { slug: ev.slug }, update: { targetDate: ev.targetDate }, create: ev });
    count++;
  }
  console.log('✅ Seeded', count, 'location-based events');
  await p.$disconnect();
}
main().catch(e => { console.error(e); p.$disconnect(); process.exit(1); });
