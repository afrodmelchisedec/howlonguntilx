// FILE: src/app/plugins/page.tsx
import Link from 'next/link';
import { CodeBlock } from '@/components/docs/CodeBlock';
import { MeshStarsBackdrop } from '@/components/docs/MeshStarsBackdrop';
import { PluginShortcodeTable } from '@/components/plugins/PluginShortcodeTable';
import { ToolEmbedPicker } from '@/components/plugins/ToolEmbedPicker';
import { prisma } from '@/lib/db';

const VIOLET = '125, 118, 255';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://howlonguntilx.com';
const PLUGIN_SLUG = 'until-x-tools';

export const metadata = {
  title: 'WordPress Plugin — Embed Until X Tools',
  description: 'Install the Until X Tools WordPress plugin and drop any calculator or tracker into a post with one shortcode. Free, auto-resizing, no API key required.',
  alternates: { canonical: 'https://howlonguntilx.com/plugins' },
};

const STEPS = [
  { title: 'Download the plugin', body: 'A standard WordPress plugin zip — no build step, no dependencies.' },
  { title: 'Upload & activate', body: 'Plugins → Add New → Upload Plugin in your WP admin, then Activate.' },
  { title: 'Copy a shortcode', body: 'Settings → Until X Tools lists every available tool with a ready shortcode.' },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function PluginsPage() {
  const iframeSnippet = `[hlux_tool slug="labor-onset-predictor"]`;

  const latestRelease = await prisma.pluginRelease.findFirst({
    where: { slug: PLUGIN_SLUG, isLatest: true },
  });

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <MeshStarsBackdrop accent="violet" />

      {/* Hero */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', padding: '64px 20px 40px' }}>
          <p className="text-caption font-bold mb-2 tracking-wide" style={{ color: `rgb(${VIOLET})` }}>WORDPRESS PLUGIN</p>
          <h1 className="text-title1 mb-3">Embed any Until X tool with one shortcode</h1>
          <p className="text-callout max-w-lg" style={{ color: 'var(--text-secondary)' }}>
            The Until X Tools plugin drops a live, auto-resizing calculator or tracker into any post or page.
            Free, no account, no API key — install once, reuse the shortcode anywhere.
          </p>

          {latestRelease ? (
            <>
              <a href={`/api/downloads/${PLUGIN_SLUG}`}
                className="btn-filled press inline-flex items-center gap-2 mt-5" style={{ background: `rgb(${VIOLET})` }}>
                ⬇️ Download the plugin (.zip)
              </a>
              <p className="text-caption mt-2" style={{ color: 'var(--text-tertiary)' }}>
                v{latestRelease.version} · {formatBytes(latestRelease.fileSize)} · {latestRelease.downloadCount.toLocaleString()} downloads
                {latestRelease.changelogNote && <> · {latestRelease.changelogNote}</>}
              </p>
            </>
          ) : (
            <p className="text-callout mt-5" style={{ color: 'var(--text-tertiary)' }}>
              The plugin download is temporarily unavailable — check back shortly.
            </p>
          )}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', padding: '0 20px 80px' }}>
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

        {/* Shortcode demo */}
        <div className="mb-16">
          <h2 className="text-title2 mb-2">The shortcode</h2>
          <p className="text-callout mb-5" style={{ color: 'var(--text-secondary)' }}>
            Every tool takes the same form — just swap the slug. Settings → Until X Tools in your WP admin
            has the full list with copy buttons, so you never have to type one from memory.
          </p>
          <CodeBlock code={iframeSnippet} language="text" />
        </div>

        {/* Available tools table — real data, not a mockup */}
        <div className="mb-16">
          <h2 className="text-title2 mb-2">Available tools</h2>
          <p className="text-callout mb-5" style={{ color: 'var(--text-secondary)' }}>
            This list is live — it's the exact same table you'll see in your WordPress admin after installing.
          </p>
          <PluginShortcodeTable />
        </div>

        {/* Not on WordPress? */}
        <div className="mb-16">
          <h2 className="text-title2 mb-2">Not on WordPress?</h2>
          <p className="text-callout mb-5" style={{ color: 'var(--text-secondary)' }}>
            Every tool also has a plain HTML embed — no plugin needed. Paste this anywhere:
          </p>
          <ToolEmbedPicker siteUrl={SITE_URL} />
        </div>

        <div className="ios-card-nested p-5 text-center">
          <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
            Questions, or need a tool that isn't listed yet? <Link href="/contact" className="underline">Get in touch</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
