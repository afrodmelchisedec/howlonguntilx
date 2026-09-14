const fs = require('fs');

function patch(file, replacements) {
  const raw = fs.readFileSync(file, 'utf8');
  const hasCRLF = raw.includes('\r\n');
  let content = raw.replace(/\r\n/g, '\n');
  for (const [oldStr, newStr] of replacements) {
    if (!content.includes(oldStr)) throw new Error(`Pattern not found in ${file}:\n${oldStr.slice(0,80)}...`);
    content = content.split(oldStr).join(newStr);
  }
  if (hasCRLF) content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(file, content);
  console.log('Patched', file);
}

patch('src/components/admin/SeoPipelinePanel.tsx', [
[
`function formatCategoryOptionsList(categoryOptions: CategoryOption[]): string {
  if (!categoryOptions || categoryOptions.length === 0) {
    return '(category list failed to load in the admin panel -- retry loading it there before publishing; do not guess a slug)';
  }
  return categoryOptions
    .map(c => (c.parentId ? '  ' : '') + c.slug + '  --  ' + c.name)
    .join('\\n');
}`,
`function formatCategoryOptionsList(categoryOptions: { slug: string; label: string }[]): string {
  if (!categoryOptions || categoryOptions.length === 0) {
    return '(category list failed to load in the admin panel -- retry loading it there before publishing; do not guess a slug)';
  }
  return categoryOptions
    .map(c => c.slug + '  --  ' + c.label)
    .join('\\n');
}`
],
[
`  voice: { name: string; systemPrompt: string } | null,
  categoryOptions: CategoryOption[]
): string {`,
`  voice: { name: string; systemPrompt: string } | null,
  categoryOptions: { slug: string; label: string }[]
): string {`
]
]);
