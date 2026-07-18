'use client';
import { useMemo, useState } from 'react';
import { ToolProGate } from './ToolProGate';

function PaydayBurnRateInner() {
  const [payday, setPayday] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 12);
    return d.toISOString().slice(0, 10);
  });
  const [balance, setBalance] = useState(400);
  const [dailySpend, setDailySpend] = useState(25);

  const { daysUntilPayday, daysOfRunway, willRunOut } = useMemo(() => {
    const now = new Date();
    const target = new Date(payday);
    const days = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
    const runway = dailySpend > 0 ? Math.floor(balance / dailySpend) : Infinity;
    return { daysUntilPayday: days, daysOfRunway: runway, willRunOut: runway < days };
  }, [payday, balance, dailySpend]);

  const barColor = willRunOut ? 'rgb(var(--accent-red))' : 'rgb(var(--accent-green))';
  const runwayPct = daysUntilPayday > 0 ? Math.min(100, Math.round((daysOfRunway / daysUntilPayday) * 100)) : 100;

  return (
    <div className="ios-card p-6 gc-finance glow">
      <h3 className="text-headline mb-1">💵 Payday Burn Rate</h3>
      <p className="text-footnote mb-4">See if your money will last until payday, at your current pace.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <label className="text-footnote">
          Next payday
          <input type="date" value={payday} onChange={e => setPayday(e.target.value)}
            className="ios-card-nested w-full mt-1 px-2 py-1.5 text-callout" style={{ color: 'var(--text-primary)' }} />
        </label>
        <label className="text-footnote">
          Current balance ($)
          <input type="number" value={balance} onChange={e => setBalance(Number(e.target.value))}
            className="ios-card-nested w-full mt-1 px-2 py-1.5 text-callout" style={{ color: 'var(--text-primary)' }} />
        </label>
        <label className="text-footnote">
          Avg daily spend ($)
          <input type="number" value={dailySpend} onChange={e => setDailySpend(Number(e.target.value))}
            className="ios-card-nested w-full mt-1 px-2 py-1.5 text-callout" style={{ color: 'var(--text-primary)' }} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="ios-card-nested text-center p-3">
          <div className="text-2xl font-black tabular" style={{ color: 'rgb(var(--accent-brand))' }}>{daysUntilPayday}</div>
          <div className="text-caption mt-0.5">Days to payday</div>
        </div>
        <div className="ios-card-nested text-center p-3">
          <div className="text-2xl font-black tabular" style={{ color: barColor }}>
            {Number.isFinite(daysOfRunway) ? daysOfRunway : '∞'}
          </div>
          <div className="text-caption mt-0.5">Days your balance lasts</div>
        </div>
      </div>

      <div className="progress-track" style={{ height: 8 }}>
        <div className="progress-fill" style={{ width: runwayPct + '%', background: barColor }} />
      </div>
      <p className="text-footnote mt-3">
        {willRunOut
          ? `At this pace you'll run out about ${daysUntilPayday - (Number.isFinite(daysOfRunway) ? daysOfRunway : 0)} day(s) before payday.`
          : `You're on pace to make it to payday with room to spare.`}
      </p>
    </div>
  );
}

export function PaydayBurnRate({ isPro = false }: { isPro?: boolean }) {
  return (
    <ToolProGate isPro={isPro} title="Track every payday with Premium" desc="Unlock saved history across pay periods and custom reminders.">
      <PaydayBurnRateInner />
    </ToolProGate>
  );
}
