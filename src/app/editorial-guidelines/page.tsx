// FILE: src/app/editorial-guidelines/page.tsx
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Editorial Guidelines | HowLongUntilX',
  description: 'How we research, write, source, and maintain articles on HowLongUntilX.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-title3 mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      <div className="text-callout" style={{ color: 'var(--text-secondary)' }}>{children}</div>
    </section>
  );
}

export default function EditorialGuidelinesPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)' }}>
      <StarField />
      <div className="relative z-10" style={{ maxWidth: 780, margin: '0 auto', padding: '24px 16px 64px' }}>
        <h1 className="text-title1 mb-3">Editorial guidelines</h1>
        <p className="text-callout mb-8" style={{ color: 'var(--text-secondary)' }}>
          How HowLongUntilX researches, writes, sources, and maintains the articles on this site —
          so you know exactly what's behind the numbers.
        </p>

        <Section title="What we do">
          <p className="mb-3">
            Every article on this site exists to answer one question directly: a realistic time
            range, backed by named sources, without the padding most search results bury it in.
          </p>
          <p>
            We are not a substitute for professional advice — medical, financial, legal, or
            otherwise — in any category where that distinction matters. Where it's relevant, a
            disclaimer appears directly on the article itself.
          </p>
        </Section>

        <Section title="How we source">
          <ul className="flex flex-col gap-2 list-disc pl-5">
            <li>Every specific figure or claim traces to a named, publicly checkable source — you'll find these linked at the bottom of each article, and cited inline where precision matters.</li>
            <li>We prioritize primary and authoritative sources — government health agencies, established medical institutions, official documentation, and peer-reviewed research — over aggregator or SEO-only content.</li>
            <li>Where a topic has genuine uncertainty or variability, we say so explicitly rather than presenting a false-precision single number.</li>
          </ul>
        </Section>

        <Section title="Who writes our content">
          <p>
            Articles are researched and written by our team, with a background in statistics and
            data analysis applied to interpreting and summarizing published source material
            accurately. Author credentials are shown on each article's byline. Where a topic
            requires professional review beyond research synthesis — for example, health content
            — we're transparent about that: if an article has been reviewed by a licensed
            professional, that's credited directly on the article. If it hasn't, no such claim is
            made.
          </p>
        </Section>

        <Section title="Keeping articles current">
          <p>
            Articles are revisited and updated as sources change or new information becomes
            available. When an article has been meaningfully updated after its original
            publish date, you'll see an "Updated" date on the article itself.
          </p>
        </Section>

        <Section title="Corrections">
          <p>
            If you spot an inaccuracy, outdated figure, or broken source link, we want to know —
            reach out via our <a href="/contact" className="underline underline-offset-2">contact page</a> and
            we'll review and correct it.
          </p>
        </Section>
      </div>
    </div>
  );
}