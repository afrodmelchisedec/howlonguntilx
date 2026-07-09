// FILE: src/app/privacy/page.tsx
const GLOW = '129, 178, 255';

export const metadata = {
  title: 'Privacy Policy — HowLongUntil',
  description: 'How HowLongUntil collects, uses, and protects your information.',
  alternates: { canonical: 'https://www.howlonguntilx.com/privacy' },
};

// TODO: Have this reviewed by a lawyer before relying on it for compliance —
// this is a solid starting structure, not a substitute for legal advice.
// Fill in the bracketed specifics (data retention periods, sub-processors, region-specific
// disclosures like GDPR/CCPA rights) to match your actual data practices.
const SECTIONS = [
  {
    title: '1. Information we collect',
    body: [
      'Account information: if you create an account, we collect your name, email address, and authentication details via our sign-in provider (NextAuth).',
      'Tool data: when you save settings, spots, watchlists, or preferences inside a Pro tool, we store that data tied to your account.',
      'Usage data: we collect standard technical data — pages visited, device/browser type, and approximate location derived from IP address — to understand how the site is used and to keep it running reliably. [TODO: confirm exact analytics provider(s) in use and add here, e.g. Google Analytics.]',
    ],
  },
  {
    title: '2. How we use your information',
    body: [
      'To provide and maintain the tools and features you use.',
      'To save your Pro-tier settings and preferences across sessions.',
      'To understand aggregate usage patterns and improve the site.',
      'To communicate with you about your account or in response to a message you send us.',
      'We do not sell your personal information to third parties.',
    ],
  },
  {
    title: '3. Cookies and similar technologies',
    body: [
      'We use cookies for authentication (keeping you signed in) and, where enabled, for analytics purposes. You can control cookies through your browser settings, though disabling them may affect sign-in and saved preferences. [TODO: add a cookie consent banner if serving EU/UK visitors, and list specific cookie names/purposes here.]',
    ],
  },
  {
    title: '4. Data sharing',
    body: [
      'We share data only with the service providers necessary to operate the platform — for example, our hosting provider, database provider, and authentication provider. [TODO: name specific sub-processors, e.g. Vercel, Neon, and any email service provider.] These providers are contractually restricted from using your data for any purpose beyond providing their service to us.',
    ],
  },
  {
    title: '5. Data retention',
    body: [
      'We retain account and tool data for as long as your account remains active. If you delete your account, associated saved data is removed within [TODO: specify timeframe, e.g. 30 days], except where retention is required for legal or security reasons.',
    ],
  },
  {
    title: '6. Your rights',
    body: [
      'Depending on your location, you may have the right to access, correct, or delete your personal data, and to object to or restrict certain processing. To exercise these rights, contact us at the email listed on our Contact page. [TODO: add region-specific detail if serving GDPR (EU/UK) or CCPA (California) residents.]',
    ],
  },
  {
    title: '7. Children\'s privacy',
    body: [
      'HowLongUntil is not directed at children under 13, and we do not knowingly collect personal information from children under 13.',
    ],
  },
  {
    title: '8. Changes to this policy',
    body: [
      'We may update this policy from time to time. Material changes will be reflected by an updated "last modified" date at the top of this page.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 20px' }}>
      <style>{`
        .legal-glow { transition: box-shadow 220ms ease; }
        .legal-glow:hover { box-shadow: 0 0 0 1.5px rgba(${GLOW}, 0.4); }
      `}</style>

      <div className="mb-10 anim-fade-up">
        <p className="text-caption font-bold mb-2 tracking-wide" style={{ color: `rgb(${GLOW})` }}>LEGAL</p>
        <h1 className="text-title1 mb-2">Privacy Policy</h1>
        <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>Last updated: July 10, 2026</p>
      </div>

      <div className="flex flex-col gap-3">
        {SECTIONS.map((s, i) => (
          <details key={s.title} className="legal-glow ios-card-nested p-5 anim-fade-up" style={{ animationDelay: `${i * 50}ms` }} open={i === 0}>
            <summary className="text-headline cursor-pointer" style={{ color: `rgb(${GLOW})` }}>{s.title}</summary>
            <div className="mt-3 flex flex-col gap-2">
              {s.body.map((p, j) => (
                <p key={j} className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{p}</p>
              ))}
            </div>
          </details>
        ))}
      </div>

      <p className="text-caption mt-8 text-center" style={{ color: 'var(--text-secondary)' }}>
        Questions about this policy? <a href="/contact" className="underline" style={{ color: `rgb(${GLOW})` }}>Contact us</a>.
      </p>
    </div>
  );
}
