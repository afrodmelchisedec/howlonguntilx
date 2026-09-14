#!/usr/bin/env node
/**
 * Wires the existing AlertDialog into the remaining alert() call sites:
 *   - src/app/users/ApiUsersPanel.tsx          (2 alerts, ApiKeysTable)
 *   - src/app/users/LifeExpectancyPanel.tsx    (6 alerts in main component
 *                                                + 1 alert in CopyPromptBanner,
 *                                                which gets its own local dialog)
 *   - src/components/admin/CommentsModerationManager.tsx (2 alerts)
 *   - src/components/admin/ReviewersManager.tsx (1 alert)
 *   - src/components/admin/UserEventsModerationManager.tsx (2 alerts, fresh wiring)
 *   - src/components/ui/ShareBar.tsx           (1 alert, fresh wiring)
 *
 * Run from your project root (the folder that contains "src/"), after
 * apply-alert-dialog-calendar.js has already created src/components/ui/AlertDialog.tsx:
 *   node apply-alert-dialog-rest.js
 */
const fs = require('fs');
const path = require('path');

function fail(msg) {
  console.error('✖ ' + msg);
  process.exit(1);
}

if (!fs.existsSync(path.join('src', 'components', 'ui', 'AlertDialog.tsx'))) {
  fail('src/components/ui/AlertDialog.tsx not found. Run apply-alert-dialog-calendar.js first.');
}

function patchFile(filePath, steps, edits) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠ Skipped ${filePath} — file not found.`);
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const usedCRLF = raw.includes('\r\n');
  let content = raw.replace(/\r\n/g, '\n');
  let applied = 0;

  function replaceOnce(label, oldStr, newStr, required) {
    const idx = content.indexOf(oldStr);
    if (idx === -1) {
      if (required) fail(`${filePath}: expected anchor for "${label}" not found — file may have diverged. No changes written.`);
      console.warn(`⚠ ${filePath}: skipped "${label}" — expected text not found (already patched?).`);
      return;
    }
    if (content.indexOf(oldStr, idx + oldStr.length) !== -1) {
      fail(`${filePath}: "${label}" is not unique — aborting to avoid a bad edit.`);
    }
    content = content.slice(0, idx) + newStr + content.slice(idx + oldStr.length);
    applied++;
    console.log(`✔ ${filePath}: patched "${label}"`);
  }

  for (const [label, oldStr, newStr, required] of steps) {
    replaceOnce(label, oldStr, newStr, required !== false);
  }
  for (const [label, oldStr, newStr] of edits) {
    replaceOnce(label, oldStr, newStr, false);
  }

  if (applied === 0) {
    console.log(`— ${filePath}: nothing to do (already patched).`);
    return;
  }
  const output = usedCRLF ? content.replace(/\n/g, '\r\n') : content;
  fs.writeFileSync(filePath, output, 'utf8');
  console.log(`✅ ${filePath}: saved (${applied} edits).\n`);
}

function alreadyWired(filePath) {
  if (!fs.existsSync(filePath)) return false;
  return fs.readFileSync(filePath, 'utf8').includes("from '@/components/ui/AlertDialog'");
}

// ---------------------------------------------------------------------------
// 1. ApiUsersPanel.tsx
// ---------------------------------------------------------------------------
{
  const f = path.join('src', 'app', 'users', 'ApiUsersPanel.tsx');
  const setupSteps = alreadyWired(f) ? [] : [
    [
      'import',
      `import { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';`,
      `import { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';\nimport { AlertDialog, type AlertDialogState } from '@/components/ui/AlertDialog';`,
    ],
    [
      'state',
      `  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);`,
      `  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);\n  const [alertDialog, setAlertDialog] = useState<AlertDialogState>(null);`,
    ],
    [
      'render',
      `      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />`,
      `      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />\n      <AlertDialog state={alertDialog} onClose={() => setAlertDialog(null)} />`,
    ],
  ];
  patchFile(f, setupSteps, [
    [
      'runAction failure alert',
      `    } catch {
      alert('Action failed — check the console/network tab for details.');
    } finally {
      setBusyId(null);
    }
  }`,
      `    } catch {
      setAlertDialog({ message: 'Action failed — check the console/network tab for details.' });
    } finally {
      setBusyId(null);
    }
  }`,
    ],
    [
      'adjustCredits failure alert',
      `    } catch {
      alert('Adjustment failed — check the console/network tab for details.');
    } finally {
      setBusyId(null);
    }
  }`,
      `    } catch {
      setAlertDialog({ message: 'Adjustment failed — check the console/network tab for details.' });
    } finally {
      setBusyId(null);
    }
  }`,
    ],
  ]);
}

