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

  return survivors.map(item => {`,
`  const clusters = clusterBySerpOverlap(keywordDomains);

  // Two-signal clustering over EVERY survivor, not just the cost-capped
  // handful clusterBySerpOverlap actually analyzed (SERP calls are expensive,
  // so only the top maxSerpCalls highest-volume keywords ever get a SERP-based
  // cluster id -- everything below that cap previously fell through as its
  // own solo "cluster" even when it was an obvious duplicate of something
  // higher up, e.g. "jan 1" / "january 1" / "january 1st" all landing past
  // the SERP-analysis cutoff). Union-find over two signals: (a) identical
  // normalized text -- always available, no SERP cost; (b) shared SERP
  // cluster id -- catches genuinely different phrasings whose search results
  // happen to overlap, still useful as a secondary signal where it exists.
  const uf: Record<string, string> = {};
  function find(x: string): string {
    if (uf[x] === undefined) uf[x] = x;
    return uf[x] === x ? x : (uf[x] = find(uf[x]));
  }
  function union(a: string, b: string) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) uf[ra] = rb;
  }

  const serpClusterToNorms: Record<number, Set<string>> = {};
  for (const item of survivors) {
    const norm = normalizeKeyword(item.keyword);
    find(norm); // seed every normalized group, even ones with no SERP data
    const cid = clusters[item.keyword];
    if (cid === undefined) continue;
    (serpClusterToNorms[cid] ??= new Set()).add(norm);
  }
  for (const cid in serpClusterToNorms) {
    const norms = Array.from(serpClusterToNorms[cid]);
    for (let i = 1; i < norms.length; i++) union(norms[0], norms[i]);
  }

  const finalClusterKeyOf: Record<string, string> = {};
  for (const item of survivors) {
    const norm = normalizeKeyword(item.keyword);
    finalClusterKeyOf[item.keyword] = 'g' + find(norm).replace(/[^a-z0-9]+/g, '-');
  }

  return survivors.map(item => {`
],
[
`      clusterKey: clusters[item.keyword] !== undefined ? \`c\${clusters[item.keyword]}\` : '',`,
`      clusterKey: finalClusterKeyOf[item.keyword] || '',`
]
]);
