const fs = require('fs');
const path = 'src/app/layout.tsx';
let raw = fs.readFileSync(path, 'utf8');

// Normalize to \n for matching, remember if original was CRLF so we can restore it
const wasCRLF = raw.includes('\r\n');
const content = raw.replace(/\r\n/g, '\n');

const old = `    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>`;

const nw = `    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: \`
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  // Dark is the default — only add .light if the user explicitly chose it.
                  if (stored === 'light') {
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            \`,
          }}
        />
      </head>
      <body suppressHydrationWarning style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>`;

if (!content.includes(old)) {
  console.log('❌ Still not matching after CRLF normalization. Actual content around <html> tag:');
  const idx = content.indexOf('<html');
  console.log(content.slice(Math.max(0, idx - 20), idx + 400));
} else {
  let updated = content.replace(old, nw);
  if (wasCRLF) updated = updated.replace(/\n/g, '\r\n');
  fs.writeFileSync(path, updated);
  console.log('✅ layout.tsx patched with blocking pre-paint theme script (CRLF-safe).');
}
