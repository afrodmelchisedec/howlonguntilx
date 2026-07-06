import { PasswordRotationBoardTabs } from '@/components/pro-tools/PasswordRotationBoardTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Password Rotation Priority Board',
  description: 'Drag your accounts onto a risk-priority line and see live urgency-coded rotation reminders based on real dates.',
};

export default function PasswordRotationBoardPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(46, 196, 182)' }}>PLAY</p>
          <h1 className="text-largetitle mb-2">Password Rotation Priority Board</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Drag by sensitivity. See exactly which password to change first.
          </p>
        </div>
        <PasswordRotationBoardTabs />
      </div>
    </div>
  );
}
