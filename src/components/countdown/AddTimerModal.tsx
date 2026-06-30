'use client';
import { useState } from 'react';

interface Timer { id: string; name: string; targetDate: Date | string; category: string }
interface Props { onClose: () => void; onAdded: (t: Timer) => void }

const CATEGORIES = [
  { id: 'personal',      label: 'Personal',      emoji: '👤', cls: 'gc-personal' },
  { id: 'work',          label: 'Work',           emoji: '💼', cls: 'gc-work' },
  { id: 'health',        label: 'Health',         emoji: '❤️', cls: 'gc-health' },
  { id: 'finance',       label: 'Finance',        emoji: '💰', cls: 'gc-finance' },
  { id: 'family',        label: 'Family',         emoji: '👨‍👩‍👧', cls: 'gc-family' },
  { id: 'travel',        label: 'Travel',         emoji: '✈️', cls: 'gc-travel' },
  { id: 'sports',        label: 'Sports',         emoji: '⚽', cls: 'gc-sports' },
  { id: 'education',     label: 'Education',      emoji: '🎓', cls: 'gc-education' },
  { id: 'space',         label: 'Space',          emoji: '🚀', cls: 'gc-space' },
  { id: 'nature',        label: 'Nature',         emoji: '🌍', cls: 'gc-nature' },
  { id: 'entertainment', label: 'Entertainment',  emoji: '🎬', cls: 'gc-entertainment' },
  { id: 'holidays',      label: 'Holidays',       emoji: '🎄', cls: 'gc-holidays' },
];

function daysFromNow(d: number) { const dt=new Date(); dt.setDate(dt.getDate()+d); dt.setHours(9,0,0,0); return dt.toISOString().slice(0,16); }
function nextDate(m: number, d: number) { const now=new Date(); const dt=new Date(now.getFullYear(),m-1,d,9,0); if(dt<=now) dt.setFullYear(dt.getFullYear()+1); return dt.toISOString().slice(0,16); }
function specDate(iso: string) { return iso+'T09:00'; }