// ---------------------------------------------------------------------------
// 2. LifeExpectancyPanel.tsx (main component + CopyPromptBanner)
// ---------------------------------------------------------------------------
{
  const f = path.join('src', 'app', 'users', 'LifeExpectancyPanel.tsx');
  const setupSteps = alreadyWired(f) ? [] : [
    [
      'import',
      `import { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';`,
      `import { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';\nimport { AlertDialog, type AlertDialogState } from '@/components/ui/AlertDialog';`,
    ],
    [
      'state',
      `  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(nvll);`,
      `  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);\n  const [alertDialog, setAlertDialog] = useState<AlertDialogState>(null);`,
    ],
    [
      'render',
      `      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />`,
      `      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />\n      <AlertDialog state={alertDialog} onClose={() => setAlertDialog(null)} />`,
    ],
    [
      'CopyPromptBanner local state',
      `function CopyPromptBanner() {
  const [copied, setCopied] = useState(false);`,
      `function CopyPromptBanner() {
  const [copied, setCopied] = useState(false);
  const [copyAlert, setCopyAlert] = useState<AlertDialogState>(null);`,
    ],
    [
      'CopyPromptBanner render',
      `  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-4 flex-wrap sm:flex-nowrap"
      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(236,72,153,0.14), rgba(34,197,94,0.14))', border: '1px solid rgba(139,92,246,0.35)' }}
    >`,
      `  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-4 flex-wrap sm:flex-nowrap"
      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(236,72,153,0.14), rgba(34,197,94,0.14))', border: '1px solid rgba(139,92,246,0.35)' }}
    >
      <AlertDialog state={copyAlert} onClose={() => setCopyAlert(null)} />`,
    ],
  ];
  patchFile(f, setupSteps, [
    [
      'CopyPromptBanner clipboard-fail alert',
      `    }).catch(() => alert('Could not copy — select and copy the prompt manually.'));`,
      `    }).catch(() => setCopyAlert({ message: 'Could not copy — select and copy the prompt manually.' }));`,
    ],
    [
      'handleImport invalid-JSON alert',
      `    } catch {
      setImportResult(null);
      alert('Invalid JSON — check syntax');
      return;
    }`,
      `    } catch {
      setImportResult(null);
      setAlertDialog({ message: 'Invalid JSON — check syntax' });
      return;
    }`,
    ],
    [
      'handleImport bad-payload alert',
      `    if (!Array.isArray(items)) {
      alert('Payload must be an array, or an object with an "items" array.');
      return;
    }`,
      `    if (!Array.isArray(items)) {
      setAlertDialog({ message: 'Payload must be an array, or an object with an "items" array.' });
      return;
    }`,
    ],
    [
      'saveEdit invalid-number alert',
      `    if (!Number.isFinite(remainingYears) || remainingYears < 0) { alert('Enter a valid positive number'); return; }`,
      `    if (!Number.isFinite(remainingYears) || remainingYears < 0) { setAlertDialog({ message: 'Enter a valid positive number' }); return; }`,
    ],
    [
      'saveEdit save-fail alert',
      `    } catch {
      alert('Could not save — try again');
    }
  }

  function deleteRow(row: Row) {`,
      `    } catch {
      setAlertDialog({ message: 'Could not save — try again' });
    }
  }

  function deleteRow(row: Row) {`,
    ],
    [
      'deleteRow delete-fail alert',
      `        } catch {
          alert('Could not delete — try again');
        }
      },
    });
  }`,
      `        } catch {
          setAlertDialog({ message: 'Could not delete — try again' });
        }
      },
    });
  }`,
    ],
    [
      'toggleDataset update-fail alert',
      `    } catch {
      alert('Could not update — try again');
    } finally {
      setTogglingKey(null);
    }`,
      `    } catch {
      setAlertDialog({ message: 'Could not update — try again' });
    } finally {
      setTogglingKey(null);
    }`,
    ],
  ]);
}

// ---------------------------------------------------------------------------
// 3. CommentsModerationManager.tsx
// ---------------------------------------------------------------------------
{
  const f = path.join('src', 'components', 'admin', 'CommentsModerationManager.tsx');
  const setupSteps = alreadyWired(f) ? [] : [
    [
      'import',
      `import { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';`,
      `import { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';\nimport { AlertDialog, type AlertDialogState } from '@/components/ui/AlertDialog';`,
    ],
    [
      'state',
      `  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);`,
      `  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);\n  const [alertDialog, setAlertDialog] = useState<AlertDialogState>(null);`,
    ],
    [
      'render',
      `      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />`,
      `      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />\n      <AlertDialog state={alertDialog} onClose={() => setAlertDialog(null)} />`,
    ],
  ];
  patchFile(f, setupSteps, [
    [
      'performAct action-fail alert',
      `      if (!res.ok) { alert(data.error || 'Action failed.'); return; }`,
      `      if (!res.ok) { setAlertDialog({ message: data.error || 'Action failed.' }); return; }`,
    ],
    [
      'performAct network-error alert',
      `    } catch {
      alert('Network error.');
    } finally {
      setSavingId(null);
    }
  }`,
      `    } catch {
      setAlertDialog({ message: 'Network error.' });
    } finally {
      setSavingId(null);
    }
  }`,
    ],
  ]);
}

