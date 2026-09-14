#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function fail(msg) { console.error('✖ ' + msg); process.exit(1); }

if (!fs.existsSync(path.join('src', 'components', 'ui', 'AlertDialog.tsx'))) {
  fail('src/components/ui/AlertDialog.tsx not found. Fix that first.');
}

const f = path.join('src', 'app', 'users', 'LifeExpectancyPanel.tsx');
if (!fs.existsSync(f)) fail(`${f} not found. Run from your project root.`);

const raw = fs.readFileSync(f, 'utf8');
const usedCRLF = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n');
let applied = 0;

function replaceOnce(label, oldStr, newStr, required) {
  const idx = content.indexOf(oldStr);
  if (idx === -1) {
    if (required) fail(`expected anchor for "${label}" not found — no changes written.`);
    console.warn(`⚠ skipped "${label}" — not found (already patched?).`);
    return;
  }
  if (content.indexOf(oldStr, idx + oldStr.length) !== -1) {
    fail(`"${label}" is not unique — aborting.`);
  }
  content = content.slice(0, idx) + newStr + content.slice(idx + oldStr.length);
  applied++;
  console.log(`✔ patched "${label}"`);
}

const wired = content.includes("from '@/components/ui/AlertDialog'");
if (wired) {
  console.log('✔ AlertDialog already wired in main component, skipping setup.');
} else {
  replaceOnce(
    'import',
    `import { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';`,
    `import { ConfirmDialog, type ConfirmDialogState } from '@/components/ui/ConfirmDialog';\nimport { AlertDialog, type AlertDialogState } from '@/components/ui/AlertDialog';`,
    true
  );
  replaceOnce(
    'state',
    `  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);`,
    `  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);\n  const [alertDialog, setAlertDialog] = useState<AlertDialogState>(null);`,
    true
  );
  replaceOnce(
    'render',
    `      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />`,
    `      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />\n      <AlertDialog state={alertDialog} onClose={() => setAlertDialog(null)} />`,
    true
  );
}

const copyWired = content.includes('copyAlert');
if (copyWired) {
  console.log('✔ CopyPromptBanner already wired, skipping.');
} else {
  replaceOnce(
    'CopyPromptBanner local state',
    `function CopyPromptBanner() {\n  const [copied, setCopied] = useState(false);`,
    `function CopyPromptBanner() {\n  const [copied, setCopied] = useState(false);\n  const [copyAlert, setCopyAlert] = useState<AlertDialogState>(null);`,
    true
  );
  replaceOnce(
    'CopyPromptBanner render',
    `  return (\n    <div\n      className="rounded-2xl p-5 flex items-start gap-4 flex-wrap sm:flex-nowrap"\n      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(236,72,153,0.14), rgba(34,197,94,0.14))', border: '1px solid rgba(139,92,246,0.35)' }}\n    >`,
    `  return (\n    <div\n      className="rounded-2xl p-5 flex items-start gap-4 flex-wrap sm:flex-nowrap"\n      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(236,72,153,0.14), rgba(34,197,94,0.14))', border: '1px solid rgba(139,92,246,0.35)' }}\n    >\n      <AlertDialog state={copyAlert} onClose={() => setCopyAlert(null)} />`,
    true
  );
}

replaceOnce(
  'CopyPromptBanner clipboard-fail alert',
  `    }).catch(() => alert('Could not copy — select and copy the prompt manually.'));`,
  `    }).catch(() => setCopyAlert({ message: 'Could not copy — select and copy the prompt manually.' }));`,
  false
);

replaceOnce(
  'handleImport invalid-JSON alert',
  `    } catch {\n      setImportResult(null);\n      alert('Invalid JSON — check syntax');\n      return;\n    }`,
  `    } catch {\n      setImportResult(null);\n      setAlertDialog({ message: 'Invalid JSON — check syntax' });\n      return;\n    }`,
  false
);

replaceOnce(
  'handleImport bad-payload alert',
  `    if (!Array.isArray(items)) {\n      alert('Payload must be an array, or an object with an "items" array.');\n      return;\n    }`,
  `    if (!Array.isArray(items)) {\n      setAlertDialog({ message: 'Payload must be an array, or an object with an "items" array.' });\n      return;\n    }`,
  false
);

replaceOnce(
  'saveEdit invalid-number alert',
  `    if (!Number.isFinite(remainingYears) || remainingYears < 0) { alert('Enter a valid positive number'); return; }`,
  `    if (!Number.isFinite(remainingYears) || remainingYears < 0) { setAlertDialog({ message: 'Enter a valid positive number' }); return; }`,
  false
);

replaceOnce(
  'saveEdit save-fail alert',
  `    } catch {\n      alert('Could not save — try again');\n    }\n  }\n\n  function deleteRow(row: Row) {`,
  `    } catch {\n      setAlertDialog({ message: 'Could not save — try again' });\n    }\n  }\n\n  function deleteRow(row: Row) {`,
  false
);

replaceOnce(
  'deleteRow delete-fail alert',
  `        } catch {\n          alert('Could not delete — try again');\n        }\n      },\n    });\n  }`,
  `        } catch {\n          setAlertDialog({ message: 'Could not delete — try again' });\n        }\n      },\n    });\n  }`,
  false
);

replaceOnce(
  'toggleDataset update-fail alert',
  `    } catch {\n      alert('Could not update — try again');\n    } finally {\n      setTogglingKey(null);\n    }`,
  `    } catch {\n      setAlertDialog({ message: 'Could not update — try again' });\n    } finally {\n      setTogglingKey(null);\n    }`,
  false
);

if (applied === 0) {
  console.log('— nothing to do (already patched).');
} else {
  const output = usedCRLF ? content.replace(/\n/g, '\r\n') : content;
  fs.writeFileSync(f, output, 'utf8');
  console.log(`✅ saved (${applied} edits).`);
}
