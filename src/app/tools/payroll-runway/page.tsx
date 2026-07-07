import { PayrollRunwayTabs } from '@/components/pro-tools/PayrollRunwayTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Salary & Payroll Events — Payday Runway',
  description: 'A live countdown to your next payday paired with a draggable bill timeline and a real cash-flow projection that flags when you would go negative before payday.',
};

export default function PayrollRunwayPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(255, 184, 0)' }}>FINANCE</p>
          <h1 className="text-largetitle mb-2">Salary & Payroll Events</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            A countdown to payday that actually knows whether your money survives until it arrives.
          </p>
        </div>
        <PayrollRunwayTabs />
      </div>
    </div>
  );
}
