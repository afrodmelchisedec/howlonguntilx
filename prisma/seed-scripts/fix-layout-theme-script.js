const fs = require('fs');
const path = 'src/app/layout.tsx';
let content = fs.readFileSync(path, 'utf8');

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
  console.log('❌ Exact <html>/<body> block not found — paste current layout.tsx to fix manually.');
} else {
  content = content.replace(old, nw);
  fs.writeFileSync(path, content);
  console.log('✅ layout.tsx patched with blocking pre-paint theme script.');
}
