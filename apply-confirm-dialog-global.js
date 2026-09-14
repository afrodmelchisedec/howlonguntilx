#!/usr/bin/env node
/**
 * Wires the existing iOS-style ConfirmDialog (src/components/ui/ConfirmDialog.tsx,
 * already created + used in AdminClient.tsx) into 4 more delete-confirmation call
 * sites so the same dialog is used site-wide:
 *   - src/components/admin/DefaultFollowConfigManager.tsx
 *   - src/components/admin/ReviewersManager.tsx
 *   - src/components/community/CommentThread.tsx
 *   - src/components/community/MyEventsList.tsx
 *
 * Run from your project root (the folder that contains "src/"):
 *   node apply-confirm-dialog-global.js
 */
const fs = require('fs');
const path = require('path');

const COMPONENT_PATH = path.join('src', 'components', 'ui', 'ConfirmDialog.tsx');

function fail(msg) {
  console.error('✖ ' + msg);
  process.exit(1);
}

if (!fs.existsSync(COMPONENT_PATH)) {
  fail(`${COMPONENT_PATH} not found. Run the earlier apply-confirm-dialog.js script first — this script only wires more call sites into it.`);
}

function patchFile(filePath, importAnchor, importInsert, stateAnchor, stateInsert, renderPatches, edits) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠ Skipped ${filePath} — file not found.`);
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const usedCRLF = raw.includes('\r\n');
  let content = raw.replace(/\r\n/g, '\n');
  let applied = 0;

  if (content.includes("from '@/components/ui/ConfirmDialog'")) {
    console.log(`✔ ${filePath}: already wired, skipping import/state/render setup.`);
  } else {
    const steps = [
      ['import', importAnchor, importInsert],
      ['state', stateAnchor, stateInsert],
      ...renderPatches.map((p, i) => [`render#${i + 1}`, p[0], p[1]]),
    ];
    for (const [label, oldStr, newStr] of steps) {
      const idx = content.indexOf(oldStr);
      if (idx === -1) {
        fail(`${filePath}: expected anchor for "${label}" not found — file may have diverged. No changes written.`);
      }
      if (content.indexOf(oldStr, idx + oldStr.length) !== -1) {
        fail(`${filePath}: anchor for "${label}" is not unique — aborting to avoid a bad edit.`);
      }
      content = content.slice(0, idx) + newStr + content.slice(idx + oldStr.length);
      applied++;
    }
  }

  for (const [label, oldStr, newStr] of edits) {
    const idx = content.indexOf(oldStr);
    if (idx === -1) {
      console.warn(`⚠ ${filePath}: skipped "${label}" — expected text not found (already patched?).`);
      continue;
    }
    if (content.indexOf(oldStr, idx + oldStr.length) !== -1) {
      fail(`${filePath}: "${label}" is not unique — aborting to avoid a bad edit.`);
    }
    content = content.slice(0, idx) + newStr + content.slice(idx + oldStr.length);
    applied++;
    console.log(`✔ ${filePath}: patched "${label}"`);
  }

  if (applied === 0) {
    console.log(`— ${filePath}: nothing to do (already patched).`);
    return;
  }
  const output = usedCRLF ? content.replace(/\n/g, '\r\n') : content;
  fs.writeFileSync(filePath, output, 'utf8');
  console.log(`✅ ${filePath}: saved.\n`);
}

// ---------------------------------------------------------------------------
// 1. DefaultFollowConfigManager.tsx
// ---------------------------------------------------------------------------
patchFile(
  path.join('src', 'components', 'admin', 'DefaultFollowConfigManager.tsx'),
  `import { useEffect, useState } from 'react';`,
  `import { useEffect, useState } from 'react';\nimport { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';`,
  `  const [settingId, setSettingId] = useState<string | null>(null);`,
  `  const [settingId, setSettingId] = useState<string | null>(null);\n  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);`,
  [[
    `  return (\n    <div>\n      <div className="mb-4">\n        <h2 className="text-lg font-semibold">Default follow account</h2>`,
    `  return (\n    <div>\n      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />\n      <div className="mb-4">\n        <h2 className="text-lg font-semibold">Default follow account</h2>`,
  ]],
  [[
    'setDefault',
    `  async function setDefault(userId: string) {
    const isChange = !!config;
    if (!confirm(isChange
      ? 'Change the default-follow account to this user? New signups will start following them instead.'
      : 'Set this as the permanent default-follow account? This cannot be changed later without using the testing override.')) return;
    setSettingId(userId);
    setError('');
    try {
      const res = await fetch('/api/admin/default-follow', {
        method: isChange ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not set default-follow account.');
        return;
      }
      setConfig(data);
      setChanging(false);
      setSearch('');
      setCandidates([]);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSettingId(null);
    }
  }`,
    `  function setDefault(userId: string) {
    const isChange = !!config;
    setConfirmDialog({
      title: isChange ? 'Change Default Account' : 'Set Default Account',
      message: isChange
        ? 'Change the default-follow account to this user? New signups will start following them instead.'
        : 'Set this as the permanent default-follow account? This cannot be changed later without using the testing override.',
      confirmLabel: isChange ? 'Change' : 'Set',
      onConfirm: () => performSetDefault(userId, isChange),
    });
  }

  async function performSetDefault(userId: string, isChange: boolean) {
    setSettingId(userId);
    setError('');
    try {
      const res = await fetch('/api/admin/default-follow', {
        method: isChange ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not set default-follow account.');
        return;
      }
      setConfig(data);
      setChanging(false);
      setSearch('');
      setCandidates([]);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSettingId(null);
    }
  }`,
  ]]
);

