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
`interface SeoOpportunity {
  id: string;
  keyword: string;
  volume: number;
  kd: number | null;
  trend: string | null;
  opportunityScore: number;
  template: string | null;
  entity: string | null;
  clusterKey: string | null;
  status: 'DISCOVERED' | 'REVIEWED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  eventSlug: string | null;
  reviewNotes: string | null;
}`,
`interface SeoOpportunity {
  id: string;
  keyword: string;
  volume: number;
  kd: number | null;
  trend: string | null;
  opportunityScore: number;
  template: string | null;
  entity: string | null;
  clusterKey: string | null;
  status: 'DISCOVERED' | 'REVIEWED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  eventSlug: string | null;
  reviewNotes: string | null;
  updatedAt: string;
}`
],
[
`function scoreBadge(score: number) {
  const color = score >= 80 ? '#1D9E75' : score >= 60 ? '#BA7517' : '#94A3B8';
  return (
    <span
      className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: color + '22', color }}
    >
      {score.toFixed(1)}
    </span>
  );
}`,
`function scoreBadge(score: number) {
  const color = score >= 80 ? '#1D9E75' : score >= 60 ? '#BA7517' : '#94A3B8';
  return (
    <span
      className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: color + '22', color }}
    >
      {score.toFixed(1)}
    </span>
  );
}

// "Marked done" caption for the calendar checkbox — reads off the existing
// updatedAt column, which the REVIEWED-status PATCH already bumps, so no new
// DB field is needed. Note: updatedAt also moves on Approve/Reject/Publish,
// so this reflects "last status change", not strictly "last time this box
// was checked" if those other actions happen afterward too.
function formatWorkedTimestamp(iso: string): string {
  const d = new Date(iso);
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  const rel = diffSec < 60 ? \`\${diffSec}s ago\`
    : diffSec < 3600 ? \`\${Math.floor(diffSec / 60)}m ago\`
    : diffSec < 86400 ? \`\${Math.floor(diffSec / 3600)}h ago\`
    : \`\${Math.floor(diffSec / 86400)}d ago\`;
  return \`Marked done \${dateStr} (\${rel})\`;
}`
],
[
`                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => toggleWorked(primary, related)}`,
`                              <div className="flex items-center gap-2 flex-shrink-0">
                                {primary.status === 'REVIEWED' && primary.updatedAt && (
                                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                    {formatWorkedTimestamp(primary.updatedAt)}
                                  </span>
                                )}
                                <button
                                  onClick={() => toggleWorked(primary, related)}`
]
]);
