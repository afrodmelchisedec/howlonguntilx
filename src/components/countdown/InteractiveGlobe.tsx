'use client';
import { useEffect, useRef, useState } from 'react';

const PINS = [
  { name: 'FIFA World Cup', date: '2026-06-11', emoji: '⚽', color: '64, 156, 255', x: 28, y: 42, country: 'USA/Canada/Mexico' },
  { name: 'Wimbledon 2026', date: '2026-06-29', emoji: '🎾', color: '48, 219, 91', x: 47, y: 28, country: 'London, UK' },
  { name: 'Paris Olympics', date: '2028-07-26', emoji: '🏅', color: '255, 159, 10', x: 49, y: 30, country: 'Paris, France' },
  { name: 'Cherry Blossom', date: '2026-03-25', emoji: '🌸', color: '255, 75, 110', x: 80, y: 35, country: 'Tokyo, Japan' },
  { name: 'Carnival Rio', date: '2026-02-14', emoji: '🎭', color: '218, 143, 255', x: 32, y: 62, country: 'Rio, Brazil' },
  { name: 'Diwali 2025', date: '2025-10-20', emoji: '🪔', color: '255, 214, 10', x: 67, y: 40, country: 'India' },
  { name: 'Oktoberfest', date: '2026-09-19', emoji: '🍺', color: '255, 149, 0', x: 51, y: 27, country: 'Munich, Germany' },
  { name: 'Lunar New Year', date: '2026-02-17', emoji: '🐉', color: '255, 75, 110', x: 78, y: 38, country: 'China' },
  { name: 'Safari Season', date: '2026-07-01', emoji: '🦁', color: '255, 159, 10', x: 56, y: 58, country: 'Kenya, Africa' },
  { name: 'Aurora Season', date: '2025-11-01', emoji: '🌌', color: '100, 240, 235', x: 50, y: 12, country: 'Iceland' },
];

