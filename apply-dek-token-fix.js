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

patch('src/components/articles/ArticleLayout.tsx', [[
`  article.blocks = resolveDynamicTokensDeep(article.blocks);`,
`  article.blocks = resolveDynamicTokensDeep(article.blocks);
  // The dek (shortAnswer) is rendered separately from blocks below, right under
  // the H1 -- it was missed by the blocks-only resolution above, so date-relative
  // shortAnswers were showing raw {{token}} text instead of the live value.
  article.dek = resolveDynamicTokensDeep(article.dek);`
]]);

patch('src/lib/renderArticlePage.tsx', [[
`import { getPublishedArticle } from '@/lib/articles';`,
`import { getPublishedArticle } from '@/lib/articles';
import { resolveDynamicTokensDeep } from '@/lib/dynamicTokens';`
],
[
`export async function generateArticleMetadata(toolSlug: string, articleSlug: string) {
  const article = await getPublishedArticle(toolSlug, articleSlug);
  if (!article) return {};`,
`export async function generateArticleMetadata(toolSlug: string, articleSlug: string) {
  const article = await getPublishedArticle(toolSlug, articleSlug);
  if (!article) return {};
  // Same dek/shortAnswer token gap as ArticleLayout.tsx -- meta description and
  // OpenGraph/Twitter descriptions all read article.dek directly, so a
  // date-relative shortAnswer would otherwise ship raw {{token}} text into
  // search results and social previews.
  article.dek = resolveDynamicTokensDeep(article.dek);`
]]);
