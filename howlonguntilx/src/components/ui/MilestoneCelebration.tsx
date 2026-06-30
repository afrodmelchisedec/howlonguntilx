'use client';
import { useEffect, useState } from 'react';

interface Props {
  timerName: string;
  onClose: () => void;
}

const COLORS = ['#534AB7','#8B7CF8','#1D9E75','#D4537E','#F5A623','#50E3C2','#E24B4A','#C084FC'];
const MESSAGES = [
  'You crushed it! 🎉',
  'Milestone achieved! 🏆',
  'You made it! ⭐',
  'Goal unlocked! 🔓',
  'You did it! 🚀',
];

export function MilestoneCelebration({ timerName, onClose }: Props) {
  const [particles, setParticles] = useState<any[]>([]);
  const [visible, setVisible] = useState(true);
  const [checkAnim, setCheckAnim] = useState(false);
  const [msg] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);

  useEffect(() => {
    const ps = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      left: Math.random() * 100 + '%',
      delay: Math.random() * 0.8 + 's',
      duration: (Math.random() * 1.5 + 1.2) + 's',
      size: (Math.random() * 8 + 4) + 'px',
      rotation: Math.random() * 360 + 'deg',
    }));
    setParticles(ps);
    setTimeout(() => setCheckAnim(true), 200);
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 400); }, 5000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.3s ease' }}
      onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <div key={p.id}
            className="absolute top-0 rounded-sm"
            style={{
              left: p.left,
              width: p.size, height: p.size,
              background: p.color,
              transform: 'rotate(' + p.rotation + ')',
              animation: 'confettiFall ' + p.duration + ' ' + p.delay + ' ease-in forwards',
              opacity: 0.9,
            }}
          />
        ))}
      </div>

      <div
        className="ios-sheet relative p-8 text-center max-w-sm w-full"
        style={{ animation: 'scaleIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both', boxShadow: '0 0 0 1px rgba(var(--accent-brand),0.2), 0 20px 80px rgba(var(--accent-brand),0.3), var(--shadow-elevated)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center mb-5">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: checkAnim ? 'linear-gradient(135deg,#1D9E75,#50E3C2)' : 'var(--bg-elevated-2)',
              transition: 'background 0.6s ease',
              boxShadow: checkAnim ? '0 0 0 8px rgba(29,158,117,0.15), 0 0 30px rgba(29,158,117,0.4)' : 'none',
              animation: checkAnim ? 'checkPulse 1.5s ease infinite' : 'none',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path
                d="M8 20 L16 28 L32 12"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="40"
                strokeDashoffset={checkAnim ? 0 : 40}
                style={{ transition: 'stroke-dashoffset 0.6s ease 0.3s' }}
              />
            </svg>
          </div>
        </div>

        <p className="text-title2 mb-1">{msg}</p>
        <p className="text-footnote mb-1">You reached your countdown for</p>
        <p className="text-base font-bold mb-6" style={{ color: 'rgb(var(--accent-brand))' }}>"{timerName}"</p>

        <div className="flex justify-center gap-1 mb-6">
          {[0,1,2,3,4].map(i => (
            <span key={i} className="text-2xl"
              style={{ animation: 'starPop 0.4s ' + (i * 0.1) + 's cubic-bezier(0.34,1.56,0.64,1) both', display:'inline-block' }}>
              ⭐
            </span>
          ))}
        </div>

        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16">
            <svg className="absolute inset-0 -rotate-90" width="64" height="64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border-hairline)" strokeWidth="4"/>
              <circle cx="32" cy="32" r="28" fill="none" stroke="#1D9E75" strokeWidth="4"
                strokeDasharray="176" strokeDashoffset={checkAnim ? 0 : 176}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease 0.5s' }}/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-black" style={{ color: '#1D9E75' }}>100%</div>
          </div>
        </div>

        <p className="text-footnote mb-5">Add another countdown to keep the streak going!</p>

        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
          className="btn-filled w-full">
          Keep going 🚀
        </button>
      </div>

      <style>{
        `@keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity:1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity:0; }
        }
        @keyframes checkPulse {
          0%,100% { box-shadow: 0 0 0 8px rgba(29,158,117,0.15), 0 0 30px rgba(29,158,117,0.4); }
          50%     { box-shadow: 0 0 0 16px rgba(29,158,117,0.05), 0 0 50px rgba(29,158,117,0.6); }
        }
        @keyframes starPop {
          0%   { transform: scale(0) rotate(-30deg); opacity:0; }
          100% { transform: scale(1) rotate(0deg);   opacity:1; }
        }
        @keyframes scaleIn {
          from { opacity:0; transform:scale(0.85); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes fadeIn {
          from { opacity:0; } to { opacity:1; }
        }`
      }</style>
    </div>
  );
}
