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

patch('src/components/admin/SeoPipelinePanel.tsx', [
[
`  async function updateStatus(opportunityId: string, status: SeoOpportunity['status']) {
    const res = await fetch(\`/api/admin/seo/opportunities/\${opportunityId}\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await loadRuns();
  }`,
`  async function updateStatus(opportunityId: string, status: SeoOpportunity['status']) {
    const res = await fetch(\`/api/admin/seo/opportunities/\${opportunityId}\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await loadRuns();
  }

  // Calendar "worked on" checkbox — persists via the existing REVIEWED status
  // rather than a new DB column. Toggles the WHOLE cluster (primary + every
  // supporting keyword merged under it), since "done" means the one article
  // covering all of them is done, not just the primary keyword's own row.
  async function toggleWorked(primary: SeoOpportunity, related: SeoOpportunity[]) {
    const nextStatus: SeoOpportunity['status'] = primary.status === 'REVIEWED' ? 'DISCOVERED' : 'REVIEWED';
    const ids = [primary.id, ...related.map(r => r.id)];
    await Promise.all(ids.map(id =>
      fetch(\`/api/admin/seo/opportunities/\${id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
    ));
    await loadRuns();
  }`
],
[
`                          <div key={primary.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Day {dayNumber}</p>
                                <p className="text-sm font-semibold">{primary.keyword}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Vol {primary.volume} · KD {primary.kd ?? '?'} · Score {primary.opportunityScore} ·{' '}
                                  {contentType === 'event' ? 'Event (dated)' : 'Article (duration/informational)'} ·{' '}
                                  {related.length} supporting keyword{related.length === 1 ? '' : 's'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span`,
`                          <div key={primary.id} className={\`p-4 rounded-xl border bg-white dark:bg-gray-900 \${primary.status === 'REVIEWED' ? 'border-emerald-400 dark:border-emerald-600' : 'border-gray-200 dark:border-gray-800'}\`}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Day {dayNumber}</p>
                                <p className="text-sm font-semibold">{primary.keyword}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Vol {primary.volume} · KD {primary.kd ?? '?'} · Score {primary.opportunityScore} ·{' '}
                                  {contentType === 'event' ? 'Event (dated)' : 'Article (duration/informational)'} ·{' '}
                                  {related.length} supporting keyword{related.length === 1 ? '' : 's'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => toggleWorked(primary, related)}
                                  title={primary.status === 'REVIEWED' ? 'Mark as not worked on' : 'Mark as worked on'}
                                  className={\`w-6 h-6 flex items-center justify-center rounded-full border-2 text-xs font-bold transition-colors \${
                                    primary.status === 'REVIEWED'
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-emerald-400'
                                  }\`}
                                >
                                  ✓
                                </button>
                                <span`
]
]);
