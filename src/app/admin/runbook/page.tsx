'use client';
import { useState } from 'react';

// Admin Runbook — client component for tabs

interface Op {
  task: string;
  frequency: string;
  how: string;
  example?: string;
  output: string;
  exampleUrl?: string;
}

const CATEGORIES: { key: string; label: string; ops: Op[] }[] = [
  {
    key: 'content',
    label: 'Content Pipeline',
    ops: [
      {
        task: 'Bump long-tail Event targetDate',
        frequency: 'Per entity, right after THAT entity\'s own date passes (day after Christmas for christmas, day after Easter Sunday for easter, etc.) — not one blanket date for every entity.',
        how: 'Recomputes targetDate via resolveRecurrenceDate() and prints/writes fresh JSON for that one Event row. Paste the output into Admin > Events > Import (it updates the existing row, matched by slug).',
        example: 'npx tsx scripts/generate-longtail-event.ts christmas',
        output: 'Check the terminal output directly after running — this script\'s save location was not confirmed live in this session. If it prints a "Wrote ..." line like the batch script does, that path is where the JSON is; otherwise it likely prints straight to the terminal for you to copy.',
        exampleUrl: 'https://howlonguntilx.com/questions/how-long-until-christmas',
      },
      {
        task: 'Extend yearly batch to a new year',
        frequency: 'Per entity, same trigger as the bump above — right after that entity\'s earliest currently-live year has passed, so the 5-year window ("current year + next 4") keeps rolling forward.',
        how: 'Generates just the next year to top up the window. Confirmed output: a file at generated/<slug>-batch-<startYear>-<endYear>.json in the repo root. Open it, inspect it, then paste its contents into Admin > Events > Import.',
        example: 'npx tsx scripts/generate-yearly-event-batch.ts christmas 2032 1 2031 christmas',
        output: 'generated/christmas-batch-2032-2032.json (repo root — confirmed via live run: "Wrote C:\\xampp\\htdocs\\howlonguntilx\\generated\\easter-batch-2027-2031.json")',
        exampleUrl: 'https://howlonguntilx.com/questions/how-long-until-christmas-2032',
      },
    ],
  },
  {
    key: 'code',
    label: 'Code Verification',
    ops: [
      {
        task: 'tsc --noEmit sanity check',
        frequency: 'After any code patch — always run standalone, never chained with another command in the same line.',
        how: 'Zero output + prompt returns = clean. Any printed line is a real type error to fix before proceeding.',
        example: 'npx tsc --noEmit',
        output: 'No file — prints errors (if any) straight to the terminal.',
      },
      {
        task: 'Verify relatedSlugs cross-links',
        frequency: 'After importing any new batch (yearly or long-tail).',
        how: 'Confirms every generated cross-link entry resolves to a real DB row in both directions.',
        example: 'npx tsx scripts/verify-related-slugs.ts christmas',
        output: 'No file — prints pass/fail per slug straight to the terminal.',
      },
    ],
  },
  {
    key: 'technical-seo',
    label: 'Sitemap & Technical SEO',
    ops: [],
  },
];

export default function AdminRunbookPage() {
  const [active, setActive] = useState(CATEGORIES[0].key);
  const current = CATEGORIES.find(c => c.key === active)!;

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <h1>Manual Operations Runbook</h1>
      <p>Recurring manual tasks for this site. Add a row (or a new tab) here whenever a new manual step gets introduced.</p>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', borderBottom: '1px solid #333' }}>
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setActive(c.key)}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: active === c.key ? '2px solid #BA7517' : '2px solid transparent',
              color: active === c.key ? '#BA7517' : '#999',
              fontWeight: active === c.key ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {current.ops.length === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic' }}>No manual steps documented yet for this category. Add rows to CATEGORIES in this file as they get worked out.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.5rem' }}>Task</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.5rem' }}>When to run it</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.5rem' }}>How</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.5rem' }}>Example command</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.5rem' }}>Where the output goes</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.5rem' }}>Example resulting URL</th>
              </tr>
            </thead>
            <tbody>
              {current.ops.map(op => (
                <tr key={op.task}>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #333', verticalAlign: 'top' }}>{op.task}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #333', verticalAlign: 'top' }}>{op.frequency}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #333', verticalAlign: 'top' }}>{op.how}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #333', verticalAlign: 'top' }}>
                    {op.example && <code style={{ background: '#1a1a1a', padding: '2px 6px', borderRadius: 4 }}>{op.example}</code>}
                  </td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #333', verticalAlign: 'top' }}>{op.output}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #333', verticalAlign: 'top' }}>
                    {op.exampleUrl && <a href={op.exampleUrl} target="_blank" rel="noopener noreferrer">{op.exampleUrl}</a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
