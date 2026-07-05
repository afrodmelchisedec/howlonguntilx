// FILE: src/components/pro-tools/RecipeBatchDial.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { RECIPE_BATCH_DIAL_COMMENTS } from '@/lib/seedComments';
import { RECIPE_PRESETS, type RecipePreset } from '@/lib/recipePresets';

const MIN_SERVINGS = 1;
const MAX_SERVINGS_FREE = 8;
const MAX_SERVINGS_PRO = 60;

const DIAL_SIZE = 260;
const CX = DIAL_SIZE / 2;
const CY = DIAL_SIZE / 2;
const KNOB_RADIUS = 96;

// Rotary dial sweeps 270° clockwise starting from the lower-left, leaving a
// 90° dead zone at the top — same convention as a volume knob.
const ARC_START = 135;  // degrees, math convention (0 = right, CCW positive)
const ARC_SWEEP = -270; // sweeping clockwise (negative in CCW-positive math)

function servingsToAngle(servings: number, max: number): number {
  const ratio = (servings - MIN_SERVINGS) / (max - MIN_SERVINGS);
  return ARC_START + ARC_SWEEP * ratio;
}

function angleToPoint(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

function pointerToServings(clientX: number, clientY: number, rect: DOMRect, max: number): number {
  const scale = DIAL_SIZE / rect.width;
  const x = (clientX - rect.left) * scale;
  const y = (clientY - rect.top) * scale;
  const dx = x - CX;
  const dy = CY - y;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  // Fold the angle into the 270° usable sweep, clamping in the 90° dead zone
  // at the top to whichever end is nearer.
  let normalized = ARC_START - angle;
  if (normalized < 0) normalized += 360;
  if (normalized > 270) {
    normalized = normalized - 270 < 45 ? 270 : 0;
  }
  const ratio = normalized / 270;
  const raw = MIN_SERVINGS + ratio * (max - MIN_SERVINGS);
  return Math.round(raw);
}

function fmtAmount(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, '').replace(/\.$/, '');
}

