#!/usr/bin/env node
/**
 * One-shot setup: creates an iOS-style ConfirmDialog component and wires it
 * into AdminClient.tsx (auto-discovered), replacing every native
 * window.confirm() delete prompt (users, events, bulk events, articles, reviews).
 *
 * Run from your project root:
 *   node apply-confirm-dialog.js
 */
const fs = require('fs');
const path = require('path');

const COMPONENT_PATH = path.join('src', 'components', 'ui', 'ConfirmDialog.tsx');
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'out', '.turbo', '.vercel']);

function fail(msg) {
  console.error('✖ ' + msg);
  process.exit(1);
}

// Auto-discover AdminClient.tsx anywhere under the current directory, since
// its exact path can vary between projects (e.g. src/app/admin vs src/app/users).
function findFile(dir, filename, results) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      findFile(path.join(dir, entry.name), filename, results);
    } else if (entry.name === filename) {
      results.push(path.join(dir, entry.name));
    }
  }
}

const matches = [];
findFile('.', 'AdminClient.tsx', matches);

let ADMIN_CLIENT;
if (matches.length === 0) {
  fail('Could not find AdminClient.tsx anywhere under the current directory. Run this script from your project root.');
} else if (matches.length === 1) {
  ADMIN_CLIENT = matches[0];
  console.log(`✔ Found ${ADMIN_CLIENT}`);
} else {
  console.error('✖ Found multiple AdminClient.tsx files — not sure which to patch:');
  matches.forEach(m => console.error('    ' + m));
  console.error('Set ADMIN_CLIENT_PATH env var to the correct one and re-run, e.g.:');
  console.error(`  ADMIN_CLIENT_PATH="${matches[0]}" node apply-confirm-dialog.js`);
  process.exit(1);
}
if (process.env.ADMIN_CLIENT_PATH) {
  ADMIN_CLIENT = process.env.ADMIN_CLIENT_PATH;
  if (!fs.existsSync(ADMIN_CLIENT)) fail(`ADMIN_CLIENT_PATH does not exist: ${ADMIN_CLIENT}`);
}