const QUICK: Record<string,{label:string;name:string;date:string}[]> = {
  personal:     [{label:'🎂 My Birthday',name:'My Birthday',date:daysFromNow(180)},{label:'💍 Anniversary',name:'My Anniversary',date:daysFromNow(120)},{label:'🎓 My Graduation',name:'My Graduation',date:daysFromNow(365)},{label:'🏠 Moving Day',name:'Moving Day',date:daysFromNow(60)},{label:'🚗 Car Renewal',name:'Car Renewal',date:daysFromNow(90)},{label:'📅 New Year Goal',name:'New Year Resolution',date:nextDate(1,1)}],
  work:         [{label:'📋 Project Deadline',name:'Project Deadline',date:daysFromNow(30)},{label:'📊 Quarterly Review',name:'Q3 Review',date:daysFromNow(45)},{label:'💼 Job Interview',name:'Job Interview',date:daysFromNow(7)},{label:'🚀 Product Launch',name:'Product Launch',date:daysFromNow(60)},{label:'📝 Contract Renewal',name:'Contract Renewal',date:daysFromNow(90)},{label:'🏆 Performance Review',name:'Performance Review',date:daysFromNow(120)}],
  health:       [{label:'🏥 Doctor Appointment',name:'Doctor Appointment',date:daysFromNow(14)},{label:'💊 Prescription Refill',name:'Prescription Refill',date:daysFromNow(30)},{label:'🏃 Marathon Day',name:'Marathon Day',date:daysFromNow(90)},{label:'🦷 Dentist Visit',name:'Dentist Visit',date:daysFromNow(60)},{label:'🧘 Wellness Retreat',name:'Wellness Retreat',date:daysFromNow(45)},{label:'⚖️ Weight Goal Date',name:'Weight Goal Date',date:daysFromNow(120)}],
  finance:      [{label:'💵 Salary Day',name:'Salary Day',date:daysFromNow(25)},{label:'🏦 Loan Payment',name:'Loan Payment',date:daysFromNow(30)},{label:'📈 Investment Maturity',name:'Investment Maturity',date:daysFromNow(180)},{label:'🧾 Tax Deadline URA',name:'Tax Deadline (URA)',date:nextDate(6,30)},{label:'💳 Credit Card Due',name:'Credit Card Due',date:daysFromNow(15)},{label:'💹 Budget Day Uganda',name:'Uganda Budget Day',date:nextDate(6,13)}],
  family:       [{label:'🎂 Child Birthday',name:"Child's Birthday",date:daysFromNow(90)},{label:'👩 Mothers Day',name:"Mother's Day",date:nextDate(5,11)},{label:'👨 Fathers Day',name:"Father's Day",date:nextDate(6,15)},{label:'🎄 Christmas Together',name:'Christmas',date:nextDate(12,25)},{label:'🎓 Kids Graduation',name:'Kids Graduation',date:daysFromNow(300)},{label:'🍽️ Family Reunion',name:'Family Reunion',date:daysFromNow(150)}],
  travel:       [{label:'✈️ Next Holiday',name:'Next Holiday',date:daysFromNow(60)},{label:'🛂 Visa Expiry',name:'Visa Expiry',date:daysFromNow(120)},{label:'🏨 Hotel Check-in',name:'Hotel Check-in',date:daysFromNow(30)},{label:'🚢 Cruise Departure',name:'Cruise Departure',date:daysFromNow(90)},{label:'🎫 Tour Booking',name:'Tour Booking Deadline',date:daysFromNow(45)},{label:'🌍 Safari Trip',name:'Safari Trip',date:daysFromNow(180)}],
  sports:       [{label:'⚽ FIFA World Cup',name:'FIFA World Cup 2026',date:specDate('2026-06-11')},{label:'🏅 Olympics 2028',name:'Olympics 2028',date:specDate('2028-07-14')},{label:'🏈 Super Bowl',name:'Super Bowl 2027',date:specDate('2027-02-07')},{label:'🎾 Wimbledon',name:'Wimbledon 2026',date:nextDate(6,30)},{label:'🏆 Champions League Final',name:'Champions League Final',date:nextDate(5,31)},{label:'🚴 Tour de France',name:'Tour de France',date:nextDate(7,5)}],
  education:    [{label:'📝 Exam Day',name:'Exam Day',date:daysFromNow(30)},{label:'🎓 Graduation',name:'Graduation Ceremony',date:daysFromNow(180)},{label:'📚 Results Day',name:'Results Day',date:daysFromNow(45)},{label:'🏫 School Reopens',name:'School Reopens',date:daysFromNow(60)},{label:'💻 Course Deadline',name:'Course Deadline',date:daysFromNow(21)},{label:'📖 Scholarship Deadline',name:'Scholarship Deadline',date:daysFromNow(90)}],
  space:        [{label:'🌑 Solar Eclipse',name:'Next Solar Eclipse',date:specDate('2026-08-12')},{label:'🌕 Lunar Eclipse',name:'Next Lunar Eclipse',date:specDate('2026-03-03')},{label:'☄️ Perseid Meteors',name:'Perseid Meteor Shower',date:nextDate(8,12)},{label:'🚀 SpaceX Launch',name:'Next SpaceX Launch',date:daysFromNow(45)},{label:'🪐 Mars Opposition',name:'Mars Opposition 2027',date:specDate('2027-01-16')},{label:'🌌 Geminid Meteors',name:'Geminid Meteor Shower',date:nextDate(12,14)}],
  nature:       [{label:'🌸 Spring Equinox',name:'Spring Equinox',date:nextDate(3,20)},{label:'☀️ Summer Solstice',name:'Summer Solstice',date:nextDate(6,21)},{label:'🍂 Autumn Equinox',name:'Autumn Equinox',date:nextDate(9,22)},{label:'❄️ Winter Solstice',name:'Winter Solstice',date:nextDate(12,21)},{label:'🌊 Rainy Season Uganda',name:'Rainy Season Uganda',date:nextDate(3,1)},{label:'🌍 Earth Day',name:'Earth Day',date:nextDate(4,22)}],
  entertainment:[{label:'🏆 Oscars 2027',name:'The Oscars 2027',date:specDate('2027-03-28')},{label:'🎵 Grammy Awards',name:'Grammy Awards 2027',date:nextDate(2,2)},{label:'🎮 Game Release',name:'Game Release Day',date:daysFromNow(60)},{label:'🎬 Movie Premiere',name:'Movie Premiere',date:daysFromNow(30)},{label:'🎪 Music Festival',name:'Music Festival',date:daysFromNow(90)},{label:'📺 Season Finale',name:'Season Finale',date:daysFromNow(45)}],
  holidays:     [{label:'🎄 Christmas',name:'Christmas',date:nextDate(12,25)},{label:'🎆 New Year',name:'New Year 2027',date:specDate('2027-01-01')},{label:'🎃 Halloween',name:'Halloween',date:nextDate(10,31)},{label:'💝 Valentines Day',name:"Valentine's Day",date:nextDate(2,14)},{label:'🐣 Easter',name:'Easter 2027',date:specDate('2027-03-28')},{label:'🦃 Thanksgiving',name:'Thanksgiving',date:nextDate(11,27)}],
};

