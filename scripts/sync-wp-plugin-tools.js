// FILE: scripts/sync-wp-plugin-tools.js
// Regenerates hlux_available_tools() in the WP plugin from the real
// toolsData.ts + embedRegistry.ts, so the admin table can't drift.
// Run: node scripts/sync-wp-plugin-tools.js
const fs = require('fs');
const path = require('path');

const toolsDataRaw = fs.readFileSync(path.join('src/app/tools/toolsData.ts'), 'utf8');
const registryRaw = fs.readFileSync(path.join('src/lib/embedRegistry.ts'), 'utf8');

const registeredSlugs = [...registryRaw.matchAll(/^\s*'([a-z0-9-]+)':\s*\(\)\s*=>\s*dynamic/gm)].map(m => m[1]);

const toolEntries = [...toolsDataRaw.matchAll(/\{\s*slug:\s*'([a-z0-9-]+)',\s*category:\s*'\w+',\s*\n\s*title:\s*'([^']+)'/g)]
  .map(m => ({ slug: m[1], title: m[2] }))
  .filter(t => registeredSlugs.includes(t.slug));

if (toolEntries.length === 0) {
  console.error('No matching embeddable tools found — check regexes against current file formats before trusting output.');
  process.exit(1);
}

const phpArray = toolEntries.map(t =>
  `        ['slug' => '${t.slug}', 'title' => '${t.title.replace(/'/g, "\\'")}'],`
).join('\n');

const phpPath = 'wordpress-plugin/until-x-tools/until-x-tools.php';
const phpRaw = fs.readFileSync(phpPath, 'utf8');
const blockRegex = /function hlux_available_tools\(\) \{\s*\n\s*return \[\s*\n[\s\S]*?\n\s*\];\s*\n\}/;

if (!blockRegex.test(phpRaw)) {
  console.error('hlux_available_tools() block not found in PHP file — aborting, no changes made.');
  process.exit(1);
}

const newBlock = `function hlux_available_tools() {
    return [
${phpArray}
    ];
}`;

fs.writeFileSync(phpPath, phpRaw.replace(blockRegex, newBlock));
console.log(`Synced ${toolEntries.length} tool(s) into hlux_available_tools().`);