// ---------------------------------------------------------------------------
// 1. Write the ConfirmDialog component (base64-embedded to avoid any escaping
//    issues with the template literals / JSX it contains).
// ---------------------------------------------------------------------------
const COMPONENT_B64 = "J3VzZSBjbGllbnQnOwoKaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JzsKaW1wb3J0IHsgY3JlYXRlUG9ydGFsIH0gZnJvbSAncmVhY3QtZG9tJzsKCmV4cG9ydCB0eXBlIENvbmZpcm1EaWFsb2dTdGF0ZSA9IHsKICB0aXRsZTogc3RyaW5nOwogIG1lc3NhZ2U6IHN0cmluZzsKICBjb25maXJtTGFiZWw/OiBzdHJpbmc7CiAgY2FuY2VsTGFiZWw/OiBzdHJpbmc7CiAgZGVzdHJ1Y3RpdmU/OiBib29sZWFuOwogIG9uQ29uZmlybTogKCkgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47Cn0gfCBudWxsOwoKZXhwb3J0IGZ1bmN0aW9uIENvbmZpcm1EaWFsb2coewogIHN0YXRlLAogIG9uQ2xvc2UsCn06IHsKICBzdGF0ZTogQ29uZmlybURpYWxvZ1N0YXRlOwogIG9uQ2xvc2U6ICgpID0+IHZvaWQ7Cn0pIHsKICBjb25zdCBbdmlzaWJsZSwgc2V0VmlzaWJsZV0gPSB1c2VTdGF0ZShmYWxzZSk7CiAgY29uc3QgW2J1c3ksIHNldEJ1c3ldID0gdXNlU3RhdGUoZmFsc2UpOwoKICAvLyBEcml2ZSB0aGUgZW50ZXIvZXhpdCB0cmFuc2l0aW9uIG9mZiBhIHJBRiBzbyB0aGUgaW5pdGlhbCBtb3VudAogIC8vIHBhaW50cyBhdCBzY2FsZS9vcGFjaXR5IDAgYmVmb3JlIHdlIGFuaW1hdGUgdG8gMS4KICB1c2VFZmZlY3QoKCkgPT4gewogICAgaWYgKHN0YXRlKSB7CiAgICAgIHNldEJ1c3koZmFsc2UpOwogICAgICBjb25zdCByYWYgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gc2V0VmlzaWJsZSh0cnVlKSk7CiAgICAgIHJldHVybiAoKSA9PiBjYW5jZWxBbmltYXRpb25GcmFtZShyYWYpOwogICAgfSBlbHNlIHsKICAgICAgc2V0VmlzaWJsZShmYWxzZSk7CiAgICB9CiAgfSwgW3N0YXRlXSk7CgogIHVzZUVmZmVjdCgoKSA9PiB7CiAgICBpZiAoIXN0YXRlKSByZXR1cm47CiAgICBmdW5jdGlvbiBvbktleURvd24oZTogS2V5Ym9hcmRFdmVudCkgewogICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnICYmICFidXN5KSBvbkNsb3NlKCk7CiAgICB9CiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5RG93bik7CiAgICByZXR1cm4gKCkgPT4gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleURvd24pOwogIH0sIFtzdGF0ZSwgYnVzeSwgb25DbG9zZV0pOwoKICBpZiAoIXN0YXRlIHx8IHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybiBudWxsOwoKICBhc3luYyBmdW5jdGlvbiBoYW5kbGVDb25maXJtKCkgewogICAgaWYgKCFzdGF0ZSkgcmV0dXJuOwogICAgdHJ5IHsKICAgICAgc2V0QnVzeSh0cnVlKTsKICAgICAgYXdhaXQgc3RhdGUub25Db25maXJtKCk7CiAgICB9IGZpbmFsbHkgewogICAgICBvbkNsb3NlKCk7CiAgICB9CiAgfQoKICByZXR1cm4gY3JlYXRlUG9ydGFsKAogICAgPGRpdgogICAgICBjbGFzc05hbWU9ImZpeGVkIGluc2V0LTAgei1bOTk5OV0gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcHgtNiIKICAgICAgcm9sZT0iYWxlcnRkaWFsb2ciCiAgICAgIGFyaWEtbW9kYWw9InRydWUiCiAgICAgIGFyaWEtbGFiZWxsZWRieT0iY29uZmlybS1kaWFsb2ctdGl0bGUiCiAgICAgIGFyaWEtZGVzY3JpYmVkYnk9ImNvbmZpcm0tZGlhbG9nLW1lc3NhZ2UiCiAgICA+CiAgICAgIHsvKiBCYWNrZHJvcCAqL30KICAgICAgPGRpdgogICAgICAgIGNsYXNzTmFtZT0iYWJzb2x1dGUgaW5zZXQtMCBiZy1ibGFjay80MCBiYWNrZHJvcC1ibHVyLVsycHhdIHRyYW5zaXRpb24tb3BhY2l0eSBkdXJhdGlvbi0yMDAiCiAgICAgICAgc3R5bGU9e3sgb3BhY2l0eTogdmlzaWJsZSA/IDEgOiAwIH19CiAgICAgIC8+CgogICAgICB7LyogQ2FyZCAqL30KICAgICAgPGRpdgogICAgICAgIGNsYXNzTmFtZT0icmVsYXRpdmUgdy1mdWxsIG1heC13LVszMDBweF0gb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQtMnhsIGJvcmRlciBib3JkZXItYmxhY2svNSBkYXJrOmJvcmRlci13aGl0ZS8xMCBiZy13aGl0ZS85MCBkYXJrOmJnLWdyYXktOTAwLzkwIGJhY2tkcm9wLWJsdXIteGwgc2hhZG93LTJ4bCB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0yMDAgZWFzZS1vdXQiCiAgICAgICAgc3R5bGU9e3sKICAgICAgICAgIG9wYWNpdHk6IHZpc2libGUgPyAxIDogMCwKICAgICAgICAgIHRyYW5zZm9ybTogdmlzaWJsZSA/ICdzY2FsZSgxKScgOiAnc2NhbGUoMS4wNiknLAogICAgICAgIH19CiAgICAgID4KICAgICAgICA8ZGl2IGNsYXNzTmFtZT0icHgtNSBwdC01IHBiLTQgdGV4dC1jZW50ZXIiPgogICAgICAgICAgPHAgaWQ9ImNvbmZpcm0tZGlhbG9nLXRpdGxlIiBjbGFzc05hbWU9InRleHQtWzE1cHhdIGZvbnQtc2VtaWJvbGQgdGV4dC1ncmF5LTkwMCBkYXJrOnRleHQtZ3JheS0xMDAiPgogICAgICAgICAgICB7c3RhdGUudGl0bGV9CiAgICAgICAgICA8L3A+CiAgICAgICAgICA8cCBpZD0iY29uZmlybS1kaWFsb2ctbWVzc2FnZSIgY2xhc3NOYW1lPSJtdC0xLjUgdGV4dC1bMTNweF0gbGVhZGluZy1zbnVnIHRleHQtZ3JheS01MDAgZGFyazp0ZXh0LWdyYXktNDAwIj4KICAgICAgICAgICAge3N0YXRlLm1lc3NhZ2V9CiAgICAgICAgICA8L3A+CiAgICAgICAgPC9kaXY+CgogICAgICAgIDxkaXYgY2xhc3NOYW1lPSJmbGV4IGJvcmRlci10IGJvcmRlci1ncmF5LTIwMCBkYXJrOmJvcmRlci13aGl0ZS8xMCI+CiAgICAgICAgICA8YnV0dG9uCiAgICAgICAgICAgIHR5cGU9ImJ1dHRvbiIKICAgICAgICAgICAgb25DbGljaz17b25DbG9zZX0KICAgICAgICAgICAgZGlzYWJsZWQ9e2J1c3l9CiAgICAgICAgICAgIGNsYXNzTmFtZT0iZmxleC0xIGJvcmRlci1yIGJvcmRlci1ncmF5LTIwMCBkYXJrOmJvcmRlci13aGl0ZS8xMCBweS0zIHRleHQtWzE1cHhdIGZvbnQtbWVkaXVtIHRleHQtYnJhbmQtNjAwIGRhcms6dGV4dC1icmFuZC00MDAgdHJhbnNpdGlvbi1jb2xvcnMgaG92ZXI6YmctZ3JheS01MCBkYXJrOmhvdmVyOmJnLXdoaXRlLzUgZGlzYWJsZWQ6b3BhY2l0eS00MCBhY3RpdmU6YmctZ3JheS0xMDAgZGFyazphY3RpdmU6Ymctd2hpdGUvMTAiCiAgICAgICAgICA+CiAgICAgICAgICAgIHtzdGF0ZS5jYW5jZWxMYWJlbCA/PyAnQ2FuY2VsJ30KICAgICAgICAgIDwvYnV0dG9uPgogICAgICAgICAgPGJ1dHRvbgogICAgICAgICAgICB0eXBlPSJidXR0b24iCiAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZUNvbmZpcm19CiAgICAgICAgICAgIGRpc2FibGVkPXtidXN5fQogICAgICAgICAgICBjbGFzc05hbWU9ewogICAgICAgICAgICAgICdmbGV4LTEgcHktMyB0ZXh0LVsxNXB4XSBmb250LXNlbWlib2xkIHRyYW5zaXRpb24tY29sb3JzIGhvdmVyOmJnLWdyYXktNTAgZGFyazpob3ZlcjpiZy13aGl0ZS81IGRpc2FibGVkOm9wYWNpdHktNjAgYWN0aXZlOmJnLWdyYXktMTAwIGRhcms6YWN0aXZlOmJnLXdoaXRlLzEwICcgKwogICAgICAgICAgICAgIChzdGF0ZS5kZXN0cnVjdGl2ZQogICAgICAgICAgICAgICAgPyAndGV4dC1yZWQtNTAwIGRhcms6dGV4dC1yZWQtNDAwJwogICAgICAgICAgICAgICAgOiAndGV4dC1icmFuZC02MDAgZGFyazp0ZXh0LWJyYW5kLTQwMCcpCiAgICAgICAgICAgIH0KICAgICAgICAgID4KICAgICAgICAgICAge2J1c3kgPyAoCiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSJpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSI+CiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9ImgtMyB3LTMgYW5pbWF0ZS1zcGluIHJvdW5kZWQtZnVsbCBib3JkZXItMiBib3JkZXItY3VycmVudCBib3JkZXItdC10cmFuc3BhcmVudCIgLz4KICAgICAgICAgICAgICAgIHtzdGF0ZS5jb25maXJtTGFiZWwgPz8gJ0NvbmZpcm0nfQogICAgICAgICAgICAgIDwvc3Bhbj4KICAgICAgICAgICAgKSA6ICgKICAgICAgICAgICAgICBzdGF0ZS5jb25maXJtTGFiZWwgPz8gJ0NvbmZpcm0nCiAgICAgICAgICAgICl9CiAgICAgICAgICA8L2J1dHRvbj4KICAgICAgICA8L2Rpdj4KICAgICAgPC9kaXY+CiAgICA8L2Rpdj4sCiAgICBkb2N1bWVudC5ib2R5CiAgKTsKfQo=";

