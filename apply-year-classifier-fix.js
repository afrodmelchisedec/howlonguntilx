const fs = require('fs');

function patch(file, replacements) {
  const raw = fs.readFileSync(file, 'utf8');
  const hasCRLF = raw.includes('\r\n');
  let content = raw.replace(/\r\n/g, '\n');
  for (const [oldStr, newStr] of replacements) {
    if (!content.includes(oldStr)) throw new Error(`Pattern not found in ${file}:\n${oldStr.slice(0,80)}...`);
    content = content.replace(oldStr, newStr);
  }
  if (hasCRLF) content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(file, content);
  console.log('Patched', file);
}

patch('src/components/admin/SeoPipelinePanel.tsx', [[
`  const hasTargetYear = /\\b(until|till|to|before)\\s+\\d{4}\\b/i.test(kw);`,
`  const hasTargetYear = /\\b(until|till|to|before)\\s+\\d{4}\\b/i.test(kw)
    || /\\b(ago\\s+was|was|since)\\s+\\d{4}\\b/i.test(kw); // catches "ago was 2020", "since 2020" -- date-anchored, needs live daysSince tokens, not a static Article`
]]);
