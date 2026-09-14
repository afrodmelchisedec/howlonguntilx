const fs = require('fs');

function patch(file, replacements) {
  const raw = fs.readFileSync(file, 'utf8');
  const hasCRLF = raw.includes('\r\n');
  let content = raw.replace(/\r\n/g, '\n');
  for (const [oldStr, newStr] of replacements) {
    if (!content.includes(oldStr)) throw new Error(`Pattern not found:\n${oldStr.slice(0,80)}...`);
    content = content.replace(oldStr, newStr);
  }
  if (hasCRLF) content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(file, content);
  console.log('Patched', file);
}

patch('src/components/admin/SeoPipelinePanel.tsx', [
[
`    .filter(g => {
      const date = estimateEventDate(g.items[0].keyword);
      if (!date) return false;
      const days = daysBetweenUtc(startOfUtcDay(new Date()), date);
      return days >= 30 && days <= 40;
    })`,
`    .filter(g => {
      const date = estimateEventDate(g.items[0].keyword);
      if (!date) return false;
      const days = daysBetweenUtc(startOfUtcDay(new Date()), date);
      return days >= 30; // no upper bound — anything 30+ days out qualifies
    })`
],
[
`                ? 'No event keywords currently fall in the 30-40 day indexing window (moving-date holidays like Thanksgiving or Easter cannot be auto-detected yet).'`,
`                ? 'No event keywords are 30+ days out yet (moving-date holidays like Thanksgiving or Easter cannot be auto-detected yet).'`
]
]);
