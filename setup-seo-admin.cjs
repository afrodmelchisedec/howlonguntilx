#!/usr/bin/env node
/**
 * setup-seo-admin.cjs
 *
 * Phase 2: SEO admin dashboard backend pieces.
 *   1. Patches src/app/api/admin/events/import/route.ts to accept a shared
 *      bearer token (SEO_PIPELINE_TOKEN) in addition to an ADMIN session,
 *      so the standalone Python pipeline can call it directly.
 *   2. Appends SeoRun / SeoOpportunity / ContentVoice models to
 *      prisma/schema.prisma (idempotent — safe to re-run).
 *
 * Run from the repo root:  node setup-seo-admin.cjs
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = process.cwd();

const OLD_AUTH_FN = "async function isAdmin() {\n  const s = await getServerSession(authOptions);\n  return s?.user?.role === 'ADMIN' ? s : null;\n}";
const NEW_AUTH_FN = "async function isAdmin(req: NextRequest) {\n  // Allow server-to-server calls (the SEO pipeline script, or the admin\n  // dashboard's own server actions) via a shared secret, in addition to a\n  // real ADMIN browser session. Never accept the token over a non-HTTPS\n  // origin in production \u2014 set SEO_PIPELINE_TOKEN in .env.local only.\n  const token = req.headers.get('authorization')?.replace(/^Bearer\\s+/i, '');\n  if (token && process.env.SEO_PIPELINE_TOKEN && token === process.env.SEO_PIPELINE_TOKEN) {\n    return { user: { role: 'ADMIN', id: 'seo-pipeline', name: 'SEO Pipeline' } };\n  }\n  const s = await getServerSession(authOptions);\n  return s?.user?.role === 'ADMIN' ? s : null;\n}";
const OLD_CALL = "  const session = await isAdmin();";
const NEW_CALL = "  const session = await isAdmin(req);";
const PRISMA_ADDITIONS = "\n// \u2500\u2500 SEO_ADMIN_MODELS (added by setup-seo-admin.cjs) \u2500\u2500\nenum SeoOpportunityStatus {\n  DISCOVERED\n  REVIEWED\n  APPROVED\n  REJECTED\n  PUBLISHED\n}\n\nmodel SeoRun {\n  id            String           @id @default(cuid())\n  seed          String\n  country       String\n  language      String\n  minVolume     Int\n  maxKd         Int\n  startedAt     DateTime         @default(now())\n  finishedAt    DateTime?\n  status        String           @default(\"running\") // running | completed | failed\n  errorMessage  String?\n  triggeredBy   String? // \"dashboard\" | \"cli\"\n  opportunities SeoOpportunity[]\n}\n\nmodel SeoOpportunity {\n  id               String                @id @default(cuid())\n  runId            String\n  run              SeoRun                @relation(fields: [runId], references: [id])\n  keyword          String\n  volume           Int\n  kd               Int?\n  trend            String? // up | flat | down | ?\n  opportunityScore Float\n  template         String? // e.g. \"days-until\"\n  entity           String?\n  clusterKey       String?\n  status           SeoOpportunityStatus  @default(DISCOVERED)\n  eventSlug        String? // set once mapped to a published Event\n  reviewNotes      String?\n  createdAt        DateTime              @default(now())\n  updatedAt        DateTime              @updatedAt\n\n  @@index([runId])\n  @@unique([runId, keyword])\n}\n\nmodel ContentVoice {\n  id           String   @id @default(cuid())\n  name         String   @default(\"default\")\n  description  String? // internal note, e.g. \"warm, concise, no fluff\"\n  systemPrompt String   @db.Text // injected into every AI content-generation call\n  active       Boolean  @default(true)\n  createdAt    DateTime @default(now())\n  updatedAt    DateTime @updatedAt\n}\n";
const ENV_BLOCK = "\n# \u2500\u2500 SEO admin dashboard (bearer token) \u2014 added by setup-seo-admin.cjs \u2500\u2500\n# Used by src/app/api/admin/events/import/route.ts to authenticate\n# server-to-server calls (the Python pipeline, or a future dashboard\n# server action) without a browser session. Add the SAME name (with\n# the real generated value) to Netlify -> Site settings -> Environment\n# variables for any deployed/server-triggered run.\nSEO_PIPELINE_TOKEN=\n";

function patchFile(relPath, oldStr, newStr, label) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) {
    console.log(`  SKIP  (${relPath} not found)`);
    return;
  }
  const content = fs.readFileSync(abs, "utf8");
  if (content.includes(newStr)) {
    console.log(`  SKIP  (already patched) ${label}`);
    return;
  }
  if (!content.includes(oldStr)) {
    console.log(`  MANUAL NEEDED — could not find expected text for "${label}" in ${relPath}.`);
    console.log(`  The file may have changed since this script was written. Apply this diff by hand:`);
    console.log(`  --- OLD ---\n${oldStr}\n  --- NEW ---\n${newStr}\n`);
    return;
  }
  fs.writeFileSync(abs, content.replace(oldStr, newStr), "utf8");
  console.log(`  PATCHED ${label} in ${relPath}`);
}

function appendOnceToFile(relPath, marker, block, header = "") {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) {
    console.log(`  SKIP  (${relPath} not found)`);
    return;
  }
  const current = fs.readFileSync(abs, "utf8");
  if (current.includes(marker)) {
    console.log(`  SKIP  (already present) ${relPath}`);
    return;
  }
  fs.appendFileSync(abs, (header ? "\n" + header + "\n" : "") + block + "\n", "utf8");
  console.log(`  APPEND ${relPath}`);
}

console.log("Patching events/import route for token-based (pipeline) auth...");
patchFile(
  "src/app/api/admin/events/import/route.ts",
  OLD_AUTH_FN,
  NEW_AUTH_FN,
  "isAdmin() -> isAdmin(req) [accepts SEO_PIPELINE_TOKEN]"
);
patchFile(
  "src/app/api/admin/events/import/route.ts",
  OLD_CALL,
  NEW_CALL,
  "isAdmin() call site -> isAdmin(req)"
);

console.log("\nUpdating prisma/schema.prisma...");
appendOnceToFile("prisma/schema.prisma", "SEO_ADMIN_MODELS", PRISMA_ADDITIONS);

console.log("\nUpdating .env.example...");
if (!fs.existsSync(path.join(ROOT, ".env.example"))) {
  fs.writeFileSync(path.join(ROOT, ".env.example"), "", "utf8");
}
appendOnceToFile(".env.example", "SEO admin dashboard (bearer token)", ENV_BLOCK.trim());

const generatedToken = crypto.randomBytes(32).toString("hex");
console.log("\nGenerated token (put this in .env.local, NOT .env.example):");
console.log("  " + generatedToken);

console.log("\nNext steps:");
console.log("  1. In .env.local, add:  SEO_PIPELINE_TOKEN=" + generatedToken);
console.log("  2. In Netlify -> Site settings -> Environment variables, add the SAME");
console.log("     variable name (SEO_PIPELINE_TOKEN) with the SAME value, for any");
console.log("     deployed/server-triggered run. Also add DATAFORSEO_LOGIN /");
console.log("     DATAFORSEO_PASSWORD there if you haven't already (see .env.example).");
console.log("  3. npx prisma migrate dev --name add_seo_pipeline_models");
console.log("  4. Manually re-check src/app/api/admin/events/import/route.ts if any step above");
console.log("     printed 'MANUAL NEEDED' — the file differs from what this script expected.");