fs.mkdirSync(path.dirname(COMPONENT_PATH), { recursive: true });
fs.writeFileSync(COMPONENT_PATH, Buffer.from(COMPONENT_B64, 'base64').toString('utf8'), 'utf8');
console.log(`✔ Created ${COMPONENT_PATH}`);

// ---------------------------------------------------------------------------
// 2. Patch AdminClient.tsx
// ---------------------------------------------------------------------------
const raw = fs.readFileSync(ADMIN_CLIENT, 'utf8');
const usedCRLF = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n'); // normalize for matching
let changesApplied = 0;

function replaceOnce(label, oldStr, newStr) {
  const idx = content.indexOf(oldStr);
  if (idx === -1) {
    console.warn(`⚠ Skipped "${label}" — expected text not found (file may already be patched, or has diverged).`);
    return;
  }
  const secondIdx = content.indexOf(oldStr, idx + oldStr.length);
  if (secondIdx !== -1) {
    fail(`"${label}" pattern is not unique in the file — aborting to avoid a bad edit. Please apply this one manually.`);
  }
  content = content.slice(0, idx) + newStr + content.slice(idx + oldStr.length);
  changesApplied++;
  console.log(`✔ Patched: ${label}`);
}

const alreadyWired = content.includes("from '@/components/ui/ConfirmDialog'");
if (alreadyWired) {
  console.log('✔ Skipped import/state/render wiring — already present.');
} else {
  replaceOnce(
    'import ConfirmDialog',
    `import { useToast, ToastHost } from '@/components/ui/Toast';`,
    `import { useToast, ToastHost } from '@/components/ui/Toast';\nimport { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';`
  );

  replaceOnce(
    'confirmDialog state',
    `  const [reviewPageSize, setReviewPageSize] = useState(12);`,
    `  const [reviewPageSize, setReviewPageSize] = useState(12);\n  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);`
  );

  replaceOnce(
    'render ConfirmDialog',
    `      <ToastHost toast={toast} />`,
    `      <ToastHost toast={toast} />\n      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />`
  );
}