// ---------------------------------------------------------------------------
// 2. ReviewersManager.tsx
// ---------------------------------------------------------------------------
patchFile(
  path.join('src', 'components', 'admin', 'ReviewersManager.tsx'),
  `import { useEffect, useState } from 'react';\nimport Link from 'next/link';`,
  `import { useEffect, useState } from 'react';\nimport Link from 'next/link';\nimport { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';`,
  `  const [error, setError] = useState('');`,
  `  const [error, setError] = useState('');\n  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);`,
  [[
    `  return (\n    <div>\n      <div className="mb-4">\n        <h2 className="text-lg font-semibold">Reviewers</h2>`,
    `  return (\n    <div>\n      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />\n      <div className="mb-4">\n        <h2 className="text-lg font-semibold">Reviewers</h2>`,
  ]],
  [[
    'remove',
    `  async function remove(r: Reviewer) {
    if (!confirm(\`Delete reviewer "\${r.name}"? This cannot be undone.\`)) return;
    const res = await fetch(\`/api/admin/reviewers/\${r.id}\`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || 'Could not delete.');
      return;
    }
    load();
  }`,
    `  function remove(r: Reviewer) {
    setConfirmDialog({
      title: 'Delete Reviewer',
      message: \`Delete reviewer "\${r.name}"? This cannot be undone.\`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        const res = await fetch(\`/api/admin/reviewers/\${r.id}\`, { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(data.error || 'Could not delete.');
          return;
        }
        load();
      },
    });
  }`,
  ]]
);

// ---------------------------------------------------------------------------
// 3. CommentThread.tsx
// ---------------------------------------------------------------------------
patchFile(
  path.join('src', 'components', 'community', 'CommentThread.tsx'),
  `import { useEffect, useState, useCallback } from 'react';`,
  `import { useEffect, useState, useCallback } from 'react';\nimport { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';`,
  `  const [posting, setPosting] = useState(false);`,
  `  const [posting, setPosting] = useState(false);\n  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);`,
  [[
    `  return (\n    <div id="comments-section" className="mt-8">\n      {!expanded && (`,
    `  return (\n    <div id="comments-section" className="mt-8">\n      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />\n      {!expanded && (`,
  ]],
  [[
    'handleDelete',
    `  async function handleDelete(id: string) {
    if (!confirm('Delete this comment?')) return;
    const res = await fetch(\`/api/comments/\${id}\`, { method: 'PATCH' });
    if (!res.ok) return;
    setFlat(prev => prev.map(c => c.id === id
      ? { ...c, body: '[deleted]', author: null, deletedAt: new Date().toISOString() }
      : c));
  }`,
    `  function handleDelete(id: string) {
    setConfirmDialog({
      title: 'Delete Comment',
      message: 'Delete this comment?',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        const res = await fetch(\`/api/comments/\${id}\`, { method: 'PATCH' });
        if (!res.ok) return;
        setFlat(prev => prev.map(c => c.id === id
          ? { ...c, body: '[deleted]', author: null, deletedAt: new Date().toISOString() }
          : c));
      },
    });
  }`,
  ]]
);

// ---------------------------------------------------------------------------
// 4. MyEventsList.tsx
// ---------------------------------------------------------------------------
patchFile(
  path.join('src', 'components', 'community', 'MyEventsList.tsx'),
  `import { useToast, ToastHost } from '@/components/ui/Toast';`,
  `import { useToast, ToastHost } from '@/components/ui/Toast';\nimport { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';`,
  `  const [deletingId, setDeletingId] = useState<string | null>(null);`,
  `  const [deletingId, setDeletingId] = useState<string | null>(null);\n  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);`,
  [
    [
      `      <div className="text-center py-16 text-sm text-gray-400">\n        <ToastHost toast={toast} />`,
      `      <div className="text-center py-16 text-sm text-gray-400">\n        <ToastHost toast={toast} />\n        <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />`,
    ],
    [
      `    <div className="space-y-3">\n      <ToastHost toast={toast} />`,
      `    <div className="space-y-3">\n      <ToastHost toast={toast} />\n      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />`,
    ],
  ],
  [[
    'handleDelete',
    `  async function handleDelete(id: string, title: string) {
    if (!confirm(\`Delete "\${title}"? This can't be undone.\`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(\`/api/user-events/\${id}\`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('Could not delete event', '⚠️');
        return;
      }
      showToast('Event deleted', '✅');
      router.refresh();
    } catch {
      showToast('Network error — please try again', '⚠️');
    } finally {
      setDeletingId(null);
    }
  }`,
    `  function handleDelete(id: string, title: string) {
    setConfirmDialog({
      title: 'Delete Event',
      message: \`Delete "\${title}"? This can't be undone.\`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        setDeletingId(id);
        try {
          const res = await fetch(\`/api/user-events/\${id}\`, { method: 'DELETE' });
          if (!res.ok) {
            showToast('Could not delete event', '⚠️');
            return;
          }
          showToast('Event deleted', '✅');
          router.refresh();
        } catch {
          showToast('Network error — please try again', '⚠️');
        } finally {
          setDeletingId(null);
        }
      },
    });
  }`,
  ]]
);

console.log('Done.');
