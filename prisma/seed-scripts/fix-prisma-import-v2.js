// FILE: prisma/seed-scripts/fix-prisma-import-v2.js
const fs = require('fs');

const dbContent = fs.readFileSync('src/lib/db.ts', 'utf8');

// Detect how it's exported
let importLine;
if (/export\s+default\s+/.test(dbContent) && /new PrismaClient/.test(dbContent)) {
  // export default prisma  → import prisma from '@/lib/db'
  importLine = `import prisma from '@/lib/db';`;
} else {
  // Try to find the named const, e.g. `export const prisma = ...` or `export const db = ...`
  const namedMatch = dbContent.match(/export\s+const\s+(\w+)\s*=/);
  const exportedName = namedMatch ? namedMatch[1] : 'prisma';
  if (exportedName === 'prisma') {
    importLine = `import { prisma } from '@/lib/db';`;
  } else {
    // e.g. exported as `db` — alias it to `prisma` so downstream code (prisma.article...) still works
    importLine = `import { ${exportedName} as prisma } from '@/lib/db';`;
  }
}

console.log('Detected import line:', importLine);

const targets = [
  'src/lib/articles.ts',
  'src/app/api/tools/tech-events/route.ts',
  'src/app/api/admin/articles/[id]/publish/route.ts',
];

for (const file of targets) {
  if (!fs.existsSync(file)) { console.log(`⏭️  Skipped (not found): ${file}`); continue; }
  let content = fs.readFileSync(file, 'utf8');
  const before = content;
  content = content.replace(/import\s+\{?\s*prisma\s*\}?\s+from\s+['"]@\/lib\/prisma['"];?\s*\n/, importLine + '\n');
  if (content !== before) {
    fs.writeFileSync(file, content);
    console.log(`✅ Patched: ${file}`);
  } else {
    console.log(`⚠️  No matching import found to replace in: ${file} — check manually`);
  }
}