replaceOnce(
  'deleteUser',
  `  async function deleteUser(userId: string, email: string) {
    if (!confirm('Delete user ' + email + '? Cannot be undone.')) return;
    await fetch('/api/admin/users/' + userId, { method: 'DELETE' });
    window.location.reload();
  }`,
  `  function deleteUser(userId: string, email: string) {
    setConfirmDialog({
      title: 'Delete User',
      message: \`Delete \${email || 'this user'}? This cannot be undone.\`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        await fetch('/api/admin/users/' + userId, { method: 'DELETE' });
        window.location.reload();
      },
    });
  }`
);

replaceOnce(
  'deleteEvent',
  `  async function deleteEvent(eventId: string, name: string) {
    if (!confirm('Delete event "' + name + '"? Cannot be undone.')) return;
    const res = await fetch('/api/admin/events/' + eventId, { method: 'DELETE' });
    if (res.ok) {
      showToast('Event deleted', '🗑️');
      setEventRows(rows => rows.filter(r => r.id !== eventId));
    } else {
      showToast('Could not delete event', '⚠️');
    }
  }`,
  `  function deleteEvent(eventId: string, name: string) {
    setConfirmDialog({
      title: 'Delete Event',
      message: \`Delete "\${name}"? This cannot be undone.\`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        const res = await fetch('/api/admin/events/' + eventId, { method: 'DELETE' });
        if (res.ok) {
          showToast('Event deleted', '🗑️');
          setEventRows(rows => rows.filter(r => r.id !== eventId));
        } else {
          showToast('Could not delete event', '⚠️');
        }
      },
    });
  }`
);

