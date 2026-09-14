#!/usr/bin/env node
/**
 * Wires the existing iOS-style ConfirmDialog into the remaining 5 files:
 *   - src/app/users/ApiUsersPanel.tsx        (revoke API key)
 *   - src/app/users/LifeExpectancyPanel.tsx  (delete data row)
 *   - src/app/users/settings/SettingsClient.tsx (cancel API key / delete account / cancel subscription)
 *   - src/components/admin/CalendarEventsManager.tsx (delete calendar event)
 *   - src/components/admin/CommentsModerationManager.tsx (remove comment)
 *
 * Run from your project root (the folder that contains "src/"):
 *   node apply-confirm-dialog-global-2.js
 */
const fs = require('fs');
const path = require('path');

const COMPONENT_PATH = path.join('src', 'components', 'ui', 'ConfirmDialog.tsx');

function fail(msg) {
  console.error('✖ ' + msg);
  process.exit(1);
}

if (!fs.existsSync(COMPONENT_PATH)) {
  fail(`${COMPONENT_PATH} not found. Run apply-confirm-dialog.js first — this script only wires more call sites into it.`);
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
// 1. ApiUsersPanel.tsx (ApiKeysTable's revoke action)
// ---------------------------------------------------------------------------
patchFile(
  path.join('src', 'app', 'users', 'ApiUsersPanel.tsx'),
  `import { useEffect, useState } from 'react';`,
  `import { useEffect, useState } from 'react';\nimport { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';`,
  `  const [busyId, setBusyId] = useState<string | null>(null);`,
  `  const [busyId, setBusyId] = useState<string | null>(null);\n  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);`,
  [[
    `  return (\n    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">`,
    `  return (\n    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">\n      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />`,
  ]],
  [[
    'runAction',
    `  async function runAction(id: string, action: 'revoke' | 'reactivate', confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusyId(id);
    try {
      const res = await fetch(\`/api/admin/api-keys/\${id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Request failed');
      setReloadFlag(f => f + 1);
      onMutated();
    } catch {
      alert('Action failed — check the console/network tab for details.');
    } finally {
      setBusyId(null);
    }
  }`,
    `  function runAction(id: string, action: 'revoke' | 'reactivate', confirmMsg?: string) {
    if (confirmMsg) {
      setConfirmDialog({
        title: action === 'revoke' ? 'Revoke API Key' : 'Confirm',
        message: confirmMsg,
        confirmLabel: action === 'revoke' ? 'Revoke' : 'Confirm',
        destructive: action === 'revoke',
        onConfirm: () => performRunAction(id, action),
      });
      return;
    }
    performRunAction(id, action);
  }

  async function performRunAction(id: string, action: 'revoke' | 'reactivate') {
    setBusyId(id);
    try {
      const res = await fetch(\`/api/admin/api-keys/\${id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Request failed');
      setReloadFlag(f => f + 1);
      onMutated();
    } catch {
      alert('Action failed — check the console/network tab for details.');
    } finally {
      setBusyId(null);
    }
  }`,
  ]]
);

// ---------------------------------------------------------------------------
// 2. LifeExpectancyPanel.tsx (deleteRow)
// ---------------------------------------------------------------------------
patchFile(
  path.join('src', 'app', 'users', 'LifeExpectancyPanel.tsx'),
  `import { useEffect, useState } from 'react';`,
  `import { useEffect, useState } from 'react';\nimport { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';`,
  `  const [editValue, setEditValue] = useState('');`,
  `  const [editValue, setEditValue] = useState('');\n  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);`,
  [[
    `  return (\n    <div className="space-y-8">`,
    `  return (\n    <div className="space-y-8">\n      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />`,
  ]],
  [[
    'deleteRow',
    `  async function deleteRow(row: Row) {
    if (!confirm(\`Delete \${REGION_LABELS[row.region]} · \${row.sex} · age \${row.age} (\${row.sourceYear})?\`)) return;
    try {
      const res = await fetch(\`/api/admin/life-expectancy/import?id=\${row.id}\`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setRows(prev => prev.filter(r => r.id !== row.id));
      setTotal(t => t - 1);
    } catch {
      alert('Could not delete — try again');
    }
  }`,
    `  function deleteRow(row: Row) {
    setConfirmDialog({
      title: 'Delete Row',
      message: \`Delete \${REGION_LABELS[row.region]} · \${row.sex} · age \${row.age} (\${row.sourceYear})?\`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(\`/api/admin/life-expectancy/import?id=\${row.id}\`, { method: 'DELETE' });
          if (!res.ok) throw new Error();
          setRows(prev => prev.filter(r => r.id !== row.id));
          setTotal(t => t - 1);
        } catch {
          alert('Could not delete — try again');
        }
      },
    });
  }`,
  ]]
);

// ---------------------------------------------------------------------------
// 3. SettingsClient.tsx (cancelApiKey, deleteAccount, cancelSubscription)
// ---------------------------------------------------------------------------
patchFile(
  path.join('src', 'app', 'users', 'settings', 'SettingsClient.tsx'),
  `import { useEffect, useState } from 'react';`,
  `import { useEffect, useState } from 'react';\nimport { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';`,
  `  const [apiKeyError, setApiKeyError] = useState('');`,
  `  const [apiKeyError, setApiKeyError] = useState('');\n  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);`,
  [[
    `  return (\n    <div className="max-w-lg mx-auto px-4 py-12">`,
    `  return (\n    <div className="max-w-lg mx-auto px-4 py-12">\n      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />`,
  ]],
  [
    [
      'cancelApiKey',
      `  async function cancelApiKey(k: ApiKeyInfo) {
    const confirmed = confirm(
      \`Cancel your \${k.tier} API subscription? Your key will stop working immediately.\`
    );
    if (!confirmed) return;

    setCancellingKeyId(k.id);
    setApiKeyError('');
    try {
      const res = await fetch('/api/keys/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: k.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiKeyError(data.error || 'Could not cancel this API key.');
        return;
      }
      await loadKeys();
    } catch {
      setApiKeyError('Network error — please try again.');
    } finally {
      setCancellingKeyId(null);
    }
  }`,
      `  function cancelApiKey(k: ApiKeyInfo) {
    setConfirmDialog({
      title: 'Cancel API Subscription',
      message: \`Cancel your \${k.tier} API subscription? Your key will stop working immediately.\`,
      confirmLabel: 'Cancel Subscription',
      destructive: true,
      onConfirm: () => performCancelApiKey(k),
    });
  }

  async function performCancelApiKey(k: ApiKeyInfo) {
    setCancellingKeyId(k.id);
    setApiKeyError('');
    try {
      const res = await fetch('/api/keys/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: k.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiKeyError(data.error || 'Could not cancel this API key.');
        return;
      }
      await loadKeys();
    } catch {
      setApiKeyError('Network error — please try again.');
    } finally {
      setCancellingKeyId(null);
    }
  }`,
    ],
    [
      'deleteAccount',
      `  async function deleteAccount() {
    if (!confirm('Delete your account and all data? This cannot be undone.')) return;
    await fetch('/api/user', { method: 'DELETE' });
    signOut({ callbackUrl: '/' });
  }`,
      `  function deleteAccount() {
    setConfirmDialog({
      title: 'Delete Account',
      message: 'Delete your account and all data? This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        await fetch('/api/user', { method: 'DELETE' });
        signOut({ callbackUrl: '/' });
      },
    });
  }`,
    ],
    [
      'cancelSubscription',
      `  async function cancelSubscription() {
    if (!billing) return;
    const confirmed = confirm(
      billing.subscriptionStatus === 'trialing'
        ? 'Cancel your trial? You\\'ll lose Pro access immediately.'
        : 'Cancel your Pro subscription? You\\'ll keep access until the current billing period ends, then move to the Free plan.'
    );
    if (!confirmed) return;

    setCancelling(true);
    setCancelError('');
    try {
      const res = await fetch('/api/dashboard/billing/cancel', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error || 'Could not cancel your subscription.');
        return;
      }
      await loadBilling();
    } catch {
      setCancelError('Network error — please try again.');
    } finally {
      setCancelling(false);
    }
  }`,
      `  function cancelSubscription() {
    if (!billing) return;
    setConfirmDialog({
      title: 'Cancel Subscription',
      message: billing.subscriptionStatus === 'trialing'
        ? 'Cancel your trial? You\\'ll lose Pro access immediately.'
        : 'Cancel your Pro subscription? You\\'ll keep access until the current billing period ends, then move to the Free plan.',
      confirmLabel: 'Cancel Subscription',
      destructive: true,
      onConfirm: performCancelSubscription,
    });
  }

  async function performCancelSubscription() {
    setCancelling(true);
    setCancelError('');
    try {
      const res = await fetch('/api/dashboard/billing/cancel', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error || 'Could not cancel your subscription.');
        return;
      }
      await loadBilling();
    } catch {
      setCancelError('Network error — please try again.');
    } finally {
      setCancelling(false);
    }
  }`,
    ],
  ]
);

// ---------------------------------------------------------------------------
// 4. CalendarEventsManager.tsx (remove)
// ---------------------------------------------------------------------------
patchFile(
  path.join('src', 'components', 'admin', 'CalendarEventsManager.tsx'),
  `import { useEffect, useMemo, useState } from 'react';`,
  `import { useEffect, useMemo, useState } from 'react';\nimport { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';`,
  `  const [loadError, setLoadError] = useState('');`,
  `  const [loadError, setLoadError] = useState('');\n  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);`,
  [[
    `  return (\n    <div>\n      <div className="mb-4 flex items-center justify-between">\n        <div>\n          <h2 className="text-lg font-semibold">Calendar Events</h2>`,
    `  return (\n    <div>\n      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />\n      <div className="mb-4 flex items-center justify-between">\n        <div>\n          <h2 className="text-lg font-semibold">Calendar Events</h2>`,
  ]],
  [[
    'remove',
    `  async function remove(ev: CalendarAdminEvent) {
    if (!confirm(\`Delete "\${ev.event}" (\${ev.rawDate})? This cannot be undone.\`)) return;
    const res = await fetch(\`/api/admin/calendar-events/\${encodeURIComponent(ev.id)}\`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || 'Could not delete.'); return; }
    setEvents(rows => rows.filter(r => r.id !== ev.id));
  }`,
    `  function remove(ev: CalendarAdminEvent) {
    setConfirmDialog({
      title: 'Delete Event',
      message: \`Delete "\${ev.event}" (\${ev.rawDate})? This cannot be undone.\`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        const res = await fetch(\`/api/admin/calendar-events/\${encodeURIComponent(ev.id)}\`, { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { alert(data.error || 'Could not delete.'); return; }
        setEvents(rows => rows.filter(r => r.id !== ev.id));
      },
    });
  }`,
  ]]
);

// ---------------------------------------------------------------------------
// 5. CommentsModerationManager.tsx (act -> remove)
// ---------------------------------------------------------------------------
patchFile(
  path.join('src', 'components', 'admin', 'CommentsModerationManager.tsx'),
  `import { useEffect, useState } from 'react';`,
  `import { useEffect, useState } from 'react';\nimport { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';`,
  `  const [savingId, setSavingId] = useState<string | null>(null);`,
  `  const [savingId, setSavingId] = useState<string | null>(null);\n  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);`,
  [[
    `  return (\n    <div>\n      <div className="mb-4">\n        <h2 className="text-lg font-semibold">Comments ({filtered.length}`,
    `  return (\n    <div>\n      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />\n      <div className="mb-4">\n        <h2 className="text-lg font-semibold">Comments ({filtered.length}`,
  ]],
  [[
    'act',
    `  async function act(c: CommentRow, action: 'flag' | 'unflag' | 'remove') {
    if (action === 'remove' && !confirm('Remove this comment? This hides it (soft-delete), same as an author self-deleting.')) return;
    let reason: string | null = null;
    if (action === 'flag') {
      reason = window.prompt('Flag reason for this comment? (optional)');
      if (reason === null) return; // cancelled
    }
    setSavingId(c.id);
    try {
      const res = await fetch('/api/admin/comments/' + c.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: reason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Action failed.'); return; }
      if (action === 'remove') {
        setComments(prev => prev.filter(x => x.id !== c.id));
      } else {
        setComments(prev => prev.map(x => x.id === c.id ? { ...x, ...data } : x));
      }
    } catch {
      alert('Network error.');
    } finally {
      setSavingId(null);
    }
  }`,
    `  function act(c: CommentRow, action: 'flag' | 'unflag' | 'remove') {
    if (action === 'remove') {
      setConfirmDialog({
        title: 'Remove Comment',
        message: 'Remove this comment? This hides it (soft-delete), same as an author self-deleting.',
        confirmLabel: 'Remove',
        destructive: true,
        onConfirm: () => performAct(c, 'remove', null),
      });
      return;
    }
    let reason: string | null = null;
    if (action === 'flag') {
      reason = window.prompt('Flag reason for this comment? (optional)');
      if (reason === null) return; // cancelled
    }
    performAct(c, action, reason);
  }

  async function performAct(c: CommentRow, action: 'flag' | 'unflag' | 'remove', reason: string | null) {
    setSavingId(c.id);
    try {
      const res = await fetch('/api/admin/comments/' + c.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: reason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Action failed.'); return; }
      if (action === 'remove') {
        setComments(prev => prev.filter(x => x.id !== c.id));
      } else {
        setComments(prev => prev.map(x => x.id === c.id ? { ...x, ...data } : x));
      }
    } catch {
      alert('Network error.');
    } finally {
      setSavingId(null);
    }
  }`,
  ]]
);

console.log('Done.');
