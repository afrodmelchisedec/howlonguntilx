// FILE: src/app/embed/page.tsx
import Link from 'next/link';
import { EmbedGenerator } from '@/components/embed/EmbedGenerator';
import { CodeBlock } from '@/components/docs/CodeBlock';
import { MeshStarsBackdrop } from '@/components/docs/MeshStarsBackdrop';

const VIOLET = '125, 118, 255';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://howlonguntilx.com';

export const metadata = {
  title: 'Embed a Countdown Widget — How Long Until X',
  description: 'Drop a live countdown widget into your site with one line of code. Free, no signup, no API key required.',
  alternates: { canonical: 'https://howlonguntilx.com/embed' },
};

const STEPS = [
  { title: 'Pick an event', body: 'Type any tracked event slug, or free text like a date — same rules as the Countdown API.' },
  { title: 'Choose a theme', body: 'Light or dark, matched to your site automatically or set manually.' },
  { title: 'Paste the iframe', body: 'One line of HTML. The widget ticks live, no JavaScript required on your end.' },
];

export default function EmbedPage() {
  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <MeshStarsBackdrop accent="violet" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', padding: '64px 20px 40px' }}>
          <p className="text-caption font-bold mb-2 tracking-wide" style={{ color: `rgb(${VIOLET})` }}>EMBEDDABLE WIDGETS</p>
          <h1 className="text-title1 mb-3">Put a live countdown on your site</h1>
          <p className="text-callout max-w-lg" style={{ color: 'var(--text-secondary)' }}>
            A self-updating countdown widget for any event, embeddable with a single iframe.
            Free, no account, no API key — just generate and paste.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px 80px' }}>
        {/* How it works */}
        <div className="grid sm:grid-cols-3 gap-4 mb-16">
          {STEPS.map((s, i) => (
            <div key={s.title} className="ios-card-nested p-4">
              <p className="text-caption font-bold mb-2" style={{ color: `rgb(${VIOLET})` }}>{`0${i + 1}`}</p>
              <p className="text-headline mb-1">{s.title}</p>
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{s.body}</p>
            </div>
          ))}
        </div>

        {/* Live generator */}
        <section className="mb-20">
          <h2 className="text-title2 mb-3">Generate your embed</h2>
          <p className="text-callout mb-6" style={{ color: 'var(--text-secondary)' }}>
            Customize below — the preview and code update instantly.
          </p>
          <EmbedGenerator />
        </section>

        {/* Framework snippets */}
        <section className="mb-20">
          <h2 className="text-title2 mb-3">Add it to your stack</h2>
          <p className="text-callout mb-6" style={{ color: 'var(--text-secondary)' }}>
            The embed is a plain iframe, so it works anywhere HTML works. Here's how it looks in a few
            common setups.
          </p>

          <p className="text-headline mb-2">Plain HTML</p>
          <div className="mb-6">
            <CodeBlock
              label="HTML"
              language="html"
              code={`<iframe
  src="${SITE_URL}/embed/widget?event=christmas&theme=light"
  width="300"
  height="160"
  frameborder="0"
  loading="lazy"
></iframe>`}
            />
          </div>

          <p className="text-headline mb-2">React / Next.js</p>
          <div className="mb-6">
            <CodeBlock
              label="JSX"
              language="jsx"
              code={`export function ChristmasCountdown() {
  return (
    <iframe
      src="${SITE_URL}/embed/widget?event=christmas&theme=dark"
      width={300}
      height={160}
      style={{ border: 'none', borderRadius: 14 }}
      loading="lazy"
      title="Countdown to Christmas"
    />
  );
}`}
            />
          </div>

          <p className="text-headline mb-2">WordPress</p>
          <p className="text-footnote mb-3" style={{ color: 'var(--text-secondary)' }}>
            Add a <strong>Custom HTML</strong> block to any post or page and paste the plain HTML snippet above.
          </p>

          <p className="text-headline mb-2">Webflow / Squarespace / other site builders</p>
          <p className="text-footnote mb-8" style={{ color: 'var(--text-secondary)' }}>
            Look for an <strong>Embed</strong> or <strong>Custom Code</strong> element, drop it where you want
            the widget, and paste the plain HTML snippet inside it.
          </p>
        </section>

        {/* Customization reference */}
        <section className="mb-20">
          <h2 className="text-title2 mb-3">Customization options</h2>
          <table className="w-full mb-4">
            <tbody>
              <tr style={{ borderTop: '1px solid var(--border-hairline)' }}>
                <td className="py-2.5 pr-4"><code className="text-footnote font-semibold" style={{ color: `rgb(${VIOLET})` }}>event</code></td>
                <td className="py-2.5 pr-4 text-footnote" style={{ color: 'var(--text-tertiary)' }}>string</td>
                <td className="py-2.5 text-footnote" style={{ color: 'var(--text-secondary)' }}>
                  Same resolution rules as the Countdown API — a tracked slug (e.g. <code>christmas</code>) or
                  a free-text date (e.g. <code>2027-06-01</code>).
                </td>
              </tr>
              <tr style={{ borderTop: '1px solid var(--border-hairline)' }}>
                <td className="py-2.5 pr-4"><code className="text-footnote font-semibold" style={{ color: `rgb(${VIOLET})` }}>theme</code></td>
                <td className="py-2.5 pr-4 text-footnote" style={{ color: 'var(--text-tertiary)' }}>"light" | "dark"</td>
                <td className="py-2.5 text-footnote" style={{ color: 'var(--text-secondary)' }}>Defaults to light. Set to match your site's own theme.</td>
              </tr>
              <tr style={{ borderTop: '1px solid var(--border-hairline)' }}>
                <td className="py-2.5 pr-4"><code className="text-footnote font-semibold" style={{ color: `rgb(${VIOLET})` }}>width / height</code></td>
                <td className="py-2.5 pr-4 text-footnote" style={{ color: 'var(--text-tertiary)' }}>iframe attributes</td>
                <td className="py-2.5 text-footnote" style={{ color: 'var(--text-secondary)' }}>
                  300×160 is the tuned default. The widget is responsive down to ~220px wide if you need it smaller.
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
            The widget ticks live via client-side JavaScript inside the iframe — you don't need to refresh
            or re-render anything on your end.
          </p>
        </section>

        {/* CTA */}
        <div className="ios-card p-6 sm:p-8 text-center" style={{ boxShadow: `0 0 0 1.5px rgba(${VIOLET}, 0.25), 0 0 40px rgba(${VIOLET}, 0.12)` }}>
          <p className="text-headline mb-2">Need raw data instead of a visual widget?</p>
          <p className="text-footnote mb-4" style={{ color: 'var(--text-secondary)' }}>
            Use the JSON API directly to build fully custom countdown UI in your own app.
          </p>
          <Link
            href="/api"
            className="inline-block text-callout font-bold px-5 py-2.5 rounded-lg"
            style={{ background: `rgb(${VIOLET})`, color: '#fff' }}
          >
            View API docs →
          </Link>
          <p className="text-caption mt-6" style={{ color: 'var(--text-tertiary)' }}>
            Questions, or need a custom size/theme? <Link href="/contact" className="underline">Get in touch</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
