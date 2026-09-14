const fs = require('fs');

function patch(file, replacements) {
  const raw = fs.readFileSync(file, 'utf8');
  const hasCRLF = raw.includes('\r\n');
  let content = raw.replace(/\r\n/g, '\n');
  for (const [oldStr, newStr] of replacements) {
    if (!content.includes(oldStr)) throw new Error(`Pattern not found in ${file}:\n${oldStr.slice(0,80)}...`);
    content = content.split(oldStr).join(newStr); // split/join = replace ALL occurrences, not just the first
  }
  if (hasCRLF) content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(file, content);
  console.log('Patched', file);
}

patch('src/components/admin/SeoPipelinePanel.tsx', [
[
`function buildContentBrief(
  primary: SeoOpportunity,
  related: SeoOpportunity[],
  dayNumber: number,
  voice: { name: string; systemPrompt: string } | null
): string {
  const contentType = classifyContentType(primary);
  const evergreen = contentType === 'event' ? evergreenRecurrenceKey(primary.keyword) : null;
  const schema = contentType === 'event' ? (evergreen ? EVENT_EVERGREEN_SCHEMA_BLOCK : EVENT_SCHEMA_BLOCK) : ARTICLE_SCHEMA_BLOCK;
  const seoChecklist = contentType === 'event' ? EVENT_SEO_CHECKLIST : ARTICLE_SEO_CHECKLIST;`,
`// Formats the SAME categoryOptions state the Publish modal's dropdown already
// uses, so the brief always lists whatever is actually in the categories
// table right now -- no separate hardcoded list to fall out of sync with it.
function formatCategoryOptionsList(categoryOptions: CategoryOption[]): string {
  if (!categoryOptions || categoryOptions.length === 0) {
    return '(category list failed to load in the admin panel -- retry loading it there before publishing; do not guess a slug)';
  }
  return categoryOptions
    .map(c => (c.parentId ? '  ' : '') + c.slug + '  --  ' + c.name)
    .join('\\n');
}

function buildContentBrief(
  primary: SeoOpportunity,
  related: SeoOpportunity[],
  dayNumber: number,
  voice: { name: string; systemPrompt: string } | null,
  categoryOptions: CategoryOption[]
): string {
  const contentType = classifyContentType(primary);
  const evergreen = contentType === 'event' ? evergreenRecurrenceKey(primary.keyword) : null;
  const schema = contentType === 'event' ? (evergreen ? EVENT_EVERGREEN_SCHEMA_BLOCK : EVENT_SCHEMA_BLOCK) : ARTICLE_SCHEMA_BLOCK;
  const seoChecklist = contentType === 'event' ? EVENT_SEO_CHECKLIST : ARTICLE_SEO_CHECKLIST;
  const categorySlugList = formatCategoryOptionsList(categoryOptions);`
],
[
`  '    "categorySlug": "one of the site\\'s existing category slugs (ask if unsure)",',`,
`  '    "categorySlug": "must exactly match one slug from the VALID CATEGORY SLUGS list above",',`
],
[
`    ...(contentType === 'event' ? EVENT_DYNAMIC_TOKENS_BLOCK : ARTICLE_DYNAMIC_TOKENS_CAVEAT),
    '',
    ...(evergreen ? buildEvergreenInstructions(evergreen.recurrenceKey, evergreen.entityLabel) : []),
    '',
    ...seoChecklist,`,
`    'VALID CATEGORY SLUGS (categorySlug must be EXACTLY one of these -- anything else is rejected on import)',
    '-'.repeat(60),
    categorySlugList,
    '',
    ...(contentType === 'event' ? EVENT_DYNAMIC_TOKENS_BLOCK : ARTICLE_DYNAMIC_TOKENS_CAVEAT),
    '',
    ...(evergreen ? buildEvergreenInstructions(evergreen.recurrenceKey, evergreen.entityLabel) : []),
    '',
    ...seoChecklist,`
],
[
`const brief = buildContentBrief(primary, related, dayNumber, voice);`,
`const brief = buildContentBrief(primary, related, dayNumber, voice, categoryOptions);`
]
]);
