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

patch('src/lib/seoPipelineCore.ts', [
[
`export async function runDiscovery(config: DiscoveryConfig): Promise<DiscoveryRow[]> {`,
`const MONTH_ABBREVIATIONS: Record<string, string> = {
  jan: 'january', feb: 'february', mar: 'march', apr: 'april', jun: 'june',
  jul: 'july', aug: 'august', sep: 'september', sept: 'september',
  oct: 'october', nov: 'november', dec: 'december',
};

// Collapses near-duplicate phrasings of the same underlying question (e.g.
// "how many days till jan 1", "how many days till january 1st", "days until
// january 1") down to one canonical string, so the merge step below can force
// them into the same cluster even when their SERP results happen to differ
// enough to miss clusterBySerpOverlap's overlap threshold. Deliberately only
// strips the handful of interchangeable question-lead-in phrases actually
// seen in this pipeline's keyword shapes -- it is NOT a general paraphrase
// detector, so genuinely different question types (e.g. "what day was it 90
// days ago" vs "how many days ago was") are correctly left unmerged.
function normalizeKeyword(keyword: string): string {
  let kw = keyword.trim().toLowerCase();
  kw = kw.replace(/^(how many (days|weeks|months|years)\\s+(until|till|to|ago\\s+was)\\s*)/, '');
  kw = kw.replace(/^(how long\\s+(until|till|ago\\s+was|ago)\\s*)/, '');
  kw = kw.replace(/^((days|weeks|months|years)\\s+(until|till)\\s*)/, '');
  kw = kw.replace(/\\b(\\d{1,2})(st|nd|rd|th)\\b/g, '$1');
  kw = kw.split(/\\s+/).map(word => MONTH_ABBREVIATIONS[word] ?? word).join(' ');
  return kw.replace(/\\s+/g, ' ').trim();
}

export async function runDiscovery(config: DiscoveryConfig): Promise<DiscoveryRow[]> {`
],
[
`  const clusters = clusterBySerpOverlap(keywordDomains);

  return survivors.map(item => {`,
`  const clusters = clusterBySerpOverlap(keywordDomains);

  // Merge any clusters whose keywords normalize to the same underlying
  // question (see normalizeKeyword above) -- catches near-duplicate phrasings
  // that clusterBySerpOverlap alone misses when their SERP results don't
  // happen to overlap enough (e.g. different top-10 domains for "jan 1" vs
  // "january 1st" despite being the exact same search intent).
  const normalizedGroups: Record<string, number[]> = {};
  for (const item of survivors) {
    const cid = clusters[item.keyword];
    if (cid === undefined) continue;
    const norm = normalizeKeyword(item.keyword);
    (normalizedGroups[norm] ??= []).push(cid);
  }
  const clusterRemap: Record<number, number> = {};
  function resolveClusterId(id: number): number {
    return clusterRemap[id] !== undefined && clusterRemap[id] !== id
      ? (clusterRemap[id] = resolveClusterId(clusterRemap[id]))
      : id;
  }
  for (const norm in normalizedGroups) {
    const ids = Array.from(new Set(normalizedGroups[norm]));
    if (ids.length <= 1) continue;
    const target = Math.min(...ids);
    for (const id of ids) clusterRemap[id] = target;
  }
  for (const kw in clusters) {
    clusters[kw] = resolveClusterId(clusters[kw]);
  }

  return survivors.map(item => {`
]
]);
