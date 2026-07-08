import { PhishingIdentityWatchTabs } from '@/components/pro-tools/PhishingIdentityWatchTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Phishing & Identity Theft — Phishing Radar & Identity Watch',
  description: 'A live Threat Gauge for suspicious messages, a Spot the Phish quiz, and an Identity Watch monitoring list with real check-cadence countdowns.',
};

export default function PhishingIdentityWatchPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(6, 182, 212)' }}>SCAM</p>
          <h1 className="text-largetitle mb-2">Phishing & Identity Theft</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Check the message before you click it. Check your identity before it's too late to matter.
          </p>
        </div>
        <PhishingIdentityWatchTabs />
      </div>
    </div>
  );
}