function getDays(dateStr: string) {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

export function InteractiveGlobe() {
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [rotStart, setRotStart] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const animRef = useRef<number>(0);
  const rotRef = useRef(0);

  // Auto-rotate when not dragging
  useEffect(() => {
    let last = performance.now();
    function loop(now: number) {
      if (!dragging) {
        const dt = now - last;
        rotRef.current = (rotRef.current + dt * 0.015) % 360;
        setRotation(rotRef.current);
      }
      last = now;
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [dragging]);

  function onMouseDown(e: React.MouseEvent) {
    setDragging(true);
    setDragStart(e.clientX);
    setRotStart(rotRef.current);
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    const delta = e.clientX - dragStart;
    rotRef.current = rotStart + delta * 0.4;
    setRotation(rotRef.current);
  }

  function onMouseUp() { setDragging(false); }

  // Calculate visible position with rotation
  function pinPos(pin: typeof PINS[0]) {
    const baseX = pin.x;
    const rotatedX = ((baseX + rotation / 3.6) % 100 + 100) % 100;
    // Pins near edges (0-10 or 90-100%) are behind the globe
    const visible = rotatedX > 8 && rotatedX < 92;
    // Scale based on how centered horizontally (perspective effect)
    const distFromCenter = Math.abs(rotatedX - 50);
    const scale = 1 - (distFromCenter / 50) * 0.4;
    const opacity = visible ? Math.max(0.2, 1 - (distFromCenter / 50) * 0.7) : 0;
    return { x: rotatedX, y: pin.y, visible, scale, opacity };
  }

  const selPin = selected !== null ? PINS[selected] : null;

  return (
    <div className="ios-card overflow-hidden" style={{ border: '1px solid var(--border-hairline)' }}>
      <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-hairline)' }}>
        <div>
          <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>INTERACTIVE GLOBE</p>
          <p className="text-headline mt-0.5">Events around the world</p>
        </div>
        <p className="text-footnote" style={{ color: 'var(--text-tertiary)' }}>← Drag to rotate →</p>
      </div>

      {/* Globe */}
      <div className="relative select-none"
        style={{ height: 280, background: 'var(--bg-elevated-2)', cursor: dragging ? 'grabbing' : 'grab', overflow: 'hidden' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}>

        {/* Globe circle */}
        <div className="absolute rounded-full" style={{
          width: 220, height: 220,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle at 35% 35%, rgba(64, 156, 255, 0.15), rgba(0,0,0,0) 60%), var(--bg-elevated)',
          border: '1px solid var(--border-hairline)',
          boxShadow: 'inset -20px -20px 60px rgba(0,0,0,0.08)',
        }}>
          {/* Latitude lines */}
          {[30, 50, 70].map(y => (
            <div key={y} className="absolute w-full" style={{
              top: `${y}%`,
              height: 1,
              background: 'var(--border-hairline)',
              opacity: 0.5,
            }} />
          ))}
          {/* Longitude lines */}
          {[25, 50, 75].map(x => (
            <div key={x} className="absolute h-full" style={{
              left: `${x}%`,
              width: 1,
              background: 'var(--border-hairline)',
              opacity: 0.5,
            }} />
          ))}
        </div>

        {/* Event pins */}
        {PINS.map((pin, i) => {
          const pos = pinPos(pin);
          if (!pos.visible) return null;
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `calc(50% + (${pos.x - 50}%) * 1.1)`,
                top: `${pos.y}%`,
                transform: `translate(-50%, -50%) scale(${pos.scale})`,
                opacity: pos.opacity,
                zIndex: hovered === i ? 20 : 10,
                cursor: 'pointer',
                transition: 'opacity 0.1s',
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={(e) => { e.stopPropagation(); setSelected(selected === i ? null : i); }}
            >
              {/* Pin */}
              <div className="flex flex-col items-center">
                <div className="rounded-full flex items-center justify-center"
                  style={{
                    width: hovered === i || selected === i ? 36 : 28,
                    height: hovered === i || selected === i ? 36 : 28,
                    background: `rgba(${pin.color}, 0.15)`,
                    border: `2px solid rgb(${pin.color})`,
                    fontSize: hovered === i || selected === i ? 16 : 12,
                    transition: 'all 0.2s var(--spring)',
                    boxShadow: `0 0 12px rgba(${pin.color}, 0.4)`,
                  }}>
                  {pin.emoji}
                </div>
                <div style={{ width: 2, height: 6, background: `rgb(${pin.color})`, borderRadius: 1 }} />
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: `rgb(${pin.color})` }} />
              </div>

              {/* Tooltip on hover */}
              {hovered === i && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 ios-card px-3 py-2 whitespace-nowrap text-xs"
                  style={{ zIndex: 30, pointerEvents: 'none', boxShadow: 'var(--shadow-elevated)' }}>
                  <div className="font-bold" style={{ color: `rgb(${pin.color})` }}>{pin.name}</div>
                  <div style={{ color: 'var(--text-tertiary)' }}>{getDays(pin.date)} days · {pin.country}</div>
                </div>
              )}
            </div>
          );
        })}

        {/* Drag hint */}
        {!dragging && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-caption px-3 py-1.5 rounded-full"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-hairline)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
            🌍 Drag to explore · Tap a pin
          </div>
        )}
      </div>

      {/* Selected event detail */}
      {selPin && (
        <div className="mx-4 mb-4 mt-3 rounded-2xl p-4 anim-scale-in" style={{
          background: `rgba(${selPin.color}, 0.08)`,
          border: `1px solid rgba(${selPin.color}, 0.25)`,
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 24 }}>{selPin.emoji}</span>
              <div>
                <div className="text-headline" style={{ color: 'var(--text-primary)' }}>{selPin.name}</div>
                <div className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{selPin.country}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-title2 font-black tabular" style={{ color: `rgb(${selPin.color})` }}>
                {getDays(selPin.date)}
              </div>
              <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>days away</div>
            </div>
          </div>
        </div>
      )}

      {/* Event list */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-2">
          {PINS.map((pin, i) => (
            <button key={i}
              onClick={() => setSelected(selected === i ? null : i)}
              className="press text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
              style={{
                background: selected === i ? `rgba(${pin.color}, 0.15)` : 'var(--bg-elevated-2)',
                color: selected === i ? `rgb(${pin.color})` : 'var(--text-secondary)',
                border: `1px solid ${selected === i ? `rgba(${pin.color}, 0.4)` : 'var(--border-hairline)'}`,
                cursor: 'pointer',
              }}>
              {pin.emoji} {pin.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
