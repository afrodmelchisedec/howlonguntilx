// FILE: prisma/patch-add-paypal-fields.js
// Run once: node prisma/patch-add-paypal-fields.js
const fs = require('fs');
const path = 'prisma/schema.prisma';

let content = fs.readFileSync(path, 'utf8');
const normalized = content.replace(/\r\n/g, '\n');

const anchor = `paypalId      String?   @unique`;

if (normalized.includes('paypalSubscriptionId')) {
  console.log('✅ Fields already present — nothing to do.');
  process.exit(0);
}

if (!normalized.includes(anchor)) {
  console.error('❌ Anchor line not found. Schema may have changed — no edits made. Paste your current User model and I\'ll adjust.');
  process.exit(1);
}

const replacement = `${anchor}
  paypalSubscriptionId String?   @unique
  subscriptionStatus   String?   @default("none")
  planRenewsAt         DateTime?`;

const updated = normalized.replace(anchor, replacement);
fs.writeFileSync(path, updated, 'utf8');
console.log('✅ Added paypalSubscriptionId, subscriptionStatus, planRenewsAt to User model.');