export function RecipeBatchDial() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const maxServings = isPro ? MAX_SERVINGS_PRO : MAX_SERVINGS_FREE;

  const [recipe, setRecipe] = useState<RecipePreset>(RECIPE_PRESETS[0]);
  const [servings, setServings] = useState(recipe.baseServings);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pulse, setPulse] = useState(false);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(212);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const dialRef = useRef<HTMLDivElement>(null);
  const toastedThisDrag = useRef(false);

  const multiplier = servings / recipe.baseServings;

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 200);
    return () => clearTimeout(t);
  }, [servings]);

  // Some recipe presets default to more servings than the free tier allows
  // (e.g. cookies default to 12, free cap is 8). Without this, the dial's
  // angle math receives a ratio > 1 and draws a broken, over-swept arc.
  // Clamp on mount and whenever the tier or max changes.
  useEffect(() => {
    setServings(prev => Math.min(prev, maxServings));
  }, [maxServings]);

  // Reload config for Pro users on mount
  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/recipe-batch-dial')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          const found = RECIPE_PRESETS.find(r => r.id === data.config.recipeId);
          if (found) {
            setRecipe(found);
            setServings(Math.min(data.config.servings, MAX_SERVINGS_PRO));
          }
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  function selectRecipe(preset: RecipePreset) {
    setRecipe(preset);
    setServings(Math.min(preset.baseServings, maxServings));
    setDropdownOpen(false);
  }

  function applyServings(next: number) {
    const clamped = Math.max(MIN_SERVINGS, Math.min(next, maxServings));
    if (!isPro && next > MAX_SERVINGS_FREE && !toastedThisDrag.current) {
      showToast(`Upgrade to Pro to batch-scale past ${MAX_SERVINGS_FREE} servings`, '⭐');
      toastedThisDrag.current = true;
    }
    setServings(clamped);
  }

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const next = pointerToServings(clientX, clientY, rect, maxServings);
    applyServings(next);
  }, [maxServings, isPro]);

  useEffect(() => {
    function onMove(e: PointerEvent) { if (dragging) handlePointerMove(e.clientX, e.clientY); }
    function onUp() { setDragging(false); toastedThisDrag.current = false; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, handlePointerMove]);

  function startDrag(clientX: number, clientY: number) {
    setDragging(true);
    handlePointerMove(clientX, clientY);
  }

  const knobAngle = servingsToAngle(servings, maxServings);
  const knobPos = angleToPoint(knobAngle, KNOB_RADIUS);

  const tickMarks = useMemo(() => {
    const count = 11;
    return Array.from({ length: count }).map((_, i) => {
      const angle = ARC_START + (ARC_SWEEP * i) / (count - 1);
      return { angle, isMajor: i % 5 === 0 };
    });
  }, []);

  const maxBaseAmount = Math.max(...recipe.ingredients.map(i => i.baseAmount));

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save your batch size', '⭐'); return; }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/tools/recipe-batch-dial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: recipe.id, servings }),
      });
      if (!res.ok) throw new Error('save failed');
      showToast('Batch size saved!', '💾');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSavingConfig(false);
    }
  }

  function requireAuth() { showToast('You need to sign up first', '🔒'); }

  function handleLike() {
    if (!session) { requireAuth(); return; }
    setToolLiked(prev => {
      setToolLikeCount(c => prev ? c - 1 : c + 1);
      return !prev;
    });
  }

  function handleShare() {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('Link copied!', '🔗'))
      .catch(() => showToast('Could not copy link', '⚠️'));
  }

  function handleCopyList() {
    const lines = [
      `${recipe.name} — ${servings} servings (${fmtAmount(multiplier)}x)`,
      ...recipe.ingredients.map(ing => `- ${fmtAmount(ing.baseAmount * multiplier)}${ing.unit ? ` ${ing.unit}` : ''} ${ing.name}`),
    ];
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => showToast('Ingredient list copied!', '📋'))
      .catch(() => showToast('Could not copy', '⚠️'));
  }

  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const showBatchTip = multiplier >= 3;
  const atFreeLimit = !isPro && servings >= MAX_SERVINGS_FREE;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: '0 0 0 1.5px rgba(255,122,60,0.25), 0 0 40px rgba(255,122,60,0.12)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: 'rgb(255, 122, 60)' }}>BATCH-SCALE DIAL</p>
            <h2 className="text-title2">{recipe.emoji} {recipe.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? 'Save this batch size to your account' : 'Upgrade to save your batch size'}
            >
              {isPro ? '💾' : '🔒'} {savingConfig ? 'Saving…' : 'Save'}
            </button>
            <div className="relative">
              <button onClick={() => setDropdownOpen(o => !o)} className="btn-filled press text-xs px-4 py-2">
                Change recipe
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                  <div className="ios-card anim-scale-in absolute right-0 mt-2 w-56 overflow-hidden z-40" style={{ boxShadow: 'var(--shadow-elevated)' }}>
                    {RECIPE_PRESETS.map(r => (
                      <button
                        key={r.id}
                        onClick={() => selectRecipe(r)}
                        className="sidebar-item w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium press"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <span>{r.emoji}</span>
                        <span>{r.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dial — sized so ticks + knob fit fully inside the viewBox, no overflow bleed */}
        <div className="flex flex-col items-center mb-6 mt-4">
          <div
            ref={dialRef}
            className="relative"
            style={{ width: DIAL_SIZE, height: DIAL_SIZE, touchAction: 'none' }}
          >
            <svg viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`} className="w-full h-full">
              {/* track */}
              <circle cx={CX} cy={CY} r={KNOB_RADIUS} fill="none" stroke="var(--border-hairline)" strokeWidth={10} />
              {/* progress arc */}
              <path
                d={(() => {
                  const startPt = angleToPoint(ARC_START, KNOB_RADIUS);
                  const endPt = angleToPoint(knobAngle, KNOB_RADIUS);
                  const sweptDeg = Math.abs(ARC_START - knobAngle);
                  const largeArc = sweptDeg > 180 ? 1 : 0;
                  return `M ${startPt.x} ${startPt.y} A ${KNOB_RADIUS} ${KNOB_RADIUS} 0 ${largeArc} 1 ${endPt.x} ${endPt.y}`;
                })()}
                stroke="rgb(255, 122, 60)"
                strokeWidth={10}
                strokeLinecap="round"
                fill="none"
                style={{ filter: 'drop-shadow(0 0 8px rgba(255,122,60,0.55))', transition: dragging ? 'none' : 'd 0.15s ease-out' }}
              />
              {/* tick marks */}
              {tickMarks.map((t, i) => {
                const p1 = angleToPoint(t.angle, KNOB_RADIUS + 14);
                const p2 = angleToPoint(t.angle, KNOB_RADIUS + (t.isMajor ? 22 : 18));
                return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--text-tertiary)" strokeWidth={t.isMajor ? 1.5 : 0.75} opacity={t.isMajor ? 0.6 : 0.3} />;
              })}
              {/* free-tier limit marker — shown to Pro users as a reference point;
                  for free users it would sit exactly on their own arc's end, so it's redundant */}
              {isPro && (
                <circle cx={angleToPoint(servingsToAngle(MAX_SERVINGS_FREE, maxServings), KNOB_RADIUS).x}
                  cy={angleToPoint(servingsToAngle(MAX_SERVINGS_FREE, maxServings), KNOB_RADIUS).y}
                  r={4} fill="rgb(var(--accent-orange))" />
              )}
              {/* knob handle */}
              <circle
                cx={knobPos.x} cy={knobPos.y} r={dragging ? 15 : 12}
                fill="rgb(255, 122, 60)" stroke="white" strokeWidth={3}
                style={{ cursor: 'grab', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))', transition: dragging ? 'none' : 'r 0.15s ease-out, cx 0.15s ease-out, cy 0.15s ease-out' }}
                onPointerDown={e => startDrag(e.clientX, e.clientY)}
              />
              {/* center readout */}
              <circle cx={CX} cy={CY} r={52} fill="var(--bg-elevated, rgba(255,255,255,0.04))" stroke="var(--border-hairline)" />
              <text x={CX} y={CY - 8} textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--text-primary)"
                style={{ transform: pulse ? 'scale(1.08)' : 'scale(1)', transformOrigin: `${CX}px ${CY}px`, transition: 'transform 0.15s ease-out' }}>
                {servings}
              </text>
              <text x={CX} y={CY + 14} textAnchor="middle" fontSize="10" fill="var(--text-tertiary)">servings · {fmtAmount(multiplier)}x</text>
            </svg>
          </div>
          <p className="text-caption mt-3" style={{ color: 'var(--text-tertiary)' }}>Drag the knob around the dial to scale the batch</p>
        </div>

        {/* Smart batch tip */}
        {showBatchTip && (
          <div className="ios-card-nested p-3 mb-6 flex items-center gap-3" style={{ borderLeft: '3px solid rgb(var(--accent-orange))' }}>
            <span className="text-lg flex-shrink-0">🍳</span>
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
              At {fmtAmount(multiplier)}x you're well past the original batch — most home ovens and mixing bowls only handle so much at once, so plan to work in stages.
            </p>
          </div>
        )}

        {/* Ingredient bars — stretch in real time with the dial */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Scaled ingredients</p>
            <button onClick={handleCopyList} className="ios-card-nested press text-xs px-3 py-1.5" style={{ color: 'var(--text-secondary)' }}>
              📋 Copy list
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {recipe.ingredients.map(ing => {
              const scaled = ing.baseAmount * multiplier;
              const barRatio = Math.min(scaled / (maxBaseAmount * (maxServings / recipe.baseServings)), 1);
              return (
                <div key={ing.id} className="ios-card-nested p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-footnote font-semibold">{ing.name}</span>
                    <span className="text-footnote font-bold tabular" style={{ color: `rgb(${ing.color})` }}>
                      {fmtAmount(scaled)}{ing.unit ? ` ${ing.unit}` : ''}
                    </span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--border-hairline)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(barRatio * 100, 4)}%`,
                        background: `rgb(${ing.color})`,
                        boxShadow: `0 0 8px rgba(${ing.color}, 0.5)`,
                        transition: dragging ? 'none' : 'width 0.2s ease-out',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Steps */}
        <div className="mb-6">
          <p className="text-footnote font-semibold mb-2">Method</p>
          <ol className="flex flex-col gap-2">
            {recipe.steps.map((step, i) => (
              <li key={i} className="ios-card-nested p-3 text-footnote flex gap-3" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-bold flex-shrink-0" style={{ color: 'rgb(255, 122, 60)' }}>{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Free-tier upgrade banner */}
        {atFreeLimit && (
          <div
            className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap"
            style={{ border: '1.5px solid rgba(var(--accent-orange), 0.4)', boxShadow: '0 0 20px rgba(var(--accent-orange), 0.1)' }}
          >
            <div>
              <p className="text-footnote font-bold mb-0.5">⭐ You've hit the free limit</p>
              <p className="text-caption">Upgrade to Premium to batch-scale up to {MAX_SERVINGS_PRO} servings and save your setup.</p>
            </div>
            <button className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Upgrade to Premium — $4/mo</button>
          </div>
        )}

        {/* Like / Share / Comment bar */}
        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5"
            style={{ color: toolLiked ? 'rgb(255, 122, 60)' : 'var(--text-secondary)' }}>
            <span style={{ transform: toolLiked ? 'scale(1.2)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>
              {toolLiked ? '❤️' : '🤍'}
            </span>
            <span className="text-footnote font-semibold">{toolLikeCount}</span>
          </button>
          <button onClick={handleShare} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>
            🔗 <span className="text-footnote font-semibold">Share</span>
          </button>
          <button onClick={handleCommentJump} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>
            💬 <span className="text-footnote font-semibold">Comment</span>
          </button>
        </div>
      </div>

      {/* Comments waterfall */}
      <ToolCommentSection seedComments={RECIPE_BATCH_DIAL_COMMENTS} onRequireAuth={requireAuth} glow="255, 122, 60" />

      <ToastHost toast={toast} />
    </div>
  );
}