
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const event = searchParams.get('event') ?? 'Event';
  const days  = searchParams.get('days')  ?? '0';
  const hours = searchParams.get('hours') ?? '0';

  const urgentColor = Number(days) < 7 ? '#EF4444' : Number(days) < 30 ? '#F97316' : '#534AB7';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px', height: '630px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a14 0%, #13131f 50%, #1a1a2e 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Background glow */}
        <div style={{
          position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(83,74,183,0.2) 0%, transparent 70%)',
          top: '-100px', left: '-100px',
        }} />
        <div style={{
          position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(192,132,252,0.1) 0%, transparent 70%)',
          bottom: '-50px', right: '-50px',
        }} />

        {/* Logo */}
        <div style={{ fontSize: '22px', fontWeight: 700, color: 'white', marginBottom: '40px', opacity: 0.7 }}>
          How<span style={{ color: '#8B7CF8' }}>Long</span>Until
        </div>

        {/* Event name */}
        <div style={{
          fontSize: event.length > 20 ? '44px' : '56px',
          fontWeight: 900, color: 'white', textAlign: 'center',
          marginBottom: '24px', maxWidth: '900px', lineHeight: 1.1,
        }}>
          {event}
        </div>

        {/* Days */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '20px' }}>
          <span style={{ fontSize: '120px', fontWeight: 900, color: urgentColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {days}
          </span>
          <span style={{ fontSize: '40px', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
            days left
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '500px', height: '6px', background: 'rgba(255,255,255,0.1)',
          borderRadius: '3px', overflow: 'hidden', marginBottom: '32px',
        }}>
          <div style={{
            height: '100%', borderRadius: '3px',
            background: 'linear-gradient(90deg, #534AB7, #8B7CF8)',
            width: Math.min(100, Math.round((1 - Number(days) / 365) * 100)) + '%',
          }} />
        </div>

        {/* CTA */}
        <div style={{
          fontSize: '18px', color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500,
        }}>
          howlonguntilx.com — Live countdown · To the second
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