export function AddTimerModal({ onClose, onAdded }: Props) {
  const [category, setCategory] = useState('personal');
  const [name, setName]         = useState('');
  const [date, setDate]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const activeCat = CATEGORIES.find(c => c.id === category)!;
  const quickOptions = QUICK[category] ?? [];

  async function save() {
    if (!name.trim() || !date) { setError('Please fill in event name and date'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/timers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, targetDate: new Date(date).toISOString(), category }),
    });
    if (res.ok) { onAdded(await res.json()); }
    else { setError('Failed to save. Please try again.'); }
    setLoading(false);
  }

  const daysAway = date ? Math.max(0, Math.floor((new Date(date).getTime() - Date.now()) / 86400000)) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ios-sheet anim-scale-in w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="p-6 sticky top-0 z-10 rounded-t-[28px]" style={{ borderBottom: '1px solid var(--border-hairline)', background: 'var(--bg-elevated)' }}>
          <h2 className="text-title3">New countdown</h2>
          <p className="text-footnote mt-0.5">Add any event, deadline, or milestone</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1 — category grid */}
          <div>
            <label className="text-caption block mb-2">1 · Category</label>
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => { setCategory(c.id); setName(''); setDate(''); }}
                  className={`glow press ${c.cls} flex flex-col items-center gap-1 py-2.5 px-1 rounded-[14px] border text-xs font-semibold transition-all duration-200`}
                  style={{
                    borderColor: category === c.id ? 'rgba(var(--glow),0.8)' : 'var(--border-hairline)',
                    background: category === c.id ? 'rgba(var(--glow),0.1)' : 'transparent',
                    color: category === c.id ? 'rgb(var(--glow))' : 'var(--text-secondary)',
                    boxShadow: category === c.id ? '0 0 0 1px rgba(var(--glow),0.3), 0 0 16px rgba(var(--glow),0.2)' : 'none',
                  }}>
                  <span className="text-lg leading-none">{c.emoji}</span>
                  <span className="truncate w-full text-center leading-tight">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 — quick picks */}
          <div>
            <label className="text-caption block mb-2">2 · Quick add — {activeCat?.label}</label>
            <div className="grid grid-cols-2 gap-2">
              {quickOptions.map(opt => (
                <button key={opt.name} onClick={() => { setName(opt.name); setDate(opt.date); }}
                  className={`glow press ${activeCat.cls} text-left text-sm px-3 py-2.5 rounded-[14px] border transition-all duration-200`}
                  style={{
                    borderColor: name === opt.name ? 'rgba(var(--glow),0.8)' : 'var(--border-hairline)',
                    background: name === opt.name ? 'rgba(var(--glow),0.1)' : 'transparent',
                    color: name === opt.name ? 'rgb(var(--glow))' : 'var(--text-secondary)',
                    fontWeight: name === opt.name ? 600 : 400,
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3 — custom */}
          <div>
            <label className="text-caption block mb-2">3 · Or custom event</label>
            <div className="space-y-3">
              <input className="input-glow w-full px-4 py-3 text-sm"
                placeholder="Event name…" value={name} onChange={e => setName(e.target.value)} />
              <input type="datetime-local"
                className="input-glow w-full px-4 py-3 text-sm"
                value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          {/* Preview */}
          {name && date && (
            <div className={`ios-card-nested glow ${activeCat.cls} anim-scale-in p-4 flex items-center justify-between`}>
              <div>
                <p className="text-headline">{name}</p>
                <p className="text-footnote mt-0.5">
                  {new Date(date).toLocaleDateString('en-US',{weekday:'short',month:'long',day:'numeric',year:'numeric'})}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black tabular" style={{ color: 'rgb(var(--glow))' }}>{daysAway}d</p>
                <p className="text-caption">away</p>
              </div>
            </div>
          )}

          {error && <p className="text-sm font-medium" style={{ color: 'rgb(var(--accent-red))' }}>{error}</p>}
        </div>

        <div className="p-6 flex gap-3 sticky bottom-0 rounded-b-[28px]" style={{ borderTop: '1px solid var(--border-hairline)', background: 'var(--bg-elevated)' }}>
          <button onClick={onClose} className="btn-tinted flex-1 text-center" style={{ background: 'var(--bg-elevated-2)', color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button onClick={save} disabled={loading || !name || !date}
            className="btn-filled flex-1 text-center disabled:opacity-40">
            {loading ? 'Saving…' : 'Save countdown →'}
          </button>
        </div>
      </div>
    </div>
  );
}
