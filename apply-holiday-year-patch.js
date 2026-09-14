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

patch('src/components/admin/SeoPipelinePanel.tsx', [[
`  for (const h of FIXED_HOLIDAYS) {
    if (h.regex.test(kw)) return nextOccurrence(h.month, h.day, now);
  }`,
`  for (const h of FIXED_HOLIDAYS) {
    if (h.regex.test(kw)) {
      const explicitYear = kw.match(/\\b(20\\d{2})\\b/);
      if (explicitYear) return new Date(Date.UTC(parseInt(explicitYear[1], 10), h.month - 1, h.day));
      return nextOccurrence(h.month, h.day, now);
    }
  }`
]]);