replaceOnce(
  'bulkDeleteEvents',
  `  async function bulkDeleteEvents(ids: string[]) {
    if (!confirm(\`Delete \${ids.length} events? Cannot be undone.\`)) return;
    setBulkActionLoading(true);`,
  `  function bulkDeleteEvents(ids: string[]) {
    setConfirmDialog({
      title: 'Delete Events',
      message: \`Delete \${ids.length} event\${ids.length === 1 ? '' : 's'}? This cannot be undone.\`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => performBulkDeleteEvents(ids),
    });
  }

  async function performBulkDeleteEvents(ids: string[]) {
    setBulkActionLoading(true);`
);

replaceOnce(
  'deleteArticle',
  `  async function deleteArticle(articleId: string, title: string) {
    if (!confirm('Delete article "' + title + '"? Cannot be undone.')) return;
    const res = await fetch('/api/admin/articles/' + articleId, { method: 'DELETE' });
    if (res.ok) {
      showToast('Article deleted', '🗑️');
      setArticleRows(rows => rows.filter(r => r.id !== articleId));
    } else {
      showToast('Could not delete article', '⚠️');
    }
  }`,
  `  function deleteArticle(articleId: string, title: string) {
    setConfirmDialog({
      title: 'Delete Article',
      message: \`Delete "\${title}"? This cannot be undone.\`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        const res = await fetch('/api/admin/articles/' + articleId, { method: 'DELETE' });
        if (res.ok) {
          showToast('Article deleted', '🗑️');
          setArticleRows(rows => rows.filter(r => r.id !== articleId));
        } else {
          showToast('Could not delete article', '⚠️');
        }
      },
    });
  }`
);

replaceOnce(
  'review delete button',
  `                  <button
                    onClick={() => {
                      if (confirm('Delete this review?')) {
                        fetch(\`/api/admin/reviews/\${r.id}\`, { method: 'DELETE' })
                          .then(res => {
                            if (res.ok) {
                              setReviewsState(prev => prev.filter(rev => rev.id !== r.id));
                              showToast('Review deleted', '🗑️');
                            } else {
                              showToast('Failed to delete', '⚠️');
                            }
                          })
                          .catch(() => showToast('Network error', '⚠️'));
                      }
                    }}
                    className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors"
                  >
                    Delete`,
  `                  <button
                    onClick={() => {
                      setConfirmDialog({
                        title: 'Delete Review',
                        message: 'Delete this review? This cannot be undone.',
                        confirmLabel: 'Delete',
                        destructive: true,
                        onConfirm: () => {
                          return fetch(\`/api/admin/reviews/\${r.id}\`, { method: 'DELETE' })
                            .then(res => {
                              if (res.ok) {
                                setReviewsState(prev => prev.filter(rev => rev.id !== r.id));
                                showToast('Review deleted', '🗑️');
                              } else {
                                showToast('Failed to delete', '⚠️');
                              }
                            })
                            .catch(() => showToast('Network error', '⚠️'));
                        },
                      });
                    }}
                    className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors"
                  >
                    Delete`
);

if (changesApplied === 0) {
  fail('No changes were applied to AdminClient.tsx (it may already be patched).');
}

const output = usedCRLF ? content.replace(/\n/g, '\r\n') : content;
fs.writeFileSync(ADMIN_CLIENT, output, 'utf8');
console.log(`\n✅ Done — ${changesApplied}/8 edits applied to ${ADMIN_CLIENT}`);
console.log(`   Component created at ${COMPONENT_PATH}`);
console.log('\nMake sure "brand" colors exist in your Tailwind theme (you already use bg-brand-500 elsewhere), and that react-dom is installed (it is, as part of React/Next.js).');
