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

patch('src/lib/seoPipelineCore.ts', [[
`  const survivors = ideas
    .filter(i => i.volume >= config.minVolume && (i.kd === null || i.kd <= config.maxKd))
    .sort((a, b) => b.volume - a.volume);`,
`  const survivors = ideas
    .filter(i => i.volume >= config.minVolume && (i.kd === null || i.kd <= config.maxKd))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 100); // hard cap: discovery results never exceed 100 keywords/run`
]]);

patch('src/components/admin/SeoPipelinePanel.tsx', [
[
`const [view, setView] = useState<'discovery' | 'calendar'>('discovery');`,
`const [view, setView] = useState<'discovery' | 'calendar-event' | 'calendar-article'>('discovery');`
],
[
`  // One cluster per day for 7 days — skips anything already rejected or
  // published, since those don't need a brief written for them.
  const calendarDays = clusteredGroups
    .filter(g => g.items[0].status !== 'REJECTED' && g.items[0].status !== 'PUBLISHED')
    .slice(0, 30)
    .map((g, idx) => ({
      dayNumber: idx + 1,
      primary: g.items[0],
      related: g.items.slice(1),
    }));`,
`  // Eligible clusters (not rejected/published), split by content type so the
  // Event and Article calendars are independent 30-day sequences.
  const eligibleGroups = clusteredGroups
    .filter(g => g.items[0].status !== 'REJECTED' && g.items[0].status !== 'PUBLISHED');

  const eventCalendarDays = eligibleGroups
    .filter(g => classifyContentType(g.items[0]) === 'event')
    .slice(0, 30)
    .map((g, idx) => ({ dayNumber: idx + 1, primary: g.items[0], related: g.items.slice(1) }));

  const articleCalendarDays = eligibleGroups
    .filter(g => classifyContentType(g.items[0]) === 'article')
    .slice(0, 30)
    .map((g, idx) => ({ dayNumber: idx + 1, primary: g.items[0], related: g.items.slice(1) }));

  const calendarDays = view === 'calendar-article' ? articleCalendarDays : eventCalendarDays;`
],
[
`        <button onClick={() => setView('calendar')}
          className={'px-3 py-1.5 rounded-lg text-sm font-medium ' + (
            view === 'calendar' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          )}>
          30-Day Content Calendar
        </button>`,
`        <button onClick={() => setView('calendar-event')}
          className={'px-3 py-1.5 rounded-lg text-sm font-medium ' + (
            view === 'calendar-event' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          )}>
          30-Day Content Calendar (Events)
        </button>
        <button onClick={() => setView('calendar-article')}
          className={'px-3 py-1.5 rounded-lg text-sm font-medium ' + (
            view === 'calendar-article' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          )}>
          30-Day Content Calendar (Article)
        </button>`
],
[
`      {view === 'calendar' && (`,
`      {(view === 'calendar-event' || view === 'calendar-article') && (`
]
]);
