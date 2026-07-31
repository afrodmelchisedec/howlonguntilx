// FILE: src/app/api/page.tsx
import Link from 'next/link';
import { CodeBlock } from '@/components/docs/CodeBlock';
import { MeshStarsBackdrop } from '@/components/docs/MeshStarsBackdrop';
import { TryCountdown } from '@/components/docs/TryCountdown';
import { TrySearch } from '@/components/docs/TrySearch';
import { ApiSubscribeButton } from '@/components/api/ApiSubscribeButton';

const GLOW = '255, 159, 10';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://howlonguntilx.com';

export const metadata = {
  title: 'API Documentation — How Long Until X',
  description: 'Free public API for countdown timers and search. Pull live "how long until X" data into your own app, site, or bot.',
  alternates: { canonical: 'https://howlonguntilx.com/api' },
};

const NAV = [
  { id: 'pricing', label: 'Pricing' },
  { id: 'countdown', label: 'Countdown' },
  { id: 'search', label: 'Search' },
  { id: 'calendar', label: 'Calendar' },
];

function MethodBadge({ method }: { method: 'GET' | 'POST' }) {
  return (
    <span
      className="text-caption font-bold px-2 py-0.5 rounded-md"
      style={{
        background: method === 'GET' ? 'rgba(48, 209, 88, 0.15)' : 'rgba(10, 132, 255, 0.15)',
        color: method === 'GET' ? '#30d158' : '#0a84ff',
      }}
    >
      {method}
    </span>
  );
}

function ParamRow({ name, type, required, note }: { name: string; type: string; required?: boolean; note: string }) {
  return (
    <tr style={{ borderTop: '1px solid var(--border-hairline)' }}>
      <td className="py-2.5 pr-4">
        <code className="text-footnote font-semibold" style={{ color: `rgb(${GLOW})` }}>{name}</code>
        {required && <span className="text-caption ml-1.5" style={{ color: '#ff453a' }}>required</span>}
      </td>
      <td className="py-2.5 pr-4 text-footnote" style={{ color: 'var(--text-tertiary)' }}>{type}</td>
      <td className="py-2.5 text-footnote" style={{ color: 'var(--text-secondary)' }}>{note}</td>
    </tr>
  );
}

