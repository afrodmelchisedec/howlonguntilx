import { SearchBar } from '@/components/countdown/SearchBar';
import { PopularGrid } from '@/components/countdown/PopularGrid';
import { CategoryStrip } from '@/components/ui/CategoryStrip';
import { WhyUs } from '@/components/ui/WhyUs';
import { RecentlyViewed } from '@/components/countdown/RecentlyViewed';
import { getPopularEvents } from '@/lib/events';

export default async function HomePage() {
  const events = await getPopularEvents(8);
  return (
    <div>
      {/* ── hero ──────────────────────────────────── */}
      <div className="relative overflow-hidden min-h-[520px] flex items-center">
        {/* animated blobs */}
        <div className="hero-blob w-[600px] h-[600px] opacity-[0.08] dark:opacity-[0.12] -top-40 -left-40"
          style={{ background:'radial-gradient(circle,#534AB7,#8B7CF8)', animationDelay:'-2s' }} />
        <div className="hero-blob w-[400px] h-[400px] opacity-[0.06] dark:opacity-[0.1] top-20 -right-20"
          style={{ background:'radial-gradient(circle,#C084FC,#534AB7)', animationDelay:'-4s', animationDuration:'9s' }} />
        <div className="hero-blob w-[300px] h-[300px] opacity-[0.05] bottom-0 left-1/2"
          style={{ background:'radial-gradient(circle,#1D9E75,#378ADD)', animationDelay:'-6s', animationDuration:'11s' }} />

        <div className="relative z-10 max-w-2xl mx-auto px-4 py-20 text-center w-full">
          <div className="anim-fade-up sg">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-500 mb-5">
                Live · Real-time · To the second
              </p>
              <h1 className="text-5xl sm:text-6xl font-black mb-5 leading-[1.05] tracking-tight">
                How long<br/>
                <span className="gradient-text">until…?</span>
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 leading-relaxed max-w-md mx-auto">
                Not an AI guess — a live clock ticking to your exact moment.
              </p>
            </div>
            <div><SearchBar /></div>
            <p className="text-xs text-gray-400 mt-4">
              Try: "Christmas" · "FIFA World Cup" · "Solar Eclipse" · "Salary Day"
            </p>
          </div>
        </div>
      </div>

      <CategoryStrip />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <PopularGrid events={events} />
      </div>
      <div className="max-w-3xl mx-auto px-4 pb-8">
        <RecentlyViewed />
      </div>
      <WhyUs />
    </div>
  );
}
