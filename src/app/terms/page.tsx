// FILE: src/app/terms/page.tsx
const GLOW = '129, 178, 255';

export const metadata = {
  title: 'Terms of Service — HowLongUntil',
  description: 'The terms that govern your use of HowLongUntil.',
  alternates: { canonical: 'https://www.howlonguntilx.com/terms' },
};

// TODO: Have this reviewed by a lawyer before relying on it for compliance —
// especially sections 4 (Pro subscriptions/billing) and 7 (liability), which
// should match your actual payment processor's terms and your jurisdiction.
const SECTIONS = [
  {
    title: '1. Acceptance of these terms',
    body: [
      'By accessing or using HowLongUntil ("the Service"), you agree to be bound by these Terms of Service. If you don\'t agree, please don\'t use the Service.',
    ],
  },
  {
    title: '2. Description of the Service',
    body: [
      'HowLongUntil provides countdown, tracking, and interactive planning tools across categories including Tech, Finance, Food, Travel, Leisure, and Scam Safety. Some features are available for free; others require a Pro subscription.',
      'Tools that display forecasts, scores, or estimates (for example, weather-related "clarity" factors, or event dates not yet officially confirmed by an organizer) are provided for planning convenience and are not guaranteed to be accurate. Always verify time-sensitive or safety-relevant information against an authoritative source.',
    ],
  },
  {
    title: '3. Accounts',
    body: [
      'You must provide accurate information when creating an account and are responsible for maintaining the security of your login credentials.',
      'You\'re responsible for all activity that occurs under your account. Let us know immediately if you suspect unauthorized access.',
      'We reserve the right to suspend or terminate accounts that violate these Terms.',
    ],
  },
  {
    title: '4. Pro subscriptions and billing',
    body: [
      'Pro tier features are billed on a recurring basis at the price shown at checkout. [TODO: confirm billing cadence, trial terms, and refund policy, and name your payment processor here, e.g. Stripe.]',
      'You may cancel your Pro subscription at any time; access continues until the end of the current billing period. We do not offer prorated refunds for partial billing periods, except where required by law.',
      'Prices are subject to change with reasonable advance notice.',
    ],
  },
  {
    title: '5. Acceptable use',
    body: [
      'You agree not to: misuse the Service to violate any law; attempt to gain unauthorized access to accounts or systems; scrape, reverse-engineer, or resell the Service without permission; or use the Service to distribute malware, spam, or harmful content.',
      'Content you submit (comments, saved names, etc.) must not be illegal, harassing, or infringe on others\' rights. We may remove content or suspend accounts that violate this.',
    ],
  },
  {
    title: '6. Intellectual property',
    body: [
      'HowLongUntil\'s design, code, and original content are owned by us or our licensors. You may not copy, redistribute, or create derivative products from the Service without permission.',
      'You retain ownership of any content you submit (such as comments), but grant us a license to display it within the Service.',
    ],
  },
  {
    title: '7. Disclaimers and limitation of liability',
    body: [
      'The Service is provided "as is" without warranties of any kind, express or implied. We do not guarantee the Service will be uninterrupted, error-free, or that any forecast, countdown, or estimate will be accurate.',
      'To the fullest extent permitted by law, HowLongUntil is not liable for any indirect, incidental, or consequential damages arising from your use of the Service. [TODO: confirm liability cap language with legal counsel for your jurisdiction.]',
    ],
  },
  {
    title: '8. Termination',
    body: [
      'You may stop using the Service and delete your account at any time. We may suspend or terminate access to the Service, with or without notice, for conduct that violates these Terms or is otherwise harmful to other users or the Service.',
    ],
  },
  {
    title: '9. Changes to these terms',
    body: [
      'We may update these Terms from time to time. Material changes will be reflected by an updated "last modified" date at the top of this page. Continued use of the Service after changes constitutes acceptance of the updated Terms.',
    ],
  },
  {
    title: '10. Contact',
    body: [
      'Questions about these Terms? Reach out via our Contact page.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 20px' }}>
      <style>{`
        .legal-glow { transition: box-shadow 220ms ease; }
        .legal-glow:hover { box-shadow: 0 0 0 1.5px rgba(${GLOW}, 0.4); }
      `}</style>

      <div className="mb-10 anim-fade-up">
        <p className="text-caption font-bold mb-2 tracking-wide" style={{ color: `rgb(${GLOW})` }}>LEGAL</p>
        <h1 className="text-title1 mb-2">Terms of Service</h1>
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
        See also our <a href="/privacy" className="underline" style={{ color: `rgb(${GLOW})` }}>Privacy Policy</a>.
      </p>
    </div>
  );
}