export default function ApiDocsPage() {
  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <MeshStarsBackdrop accent="orange" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', padding: '64px 20px 40px' }}>
          <p className="text-caption font-bold mb-2 tracking-wide" style={{ color: `rgb(${GLOW})` }}>DEVELOPER API</p>
          <h1 className="text-title1 mb-3">Build with How Long Until X</h1>
          <p className="text-callout max-w-lg" style={{ color: 'var(--text-secondary)' }}>
            Free, public JSON endpoints for countdown timers and site search. Pull live data into
            your own app, dashboard, Discord bot, or blog — no signup, no API key, just fetch.
          </p>

          <div className="flex flex-wrap gap-2 mt-6">
            {NAV.map(n => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className="text-footnote font-semibold px-3.5 py-2 rounded-full"
                style={{ background: 'var(--bg-secondary, #1c1c1e)', border: '1px solid var(--border-hairline)' }}
              >
                {n.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px 80px' }}>
        {/* Quick facts */}
        <div className="grid sm:grid-cols-4 gap-3 mb-14">
          {[
            { label: 'Base URL', value: SITE_URL.replace('https://', '') },
            { label: 'Format', value: 'JSON' },
            { label: 'Auth', value: 'None on Free · API key on paid tiers' },
            { label: 'Rate limit', value: 'Credit-based, see pricing' },
          ].map(f => (
            <div key={f.label} className="ios-card-nested p-4">
              <p className="text-caption mb-1" style={{ color: 'var(--text-tertiary)' }}>{f.label}</p>
              <p className="text-footnote font-semibold">{f.value}</p>
            </div>
          ))}
        </div>

        {/* Pricing / usage tiers */}
        <section id="pricing" className="mb-16" style={{ scrollMarginTop: 24 }}>
          <p className="text-caption font-bold mb-2 tracking-wide" style={{ color: `rgb(${GLOW})` }}>USAGE &amp; PRICING</p>
          <h2 className="text-title2 mb-3">Free to start, pay only for scale</h2>
          <p className="text-callout mb-6" style={{ color: 'var(--text-secondary)' }}>
            Every request against Countdown or Search consumes 1 credit. Credits reset monthly.
            The Free tier is enough for a personal site or a low-traffic widget; once you're
            past that, pick the tier that matches your volume — no per-call surprises.
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                name: 'Free',
                price: '$0',
                credits: '1,000 credits / mo',
                desc: 'No signup required. Identified by IP address.',
                features: ['~30 requests/day average', 'Countdown + Search', 'No API key needed', 'Community support'],
                cta: 'Start building',
                highlight: false,
              },
              {
                name: 'Growth',
                price: '$10',
                credits: '20,000 credits / mo',
                desc: 'For a live widget on a real site or small app.',
                features: ['API key required', 'Countdown + Search', 'Usage dashboard', 'Email support'],
                cta: 'Upgrade to Growth',
                highlight: true,
              },
              {
                name: 'Scale',
                price: '$100',
                credits: '250,000 credits / mo',
                desc: 'For high-traffic apps, bots, or multiple integrations.',
                features: ['API key required', 'Countdown + Search', 'Usage dashboard', 'Priority support'],
                cta: 'Upgrade to Scale',
                highlight: false,
              },
            ].map(tier => (
              <div
                key={tier.name}
                className="ios-card p-5 flex flex-col"
                style={tier.highlight ? { boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.5), 0 14px 32px rgba(${GLOW}, 0.15)` } : undefined}
              >
                {tier.highlight && (
                  <span className="text-caption font-bold mb-2 self-start px-2 py-0.5 rounded-full" style={{ background: `rgb(${GLOW})`, color: '#1a1a1a' }}>
                    MOST POPULAR
                  </span>
                )}
                <p className="text-headline mb-0.5">{tier.name}</p>
                <p className="text-title2 font-bold mb-1">{tier.price}<span className="text-footnote font-normal" style={{ color: 'var(--text-tertiary)' }}>/mo</span></p>
                <p className="text-footnote font-semibold mb-3" style={{ color: `rgb(${GLOW})` }}>{tier.credits}</p>
                <p className="text-footnote mb-4" style={{ color: 'var(--text-secondary)' }}>{tier.desc}</p>
                <ul className="text-footnote space-y-1.5 mb-5" style={{ color: 'var(--text-secondary)' }}>
                  {tier.features.map(f => <li key={f}>✓ {f}</li>)}
                </ul>
                {tier.name === 'Free' ? (
                  <Link
                    href="#countdown"
                    className="mt-auto text-center text-footnote font-bold px-4 py-2.5 rounded-lg"
                    style={{ background: 'var(--bg-secondary, #1c1c1e)', border: '1px solid var(--border-hairline)' }}
                  >
                    {tier.cta}
                  </Link>
                ) : (
                  <ApiSubscribeButton tier={tier.name.toUpperCase() as 'GROWTH' | 'SCALE'} label={tier.cta} />
                )}
              </div>
            ))}
          </div>

          <p className="text-caption mt-4" style={{ color: 'var(--text-tertiary)' }}>
            Once a tier's monthly credits are used, further calls return <code>402 Payment Required</code> until
            your credits reset or you upgrade. We'll email you at 80% and 100% usage so nothing breaks silently.
          </p>
        </section>

        {/* Authentication */}
        <section id="authentication" className="mb-16" style={{ scrollMarginTop: 24 }}>
          <h2 className="text-title2 mb-3">Authentication</h2>
          <p className="text-callout mb-4" style={{ color: 'var(--text-secondary)' }}>
            The Free tier needs nothing — just call the endpoint. On Growth and Scale, pass your API key
            as a Bearer token. Requests with a valid key are billed to your plan's credits instead of the
            shared IP-based Free pool.
          </p>
          <div className="mb-4">
            <CodeBlock
              label="With an API key"
              language="bash"
              code={`curl "${SITE_URL}/api/countdown?event=christmas" \\
  -H "Authorization: Bearer hlx_live_xxxxxxxxxxxxxxxx"`}
            />
          </div>
          <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
            Subscribe to <Link href="#pricing" className="underline" style={{ color: `rgb(${GLOW})` }}>Growth or Scale</Link> above
            to get a key instantly via PayPal — a full key-management dashboard is coming soon, in the
            meantime your key is available at <code>GET /api/keys</code> while signed in.
          </p>
        </section>

        {/* Rate limit note */}
        <div className="ios-card p-5 mb-16" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2)` }}>
          <p className="text-headline mb-1.5">Rate limits</p>
          <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
            Beyond the monthly credit cap for your tier, requests are also rate-limited per IP/key to prevent
            bursts from affecting other users. If you're throttled you'll get back
            <code className="mx-1 px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-secondary, #1c1c1e)' }}>429 Too Many Requests</code>
            with <code className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-secondary, #1c1c1e)' }}>{'{ "error": "Rate limit exceeded" }'}</code>.
            For steady embedding (e.g. a widget on your own site), cache the response client-side and refetch
            every 30–60 seconds rather than on every render — that alone will keep almost any real widget on Free.
          </p>
        </div>

        {/* ===== Countdown ===== */}
        <section id="countdown" className="mb-20" style={{ scrollMarginTop: 24 }}>
          <div className="flex items-center gap-2 mb-2">
            <MethodBadge method="GET" />
            <code className="text-callout font-semibold">/api/countdown</code>
          </div>
          <h2 className="text-title2 mb-3">Countdown</h2>
          <p className="text-callout mb-6" style={{ color: 'var(--text-secondary)' }}>
            Returns the live time remaining until any event. Pass a known event slug from our database
            (e.g. a specific date already tracked on the site), or plain text — the API understands both
            shortcuts like <code>christmas</code> and natural dates like <code>2027-06-01</code> or
            <code> "next friday"</code>.
          </p>

          <p className="text-headline mb-2">Query parameters</p>
          <table className="w-full mb-6">
            <tbody>
              <ParamRow name="event" type="string" required note='Event slug or free-text date, e.g. "christmas", "halloween", "new year", or "2027-06-01".' />
            </tbody>
          </table>

          <p className="text-headline mb-2">Example request</p>
          <div className="mb-6">
            <CodeBlock
              label="curl"
              language="bash"
              code={`curl "${SITE_URL}/api/countdown?event=christmas"`}
            />
          </div>
          <div className="mb-6">
            <CodeBlock
              label="JavaScript (fetch)"
              language="javascript"
              code={`const res = await fetch("${SITE_URL}/api/countdown?event=christmas");
const data = await res.json();
console.log(data.days_left, "days left until", data.event);`}
            />
          </div>
          <div className="mb-8">
            <CodeBlock
              label="Python"
              language="python"
              code={`import requests

r = requests.get("${SITE_URL}/api/countdown", params={"event": "christmas"})
data = r.json()
print(f"{data['days_left']} days left until {data['event']}")`}
            />
          </div>

          <p className="text-headline mb-2">Example response</p>
          <div className="mb-6">
            <CodeBlock
              label="200 OK"
              language="json"
              code={`{
  "event": "Christmas",
  "target_date": "2026-12-25T00:00:00.000Z",
  "days_left": 147,
  "hours_left": 14,
  "minutes_left": 2,
  "seconds_left": 58,
  "progress_percent": 60,
  "is_past": false
}`}
            />
          </div>

          <p className="text-headline mb-2">Response fields</p>
          <table className="w-full mb-8">
            <tbody>
              <ParamRow name="event" type="string" note="Human-readable event name." />
              <ParamRow name="target_date" type="ISO 8601 string" note="The resolved target datetime in UTC." />
              <ParamRow name="days_left / hours_left / minutes_left / seconds_left" type="integer" note="Time remaining, broken down. Recompute client-side for a live tick — don't poll every second." />
              <ParamRow name="progress_percent" type="integer 0–100" note="How far elapsed a tracked event's countdown is, where applicable." />
              <ParamRow name="is_past" type="boolean" note="True once the target date has passed." />
            </tbody>
          </table>

          <p className="text-headline mb-2">Errors</p>
          <table className="w-full mb-8">
            <tbody>
              <ParamRow name="404" type="Event not found" note="The event slug isn't in our database and couldn't be parsed as a date." />
              <ParamRow name="429" type="Rate limit exceeded" note="Too many requests from your IP — back off and retry." />
            </tbody>
          </table>

          <TryCountdown />
        </section>

        {/* ===== Search ===== */}
        <section id="search" className="mb-20" style={{ scrollMarginTop: 24 }}>
          <div className="flex items-center gap-2 mb-2">
            <MethodBadge method="GET" />
            <code className="text-callout font-semibold">/api/search</code>
          </div>
          <h2 className="text-title2 mb-3">Search</h2>
          <p className="text-callout mb-6" style={{ color: 'var(--text-secondary)' }}>
            Full-text search across tracked events and published tool articles. Handy for building a
            "jump to a countdown" search box, or for surfacing related pages from your own content.
          </p>

          <p className="text-headline mb-2">Query parameters</p>
          <table className="w-full mb-6">
            <tbody>
              <ParamRow name="q" type="string" required note="Search text. Must be at least 2 characters — shorter queries return an empty array." />
            </tbody>
          </table>

          <p className="text-headline mb-2">Example request</p>
          <div className="mb-6">
            <CodeBlock
              label="curl"
              language="bash"
              code={`curl "${SITE_URL}/api/search?q=christmas"`}
            />
          </div>
          <div className="mb-8">
            <CodeBlock
              label="JavaScript (fetch)"
              language="javascript"
              code={`const res = await fetch("${SITE_URL}/api/search?q=christmas");
const results = await res.json();
results.forEach(r => console.log(r.type, r.name, r.href));`}
            />
          </div>

          <p className="text-headline mb-2">Example response</p>
          <div className="mb-6">
            <CodeBlock
              label="200 OK"
              language="json"
              code={`[
  {
    "slug": "christmas",
    "name": "Christmas",
    "category": "holidays",
    "type": "event",
    "href": "/how-long-until-christmas"
  },
  {
    "slug": "ces-2027-dates",
    "name": "CES 2027",
    "category": "tech-events",
    "type": "article",
    "href": "/tools/tech-events/ces-2027-dates"
  }
]`}
            />
          </div>

          <p className="text-headline mb-2">Response fields</p>
          <table className="w-full mb-8">
            <tbody>
              <ParamRow name="type" type='"event" | "article"' note="What kind of result this is." />
              <ParamRow name="name" type="string" note="Display title." />
              <ParamRow name="category" type="string" note="Category slug, for grouping or filtering results." />
              <ParamRow name="href" type="string" note="Relative path on howlonguntilx.com — prefix with the base URL to build a full link." />
            </tbody>
          </table>
          <p className="text-footnote mb-8" style={{ color: 'var(--text-tertiary)' }}>
            Results are capped at 8, sorted by relevance (views for events, likes for articles).
          </p>

          <TrySearch />
        </section>

        {/* ===== Calendar ===== */}
        <section id="calendar" className="mb-8" style={{ scrollMarginTop: 24 }}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <MethodBadge method="GET" />
            <MethodBadge method="POST" />
            <code className="text-callout font-semibold">/api/calendar</code>
            <span
              className="text-caption font-bold px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(255, 69, 58, 0.15)', color: '#ff453a' }}
            >
              Authenticated · Pro plan
            </span>
          </div>
          <h2 className="text-title2 mb-3">Calendar</h2>
          <p className="text-callout mb-4" style={{ color: 'var(--text-secondary)' }}>
            Unlike Countdown and Search, this endpoint is <strong>not public</strong>. It reads and writes
            a signed-in Pro user's own saved calendar days on howlonguntilx.com, authenticated via session
            cookie — it's what powers the "save this day" feature inside your own account, not something
            an outside site can call anonymously.
          </p>
          <p className="text-callout mb-6" style={{ color: 'var(--text-secondary)' }}>
            We're documenting it here for transparency and for anyone building an internal tool against
            their own account. If you're looking to pull public countdown data into your app, use{' '}
            <a href="#countdown" className="underline" style={{ color: `rgb(${GLOW})` }}>Countdown</a> instead.
          </p>

          <p className="text-headline mb-2">Requests (must include a valid session cookie)</p>
          <div className="mb-6">
            <CodeBlock
              label="GET — read saved days"
              language="bash"
              code={`curl "${SITE_URL}/api/calendar" \\
  -H "Cookie: next-auth.session-token=<your-session-token>"

# → 200 { "days": [...] }  if Pro
# → 200 { "days": null }   if signed in but not Pro
# → 401 { "error": "Unauthorized" } if not signed in`}
            />
          </div>
          <div className="mb-6">
            <CodeBlock
              label="POST — save days"
              language="bash"
              code={`curl -X POST "${SITE_URL}/api/calendar" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: next-auth.session-token=<your-session-token>" \\
  -d '{ "days": ["2026-12-25", "2027-01-01"] }'

# → 200 { "ok": true, "updatedAt": "..." }
# → 403 { "error": "Pro required" } if not on Pro plan`}
            />
          </div>
        </section>

        {/* CTA */}
        <div className="ios-card p-6 sm:p-8 text-center" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.1)` }}>
          <p className="text-headline mb-2">Want a drop-in widget instead of raw JSON?</p>
          <p className="text-footnote mb-4" style={{ color: 'var(--text-secondary)' }}>
            The embed generator gives you a ready-to-paste iframe — no fetch code required.
          </p>
          <Link
            href="/embed"
            className="inline-block text-callout font-bold px-5 py-2.5 rounded-lg"
            style={{ background: `rgb(${GLOW})`, color: '#1a1a1a' }}
          >
            Explore embeddable widgets →
          </Link>
          <p className="text-caption mt-6" style={{ color: 'var(--text-tertiary)' }}>
            Questions, or need a custom endpoint? <Link href="/contact" className="underline">Get in touch</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}