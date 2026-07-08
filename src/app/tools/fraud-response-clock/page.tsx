import { FraudResponseClockTabs } from '@/components/pro-tools/FraudResponseClockTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Financial Fraud — Fraud Response Clock',
  description: 'Track fraud incidents with real dispute-deadline countdowns, an action checklist, a 5-axis Risk Radar, and quick-copy emergency contacts.',
};

export default function FraudResponseClockPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(255, 59, 92)' }}>SCAM</p>
          <h1 className="text-largetitle mb-2">Financial Fraud</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Every hour matters after fraud. Know exactly how many you have left.
          </p>
        </div>
        <FraudResponseClockTabs />
      </div>
    </div>
  );
}