// ---------------------------------------------------------------------------
// 4. ReviewersManager.tsx
// ---------------------------------------------------------------------------
{
  const f = path.join('src', 'components', 'admin', 'ReviewersManager.tsx');
  const setupSteps = alreadyWired(f) ? [] : [
    [
      'import',
      `import { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';`,
      `import { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';\nimport { AlertDialog, type AlertDialogState } from '@/components/ui/AlertDialog';`,
    ],
    [
      'state',
      `  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);`,
      `  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);\n  const [alertDialog, setAlertDialog] = useState<AlertDialogState>(null);`,
    ],
    [
      'render',
      `      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />`,
      `      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />\n      <AlertDialog state={alertDialog} onClose={() => setAlertDialog(null)} />`,
    ],
  ];
  patchFile(f, setupSteps, [
    [
      'remove delete-fail alert',
      `        if (!res.ok) {
          alert(data.error || 'Could not delete.');
          return;
        }`,
      `        if (!res.ok) {
          setAlertDialog({ message: data.error || 'Could not delete.' });
          return;
        }`,
    ],
  ]);
}

// ---------------------------------------------------------------------------
// 5. UserEventsModerationManager.tsx (fresh wiring — no ConfirmDialog here)
// ---------------------------------------------------------------------------
{
  const f = path.join('src', 'components', 'admin', 'UserEventsModerationManager.tsx');
  const setupSteps = alreadyWired(f) ? [] : [
    [
      'import',
      `import { useEffect, useState } from 'react';`,
      `import { useEffect, useState } from 'react';\nimport { AlertDialog, type AlertDialogState } from '@/components/ui/AlertDialog';`,
    ],
    [
      'state',
      `  const [savingId, setSavingId] = useState<string | null>(null);`,
      `  const [savingId, setSavingId] = useState<string | null>(null);\n  const [alertDialog, setAlertDialog] = useState<AlertDialogState>(null);`,
    ],
    [
      'render',
      `  return (\n    <div>\n      <div className="mb-4">\n        <h2 className="text-lg font-semibold">Community events ({filtered.length}`,
      `  return (\n    <div>\n      <AlertDialog state={alertDialog} onClose={() => setAlertDialog(null)} />\n      <div className="mb-4">\n        <h2 className="text-lg font-semibold">Community events ({filtered.length}`,
    ],
  ];
  patchFile(f, setupSteps, [
    [
      'setStatus update-fail alert',
      `      if (!res.ok) { alert(data.error || 'Update failed.'); return; }`,
      `      if (!res.ok) { setAlertDialog({ message: data.error || 'Update failed.' }); return; }`,
    ],
    [
      'setStatus network-error alert',
      `    } catch {
      alert('Network error.');
    } finally {
      setSavingId(null);
    }
  }`,
      `    } catch {
      setAlertDialog({ message: 'Network error.' });
    } finally {
      setSavingId(null);
    }
  }`,
    ],
  ]);
}

// ---------------------------------------------------------------------------
// 6. ShareBar.tsx (fresh wiring)
// ---------------------------------------------------------------------------
{
  const f = path.join('src', 'components', 'ui', 'ShareBar.tsx');
  const setupSteps = alreadyWired(f) ? [] : [
    [
      'import',
      `import { useState, useEffect } from 'react';`,
      `import { useState, useEffect } from 'react';\nimport { AlertDialog, type AlertDialogState } from '@/components/ui/AlertDialog';`,
    ],
    [
      'state',
      `  const [shareCount, setShareCount] = useState(initialShareCount ?? 0);`,
      `  const [shareCount, setShareCount] = useState(initialShareCount ?? 0);\n  const [alertDialog, setAlertDialog] = useState<AlertDialogState>(null);`,
    ],
    [
      'render',
      `    <div className="flex flex-col items-center mt-6">`,
      `    <div className="flex flex-col items-center mt-6">\n      <AlertDialog state={alertDialog} onClose={() => setAlertDialog(null)} />`,
    ],
  ];
  patchFile(f, setupSteps, [
    [
      'copy link-copied alert',
      `    navigator.clipboard.writeText(url);
    track('copy');
    alert('Link copied!');
  }`,
      `    navigator.clipboard.writeText(url);
    track('copy');
    setAlertDialog({ message: 'Link copied!' });
  }`,
    ],
  ]);
}

console.log('Done.');
