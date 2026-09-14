#!/usr/bin/env node
/**
 * Creates an iOS-style single-button AlertDialog (matching ConfirmDialog's
 * look) at src/components/ui/AlertDialog.tsx, and wires it into all 5
 * window.alert() calls in src/components/admin/CalendarEventsManager.tsx —
 * this is what was showing the native browser "Invalid region: ''" popup
 * when toggling a calendar event's Featured status.
 *
 * Run from your project root (the folder that contains "src/"):
 *   node apply-alert-dialog-calendar.js
 */
const fs = require('fs');
const path = require('path');

function fail(msg) {
  console.error('✖ ' + msg);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 1. Create AlertDialog.tsx (base64-embedded, same approach as ConfirmDialog)
// ---------------------------------------------------------------------------
const COMPONENT_PATH = path.join('src', 'components', 'ui', 'AlertDialog.tsx');
const COMPONENT_B64 = "J3VzZSBjbGllbnQnOwoKaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JzsKaW1wb3J0IHsgY3JlYXRlUG9ydGFsIH0gZnJvbSAncmVhY3QtZG9tJzsKCmV4cG9ydCB0eXBlIEFsZXJ0RGlhbG9nU3RhdGUgPSB7CiAgdGl0bGU/OiBzdHJpbmc7CiAgbWVzc2FnZTogc3RyaW5nOwp9IHwgbnVsbDsKCmV4cG9ydCBmdW5jdGlvbiBBbGVydERpYWxvZyh7CiAgc3RhdGUsCiAgb25DbG9zZSwKfTogewogIHN0YXRlOiBBbGVydERpYWxvZ1N0YXRlOwogIG9uQ2xvc2U6ICgpID0+IHZvaWQ7Cn0pIHsKICBjb25zdCBbdmlzaWJsZSwgc2V0VmlzaWJsZV0gPSB1c2VTdGF0ZShmYWxzZSk7CgogIHVzZUVmZmVjdCgoKSA9PiB7CiAgICBpZiAoc3RhdGUpIHsKICAgICAgY29uc3QgcmFmID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHNldFZpc2libGUodHJ1ZSkpOwogICAgICByZXR1cm4gKCkgPT4gY2FuY2VsQW5pbWF0aW9uRnJhbWUocmFmKTsKICAgIH0gZWxzZSB7CiAgICAgIHNldFZpc2libGUoZmFsc2UpOwogICAgfQogIH0sIFtzdGF0ZV0pOwoKICB1c2VFZmZlY3QoKCkgPT4gewogICAgaWYgKCFzdGF0ZSkgcmV0dXJuOwogICAgZnVuY3Rpb24gb25LZXlEb3duKGU6IEtleWJvYXJkRXZlbnQpIHsKICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJyB8fCBlLmtleSA9PT0gJ0VudGVyJykgb25DbG9zZSgpOwogICAgfQogICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleURvd24pOwogICAgcmV0dXJuICgpID++IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25LZXlEb3duKTsKICB9LCBbc3RhdGUsIG9uQ2xvc2VdKTsKCiAgaWYgKCFzdGF0ZSB8fCB0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gbnVsbDsKCiAgcmV0dXJuIGNyZWF0ZVBvcnRhbCgKICAgIDxkaXYKICAgICAgY2xhc3NOYW1lPSJmaXhlZCBpbnNldC0wIHotWzk5OTldIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHB4LTYiCiAgICAgIHJvbGU9ImFsZXJ0ZGlhbG9nIgogICAgICBhcmlhLW1vZGFsPSJ0cnVlIgogICAgICBhcmlhLWxhYmVsbGVkYnk9ImFsZXJ0LWRpYWxvZy10aXRsZSIKICAgICAgYXJpYS1kZXNjcmliZWRieT0iYWxlcnQtZGlhbG9nLW1lc3NhZ2UiCiAgICA+CiAgICAgIDxkaXYKICAgICAgICBjbGFzc05hbWU9ImFic29sdXRlIGluc2V0LTAgYmctYmxhY2svNDAgYmFja2Ryb3AtYmx1ci1bMnB4XSB0cmFuc2l0aW9uLW9wYWNpdHkgZHVyYXRpb24tMjAwIgogICAgICAgIHN0eWxlPXt7IG9wYWNpdHk6IHZpc2libGUgPyAxIDogMCB9fQogICAgICAvPgoKICAgICAgPGRpdgogICAgICAgIGNsYXNzTmFtZT0icmVsYXRpdmUgdy1mdWxsIG1heC13LVszMDBweF0gb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQtMnhsIGJvcmRlciBib3JkZXItYmxhY2svNSBkYXJrOmJvcmRlci13aGl0ZS8xMCBiZy13aGl0ZS85MCBkYXJrOmJnLWdyYXktOTAwLzkwIGJhY2tkcm9wLWJsdXIteGwgc2hhZG93LTJ4bCB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0yMDAgZWFzZS1vdXQiCiAgICAgICAgc3R5bGU9e3sKICAgICAgICAgIG9wYWNpdHk6IHZpc2libGUgPyAxIDogMCwKICAgICAgICAgIHRyYW5zZm9ybTogdmlzaWJsZSA/ICdzY2FsZSgxKScgOiAnc2NhbGUoMS4wNiknLAogICAgICAgIH19CiAgICAgID4KICAgICAgICA8ZGl2IGNsYXNzTmFtZT0icHgtNSBwdC01IHBiLTQgdGV4dC1jZW50ZXIiPgogICAgICAgICAge3N0YXRlLnRpdGxlICYmICgKICAgICAgICAgICAgPHAgaWQ9ImFsZXJ0LWRpYWxvZy10aXRsZSIgY2xhc3NOYW1lPSJ0ZXh0LVsxNXB4XSBmb250LXNlbWlib2xkIHRleHQtZ3JheS05MDAgZGFyazp0ZXh0LWdyYXktMTAwIj4KICAgICAgICAgICAgICB7c3RhdGUudGl0bGV9CiAgICAgICAgICAgIDwvcD4KICAgICAgICAgICl9CiAgICAgICAgICA8cAogICAgICAgICAgICBpZD0iYWxlcnQtZGlhbG9nLW1lc3NhZ2UiCiAgICAgICAgICAgIGNsYXNzTmFtZT17J3RleHQtWzEzcHhdIGxlYWRpbmctc251ZyB0ZXh0LWdyYXktNTAwIGRhcms6dGV4dC1ncmF5LTQwMCcgKyAoc3RhdGUudGl0bGUgPyAnIG10LTEuNScgOiAnJyl9CiAgICAgICAgICA+CiAgICAgICAgICAgIHtzdGF0ZS5tZXNzYWdlfQogICAgICAgICAgPC9wPgogICAgICAgIDwvZGl2PgoKICAgICAgICA8ZGl2IGNsYXNzTmFtZT0iZmxleCBib3JkZXItdCBib3JkZXItZ3JheS0yMDAgZGFyazpib3JkZXItd2hpdGUvMTAiPgogICAgICAgICAgPGJ1dHRvbgogICAgICAgICAgICB0eXBlPSJidXR0b24iCiAgICAgICAgICAgIG9uQ2xpY2s9e29uQ2xvc2V9CiAgICAgICAgICAgIGNsYXNzTmFtZT0iZmxleC0xIHB5LTMgdGV4dC1bMTVweF0gZm9udC1zZW1pYm9sZCB0ZXh0LWJyYW5kLTYwMCBkYXJrOnRleHQtYnJhbmQtNDAwIHRyYW5zaXRpb24tY29sb3JzIGhvdmVyOmJnLWdyYXktNTAgZGFyazpob3ZlcjpiZy13aGl0ZS81IGFjdGl2ZTpiZy1ncmF5LTEwMCBkYXJrOmFjdGl2ZTpiZy13aGl0ZS8xMCIKICAgICAgICAgID4KICAgICAgICAgICAgT0sKICAgICAgICAgIDwvYnV0dG9uPgogICAgICAgIDwvZGl2PgogICAgICA8L2Rpdj4KICAgIDwvZGl2PiwKICAgIGRvY3VtZW50LmJvZHkKICApOwp9Cg==";

if (fs.existsSync(COMPONENT_PATH)) {
  console.log(`✔ ${COMPONENT_PATH} already exists, skipping creation.`);
} else {
  fs.mkdirSync(path.dirname(COMPONENT_PATH), { recursive: true });
  fs.writeFileSync(COMPONENT_PATH, Buffer.from(COMPONENT_B64, 'base64').toString('utf8'), 'utf8');
  console.log(`✔ Created ${COMPONENT_PATH}`);
}

// ---------------------------------------------------------------------------
// 2. Patch CalendarEventsManager.tsx
// ---------------------------------------------------------------------------
const TARGET = path.join('src', 'components', 'admin', 'CalendarEventsManager.tsx');

if (!fs.existsSync(TARGET)) {
  fail(`${TARGET} not found. Run this from your project root (the folder containing "src/").`);
}
if (!fs.existsSync(path.join('src', 'components', 'ui', 'ConfirmDialog.tsx'))) {
  fail(`src/components/ui/ConfirmDialog.tsx not found. Run apply-confirm-dialog-global-2.js first.`);
}

const raw = fs.readFileSync(TARGET, 'utf8');
const usedCRLF = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n');
let applied = 0;

function replaceOnce(label, oldStr, newStr, required) {
  const idx = content.indexOf(oldStr);
  if (idx === -1) {
    if (required) fail(`${TARGET}: expected anchor for "${label}" not found — file may have diverged. No changes written.`);
    console.warn(`⚠ ${TARGET}: skipped "${label}" — expected text not found (already patched?).`);
    return;
  }
  if (content.indexOf(oldStr, idx + oldStr.length) !== -1) {
    fail(`${TARGET}: "${label}" is not unique — aborting to avoid a bad edit.`);
  }
  content = content.slice(0, idx) + newStr + content.slice(idx + oldStr.length);
  applied++;
  console.log(`✔ ${TARGET}: patched "${label}"`);
}

if (content.includes("from '@/components/ui/AlertDialog'")) {
  console.log(`✔ ${TARGET}: AlertDialog already wired, skipping import/state/render setup.`);
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

replaceOnce(
  'remove() delete-fail alert',
  `        if (!res.ok) { alert(data.error || 'Could not delete.'); return; }`,
  `        if (!res.ok) { setAlertDialog({ message: data.error || 'Could not delete.' }); return; }`,
  false
);

replaceOnce(
  'toggleFeatured alert',
  `    if (!res.ok) {
      alert(data.error || (!ev.featured ? 'Could not feature — does this event have a slug?' : 'Could not update.'));
      return;
    }`,
  `    if (!res.ok) {
      setAlertDialog({ message: data.error || (!ev.featured ? 'Could not feature — does this event have a slug?' : 'Could not update.') });
      return;
    }`,
  false
);

replaceOnce(
  'runImport invalid-JSON alert',
  `    } catch {
      alert('Invalid JSON — check syntax');
      return;
    }`,
  `    } catch {
      setAlertDialog({ message: 'Invalid JSON — check syntax' });
      return;
    }`,
  false
);

replaceOnce(
  'runImport failed-import alert',
  `      if (!res.ok) {
        alert(data.error || 'Import failed');
        return;
      }`,
  `      if (!res.ok) {
        setAlertDialog({ message: data.error || 'Import failed' });
        return;
      }`,
  false
);

replaceOnce(
  'runImport network-error alert',
  `    } catch {
      alert('Network error during import');
    } finally {`,
  `    } catch {
      setAlertDialog({ message: 'Network error during import' });
    } finally {`,
  false
);

if (applied === 0) {
  console.log(`— ${TARGET}: nothing to do (already patched).`);
} else {
  const output = usedCRLF ? content.replace(/\n/g, '\r\n') : content;
  fs.writeFileSync(TARGET, output, 'utf8');
  console.log(`✅ ${TARGET}: saved (${applied} edits).`);
}
