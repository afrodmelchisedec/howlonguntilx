import { FoodFestivalPassportTabs } from '@/components/pro-tools/FoodFestivalPassportTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Food Festivals — Festival Passport',
  description: 'Swipe to discover food festivals, watch a real ticket-stub countdown to your next one, and stamp your passport when you go.',
};

export default function FoodFestivalPassportPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(255, 90, 54)' }}>FOOD</p>
          <h1 className="text-largetitle mb-2">Food Festivals</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Swipe to build your bucket list. Watch the ticket stub count down. Stamp it when you go.
          </p>
        </div>
        <FoodFestivalPassportTabs />
      </div>
    </div>
  );
}
