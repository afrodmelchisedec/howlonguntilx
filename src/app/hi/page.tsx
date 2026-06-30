
import { SearchBar } from '@/components/countdown/SearchBar';
import { PopularGrid } from '@/components/countdown/PopularGrid';
import { getPopularEvents } from '@/lib/events';
import { t } from '@/lib/i18n/translations';

export const metadata = {
  title: 'कितना समय बचा है? | HowLongUntil',
  description: 'किसी भी घटना तक लाइव काउंटडाउन। AI का अनुमान नहीं — सेकंड तक सटीक।',
};

export default async function HiPage() {
  const events = await getPopularEvents(8);
  const locale = 'hi' as const;
  return (
    <div className="relative overflow-hidden min-h-[520px] flex items-center">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(83,74,183,0.1) 0%, transparent 70%)' }} />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-20 text-center w-full">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-4">{t(locale,'tagline')}</p>
        <h1 className="text-5xl sm:text-6xl font-black mb-4 leading-tight">
          {t(locale,'hero_title')}
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-10">{t(locale,'hero_sub')}</p>
        <SearchBar />
        <p className="text-xs text-gray-400 mt-4">{t(locale,'try_example')}</p>
        <div className="mt-16">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-4">{t(locale,'popular')}</p>
          <PopularGrid events={events} />
        </div>
      </div>
    </div>
  );
}
