'use client';
import { useEffect, useRef } from 'react';

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Stars
    const STAR_COUNT = 120;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      opacity: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    // Data points (larger glowing dots)
    const DATA_COUNT = 18;
    const dataPoints = Array.from({ length: DATA_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 3 + 1.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      hue: [83, 64, 125, 218, 48, 255][Math.floor(Math.random() * 6)],
      sat: Math.random() * 30 + 60,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    }));

    // Connection lines between nearby data points
    const MAX_DIST = 180;

    let animId: number;
    let t = 0;

    function draw() {
      ctx!.clearRect(0, 0, W, H);
      t += 0.008;

      // Draw stars
      for (const s of stars) {
        s.x = (s.x + s.vx + W) % W;
        s.y = (s.y + s.vy + H) % H;
        s.pulse += 0.02;
        const op = s.opacity * (0.7 + 0.3 * Math.sin(s.pulse));
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(200, 200, 255, ${op})`;
        ctx!.fill();
      }

      // Draw connections
      for (let i = 0; i < dataPoints.length; i++) {
        for (let j = i + 1; j < dataPoints.length; j++) {
          const a = dataPoints[i], b = dataPoints[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < MAX_DIST) {
            const op = (1 - dist / MAX_DIST) * 0.12;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.strokeStyle = `rgba(125, 118, 255, ${op})`;
            ctx!.lineWidth = 0.8;
            ctx!.stroke();
          }
        }
      }

      // Draw data points
      for (const d of dataPoints) {
        d.x = (d.x + d.vx + W) % W;
        d.y = (d.y + d.vy + H) % H;
        d.pulse += d.pulseSpeed;
        const scale = 0.8 + 0.2 * Math.sin(d.pulse);
        const r = d.r * scale;
        const op = 0.4 + 0.3 * Math.sin(d.pulse);

        // Glow
        const grad = ctx!.createRadialGradient(d.x, d.y, 0, d.x, d.y, r * 4);
        grad.addColorStop(0, `hsla(${d.hue}, ${d.sat}%, 70%, ${op})`);
        grad.addColorStop(1, `hsla(${d.hue}, ${d.sat}%, 70%, 0)`);
        ctx!.beginPath();
        ctx!.arc(d.x, d.y, r * 4, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();

        // Core dot
        ctx!.beginPath();
        ctx!.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${d.hue}, ${d.sat}%, 75%, ${op + 0.2})`;
        ctx!.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.65,
      }}
    />
  );
}
