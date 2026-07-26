// FILE: scripts/seed-category-tools.js
//
// Populates Category.tools (a Json[] field) with the tool(s) mapped to each
// subcategory, matched by parent-category name + subcategory name so this is
// safe to re-run — it only ever updates existing rows, never creates new
// categories. Run with: node scripts/seed-category-tools.js
//
// NOTE: "Travel > Nature, Space & Sky" is currently ONE subcategory on the
// live /categories page, even though the tool list mentioned "Nature" and
// "Space & Sky" separately. dark-sky-explorer is seeded under the combined
// subcategory below — split it into two subcategories first via the new
// admin Categories tab if you want them separate.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MAPPING = {
  Finance: {
    'Money & Milestones': [
      { slug: 'payroll-runway', label: 'Payroll Runway', path: '/tools/payroll-runway' },
    ],
    'Tax & Budget Deadlines': [
      { slug: 'tax-budget-deadlines', label: 'Tax & Budget Deadlines', path: '/tools/tax-budget-deadlines' },
    ],
    'Salary & Payroll Events': [
      { slug: 'savings-goal-slider', label: 'Savings Goal Slider', path: '/tools/savings-goal-slider' },
      { slug: 'runway-lab', label: 'Runway Lab', path: '/tools/runway-lab' },
    ],
  },
  Food: {
    'Food Festivals': [
      { slug: 'food-festival-passport', label: 'Food Festival Passport', path: '/tools/food-festival-passport' },
    ],
    'Restaurant Launches': [
      { slug: 'restaurant-launches', label: 'Restaurant Launches', path: '/tools/restaurant-launches' },
      { slug: 'recipe-batch-dial', label: 'Recipe Batch-Scale Dial', path: '/tools/recipe-batch-dial' },
    ],
    'Harvest Seasons': [
      { slug: 'harvest-seasons', label: 'Harvest Seasons', path: '/tools/harvest-seasons' },
    ],
  },
  Health: {
    'Medical Timelines': [],
    'Testing & Detection': [
      { slug: 'energy-rhythm-mapper', label: 'Energy & Rhythm Mapper', path: '/tools/energy-rhythm-mapper' },
    ],
  },
  Leisure: {
    'Sports & Games': [
      { slug: 'sports-games-tracker', label: 'Sports & Games Tracker', path: '/tools/sports-games-tracker' },
    ],
    'Entertainment': [
      { slug: 'entertainment-watchlist', label: 'Entertainment Watchlist', path: '/tools/entertainment-watchlist' },
    ],
    'Holidays & Celebrations': [
      { slug: 'jetlag-adjustment-dragger', label: 'Jet-Lag Adjustment Dragger', path: '/tools/jetlag-adjustment-dragger' },
    ],
    'Shopping & Deals': [
      { slug: 'shopping-deals-radar', label: 'Shopping & Deals Radar', path: '/tools/shopping-deals-radar' },
    ],
  },
  Productivity: {
    'Meeting Overlap': [
      { slug: 'meeting-overlap', label: 'Meeting Overlap', path: '/tools/meeting-overlap' },
    ],
    'Deadline Buffers': [
      { slug: 'deadline-buffer-slider', label: 'Deadline Buffer Slider', path: '/tools/deadline-buffer-slider' },
    ],
    'Focus Blocks': [
      { slug: 'focus-block-builder', label: 'Focus Block Builder', path: '/tools/focus-block-builder' },
      { slug: 'subscription-density', label: 'Subscription Renewal Density Map', path: '/tools/subscription-density' },
    ],
  },
  Scam: {
    'Cyber Scams': [
      { slug: 'password-rotation-board', label: 'Password Rotation Board', path: '/tools/password-rotation-board' },
    ],
    'Financial Fraud': [
      { slug: 'fraud-response-clock', label: 'Fraud Response Clock', path: '/tools/fraud-response-clock' },
    ],
    'Phishing & Identity Theft': [
      { slug: 'phishing-identity-watch', label: 'Phishing & Identity Watch', path: '/tools/phishing-identity-watch' },
    ],
  },
  Tech: {
    'Tech Events': [
      { slug: 'tech-events', label: 'Tech Events Calendar', path: '/tools/tech-events' },
    ],
  },
  Travel: {
    'Nature, Space & Sky': [
      { slug: 'dark-sky-explorer', label: 'Dark Sky Explorer', path: '/tools/dark-sky-explorer' },
    ],
  },
};

async function main() {
  let updated = 0, skipped = 0;

  for (const [parentName, subs] of Object.entries(MAPPING)) {
    const parent = await prisma.category.findFirst({ where: { name: parentName, parentId: null } });
    if (!parent) {
      console.warn(`⚠️  Top-level category "${parentName}" not found — skipping its subcategories`);
      skipped += Object.keys(subs).length;
      continue;
    }

    for (const [subName, tools] of Object.entries(subs)) {
      const sub = await prisma.category.findFirst({ where: { name: subName, parentId: parent.id } });
      if (!sub) {
        console.warn(`⚠️  Subcategory "${parentName} > ${subName}" not found — skipping`);
        skipped++;
        continue;
      }
      await prisma.category.update({ where: { id: sub.id }, data: { tools } });
      console.log(`✅ ${parentName} > ${subName}: ${tools.length} tool(s)`);
      updated++;
    }
  }

  console.log(`\nDone. ${updated} subcategories updated, ${skipped} skipped (not found).`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
