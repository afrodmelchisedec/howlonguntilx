// FILE: scripts/set-event-content.js
// Usage: node scripts/set-event-content.js <slug> <path-to-json>
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const [slug, jsonPath] = process.argv.slice(2);
if (!slug || !jsonPath) {
  console.error('Usage: node scripts/set-event-content.js <slug> <path-to-json>');
  process.exit(1);
}

const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const p = new PrismaClient();

p.event.update({ where: { slug }, data: { content } })
  .then(e => { console.log('Updated content for:', e.slug); p.$disconnect(); })
  .catch(e => { console.error(e.message); p.$disconnect(); });
