#!/usr/bin/env node
/**
 * fix-isadmin.cjs
 *
 * One-shot fix: your isAdmin() function still takes zero parameters, but
 * the call site (already patched) calls isAdmin(req) — a TS compile error.
 * This adds the missing `req: NextRequest` parameter and the bearer-token
 * check, matched against your file's exact current content (no blank-line
 * assumptions this time). Safe to re-run — no-ops if already fixed.
 *
 * Run from the repo root: node fix-isadmin.cjs
 */

const fs = require("fs");
const path = require("path");

const FILE = path.join(process.cwd(), "src/app/api/admin/events/import/route.ts");

if (!fs.existsSync(FILE)) {
  console.error(`Not found: ${FILE} — run this from the repo root.`);
  process.exit(1);
}

const content = fs.readFileSync(FILE, "utf8");

if (content.includes("SEO_PIPELINE_TOKEN")) {
  console.log("Already fixed — nothing to do.");
  process.exit(0);
}

// Windows-checked-out files are usually CRLF; build the match/replacement
// text using whatever line ending this file actually has, so the exact
// string comparison doesn't silently fail on \r\n vs \n.
const eol = content.includes("\r\n") ? "\r\n" : "\n";

const OLD_LINES = [
  "async function isAdmin() {",
  "  const s = await getServerSession(authOptions);",
  "  return s?.user?.role === 'ADMIN' ? s : null;",
  "}",
];

const NEW_LINES = [
  "async function isAdmin(req: NextRequest) {",
  "  // Allow server-to-server calls (the SEO pipeline script, or the admin",
  "  // dashboard's own server actions) via a shared secret, in addition to a",
  "  // real ADMIN browser session. Never accept the token over a non-HTTPS",
  "  // origin in production — set SEO_PIPELINE_TOKEN in .env.local only.",
  "  const token = req.headers.get('authorization')?.replace(/^Bearer\\s+/i, '');",
  "  if (token && process.env.SEO_PIPELINE_TOKEN && token === process.env.SEO_PIPELINE_TOKEN) {",
  "    return { user: { role: 'ADMIN', id: 'seo-pipeline', name: 'SEO Pipeline' } };",
  "  }",
  "  const s = await getServerSession(authOptions);",
  "  return s?.user?.role === 'ADMIN' ? s : null;",
  "}",
];

const OLD_FN = OLD_LINES.join(eol);
const NEW_FN = NEW_LINES.join(eol);

const count = content.split(OLD_FN).length - 1;
if (count !== 1) {
  console.error(
    `Expected exactly 1 match for the old isAdmin() function, found ${count} ` +
    `(checked against ${eol === "\r\n" ? "CRLF" : "LF"} line endings).\n` +
    `The file has changed again since this script was written — paste the current\n` +
    `content back in chat rather than risk a wrong patch.`
  );
  process.exit(1);
}

fs.writeFileSync(FILE, content.replace(OLD_FN, NEW_FN), "utf8");
console.log(`Patched ${FILE}`);
console.log("isAdmin(req) now matches its call site — the TS error should be gone.");
