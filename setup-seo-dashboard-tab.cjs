#!/usr/bin/env node
/**
 * setup-seo-dashboard-tab.cjs
 *
 * Adds a "SEO Pipeline" tab to src/app/users/AdminClient.tsx: the Tab type,
 * TAB_ICONS, TAB_LABELS, TAB_ACCESS entries, and the render block. Five
 * independent, exact-match, CRLF-aware patches — each is skipped safely if
 * already applied, and the whole thing is a no-op on re-run.
 *
 * Does NOT add the import line for SeoPipelinePanel — add this yourself
 * near your other imports, since this script doesn't know your import
 * block's exact current text:
 *
 *   import { SeoPipelinePanel } from '@/components/admin/SeoPipelinePanel';
 *
 * Run from the repo root: node setup-seo-dashboard-tab.cjs
 */

const fs = require("fs");
const path = require("path");

const FILE = path.join(process.cwd(), "src/app/users/AdminClient.tsx");

if (!fs.existsSync(FILE)) {
  console.error(`Not found: ${FILE} — run this from the repo root.`);
  process.exit(1);
}

let content = fs.readFileSync(FILE, "utf8");
const eol = content.includes("\r\n") ? "\r\n" : "\n";
const j = (lines) => lines.join(eol);

let anyFailed = false;

function patch(label, oldLines, newLines) {
  const oldStr = j(oldLines);
  const newStr = j(newLines);
  if (content.includes(newStr)) {
    console.log(`  SKIP  (already applied) ${label}`);
    return;
  }
  const count = content.split(oldStr).length - 1;
  if (count !== 1) {
    console.error(`  MANUAL NEEDED — "${label}": expected 1 match, found ${count}.`);
    console.error(`    --- looking for ---\n${oldStr}\n`);
    anyFailed = true;
    return;
  }
  content = content.replace(oldStr, newStr);
  console.log(`  PATCHED ${label}`);
}

console.log("Patching AdminClient.tsx...");

patch(
  "Tab type union",
  ["type Tab = 'overview' | 'myEvents' | 'worldEvents' | 'users' | 'subscribers' | 'apiUsers' | 'longevity' | 'events' | 'articles' | 'categories' | 'affiliateBanners' | 'leadMagnet' | 'reviewers' | 'calendarEvents' | 'userEvents' | 'comments' | 'defaultFollow'| 'reviews';"],
  ["type Tab = 'overview' | 'myEvents' | 'worldEvents' | 'users' | 'subscribers' | 'apiUsers' | 'longevity' | 'events' | 'articles' | 'categories' | 'affiliateBanners' | 'leadMagnet' | 'reviewers' | 'calendarEvents' | 'userEvents' | 'comments' | 'defaultFollow'| 'reviews' | 'seoPipeline';"]
);

patch(
  "TAB_ICONS entry",
  ["  calendarEvents: '\uD83D\uDDD3\uFE0F', reviews: '\u2B50',", "};"],
  ["  calendarEvents: '\uD83D\uDDD3\uFE0F', reviews: '\u2B50',", "  seoPipeline: '\uD83D\uDE80',", "};"]
);

patch(
  "TAB_LABELS entry",
  ["  userEvents: 'Community events', comments: 'Comments',", "};"],
  ["  userEvents: 'Community events', comments: 'Comments',", "  seoPipeline: 'SEO Pipeline',", "};"]
);

patch(
  "TAB_ACCESS entry",
  ["  reviews:          { roles: ['ADMIN'] },", "};"],
  ["  reviews:          { roles: ['ADMIN'] },", "  seoPipeline:      { roles: ['ADMIN'] },", "};"]
);

patch(
  "render block",
  ["        {/* EVENTS */}", "        {tab === 'events' && ("],
  [
    "        {/* SEO PIPELINE */}",
    "        {tab === 'seoPipeline' && (",
    "          <SeoPipelinePanel />",
    "        )}",
    "",
    "        {/* EVENTS */}",
    "        {tab === 'events' && (",
  ]
);

if (anyFailed) {
  console.error("\nOne or more patches need manual application (see MANUAL NEEDED above).");
  console.error("Nothing was written for those — but any patch that DID succeed above was saved.");
}

fs.writeFileSync(FILE, content, "utf8");
console.log("\nDone. Remember to add this import near the top of the file:");
console.log("  import { SeoPipelinePanel } from '@/components/admin/SeoPipelinePanel';");
