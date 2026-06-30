// Run this AFTER expand15.js if the Live Countdowns section didn't move automatically
// node fix-reorder.js

const fs = require('fs');
const p = 'src/components/premium/panels/OverviewPanel.tsx';
let c = fs.readFileSync(p, 'utf8');

// The "Live countdowns" grid block — find it wherever it is
const LIVE_BLOCK = /(\s*\{timers\.length>0&&\(\s*<div className="mb-6">\s*<p className="text-\[10px\][^}]*Live countdowns[^<]*<\/p>\s*<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sg">\s*\{timers\.map[^}]*<TimerCard[^/]*\/>\}\s*<\/div>\s*<\/div>\s*\)\})/s;

const match = c.match(LIVE_BLOCK);
if (!match) {
  console.log('❌ Could not find Live Countdowns block. Check the file manually.');
  process.exit(1);
}

const liveBlock = match[0];

// Remove it from current position
c = c.replace(liveBlock, '');

// Insert it right after the urgent banner closing }) 
// The urgent banner ends with: )}\n\n      {timers.length>0&&(\n        <div className="grid grid-cols-3
const AFTER_URGENT = `)}

      {timers.length>0&&(
        <div className="grid grid-cols-3`;

const INSERT_TARGET = `)}

      {/* ─ Live countdowns moved here: right after urgent banner ─ */}` + liveBlock + `

      {timers.length>0&&(
        <div className="grid grid-cols-3`;

if (c.includes(AFTER_URGENT)) {
  c = c.replace(AFTER_URGENT, INSERT_TARGET);
  fs.writeFileSync(p, c, 'utf8');
  console.log('✅ Live Countdowns section moved to after urgent banner');
} else {
  console.log('⚠ Could not find insertion point. The section may already be in the right place,');
  console.log('  or OverviewPanel structure differs. Check manually in VS Code.');
  console.log('  Look for "Coming up soon" and place the Live Countdowns div right after it.');
}
