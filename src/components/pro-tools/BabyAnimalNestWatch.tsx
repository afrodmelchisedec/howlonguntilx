// FILE: src/components/pro-tools/BabyAnimalNestWatch.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { CommentThread } from '@/components/community/CommentThread';
import { EmbedCodeButton } from '@/components/embeds/EmbedCodeButton';

const GLOW = '255, 179, 71';
const STORAGE_KEY = 'nest-watch:selection';

type Species = 'bird' | 'bunny' | 'kitten' | 'puppy';
type Mode = 'timeline' | 'quiz';

interface Milestone { id: string; label: string; emoji: string; note: string; dayStart: number; dayTypical: number; dayEnd: number; }

const SPECIES_META: Record<Species, { label: string; emoji: string; foundTip: string }> = {
  bird:   { label: 'Baby Bird',  emoji: '🐦', foundTip: "Found a featherless or fledgling bird on the ground? Parents often feed fledglings from nearby for a day or two after they leave the nest — it's usually not abandoned. Only intervene if it's injured, or contact a wildlife rehabilitator first." },
  bunny:  { label: 'Baby Bunny', emoji: '🐰', foundTip: "Found a nest of bunnies with no mother in sight? That's normal — mother rabbits only visit to nurse for a few minutes, twice a day, to avoid attracting predators. Leave the nest undisturbed." },
  kitten: { label: 'Kitten',     emoji: '🐱', foundTip: "Found kittens alone outside? Mom is very likely nearby hunting or hiding from you. Watch from a distance for a few hours before assuming they're orphaned." },
  puppy:  { label: 'Puppy',      emoji: '🐶', foundTip: "A stray or newborn puppy needs a vet check sooner than a wild animal would — reach out to a local shelter or rescue rather than waiting this out on general timelines." },
};

const MILESTONES_BY_SPECIES: Record<Species, Milestone[]> = {
  bird: [
    { id: 'hatch', label: 'Hatches', emoji: '🐣', note: 'Blind, featherless, and fully dependent.', dayStart: 0, dayTypical: 0, dayEnd: 1 },
    { id: 'eyes-open', label: 'Eyes open', emoji: '👀', note: '', dayStart: 3, dayTypical: 4, dayEnd: 6 },
    { id: 'pin-feathers', label: 'First feather quills appear', emoji: '🪶', note: '', dayStart: 4, dayTypical: 6, dayEnd: 8 },
    { id: 'fully-feathered', label: 'Fully feathered, wings developing', emoji: '🦜', note: '', dayStart: 8, dayTypical: 10, dayEnd: 12 },
    { id: 'fledge', label: 'Fledges — hops out of the nest', emoji: '🌿', note: "Can't fly well yet — this is normal, not abandonment.", dayStart: 12, dayTypical: 13, dayEnd: 15 },
    { id: 'first-flight', label: 'First real flight', emoji: '🕊️', note: '', dayStart: 16, dayTypical: 18, dayEnd: 22 },
    { id: 'independence', label: 'Fully independent', emoji: '🦅', note: 'No longer fed by parents.', dayStart: 28, dayTypical: 32, dayEnd: 40 },
  ],
  bunny: [
    { id: 'born', label: 'Born', emoji: '🐇', note: 'Blind and hairless, in a fur-lined nest.', dayStart: 0, dayTypical: 0, dayEnd: 1 },
    { id: 'fur-in', label: 'Soft fur comes in', emoji: '🧶', note: '', dayStart: 3, dayTypical: 4, dayEnd: 6 },
    { id: 'eyes-open', label: 'Eyes open', emoji: '👀', note: '', dayStart: 8, dayTypical: 9, dayEnd: 11 },
    { id: 'nest-exit', label: 'First hops out of the nest', emoji: '🌱', note: '', dayStart: 14, dayTypical: 16, dayEnd: 19 },
    { id: 'nibbling', label: 'Starts nibbling grass and greens', emoji: '🥬', note: '', dayStart: 16, dayTypical: 18, dayEnd: 21 },
    { id: 'weaned', label: 'Fully weaned', emoji: '✅', note: '', dayStart: 18, dayTypical: 21, dayEnd: 25 },
    { id: 'independence', label: 'On its own', emoji: '🍃', note: 'No longer needs mom.', dayStart: 21, dayTypical: 24, dayEnd: 30 },
  ],
  kitten: [
    { id: 'born', label: 'Born', emoji: '🐈', note: 'Blind and deaf, fully dependent on mom.', dayStart: 0, dayTypical: 0, dayEnd: 1 },
    { id: 'eyes-open', label: 'Eyes open', emoji: '👀', note: '', dayStart: 7, dayTypical: 9, dayEnd: 12 },
    { id: 'ears-up', label: 'Ears unfold and stand up', emoji: '👂', note: 'Hearing sharpens around now.', dayStart: 10, dayTypical: 13, dayEnd: 16 },
    { id: 'first-steps', label: 'Wobbly first steps', emoji: '🐾', note: '', dayStart: 14, dayTypical: 18, dayEnd: 24 },
    { id: 'weaning-start', label: 'Starts trying solid food', emoji: '🍽️', note: '', dayStart: 25, dayTypical: 28, dayEnd: 35 },
    { id: 'fully-weaned', label: 'Fully weaned', emoji: '✅', note: '~8 weeks.', dayStart: 49, dayTypical: 56, dayEnd: 63 },
    { id: 'ready', label: 'Old enough for a new home', emoji: '🏡', note: '~10–12 weeks.', dayStart: 70, dayTypical: 84, dayEnd: 98 },
  ],
  puppy: [
    { id: 'born', label: 'Born', emoji: '🐕', note: 'Blind and deaf, fully dependent.', dayStart: 0, dayTypical: 0, dayEnd: 1 },
    { id: 'eyes-open', label: 'Eyes open', emoji: '👀', note: '', dayStart: 10, dayTypical: 12, dayEnd: 16 },
    { id: 'ears-open', label: 'Ears open', emoji: '👂', note: 'Starts hearing.', dayStart: 14, dayTypical: 16, dayEnd: 20 },
    { id: 'first-steps', label: 'Wobbly first steps', emoji: '🐾', note: 'Tail wagging begins.', dayStart: 18, dayTypical: 21, dayEnd: 25 },
    { id: 'weaning-start', label: 'Starts trying solid food', emoji: '🍽️', note: '', dayStart: 21, dayTypical: 24, dayEnd: 28 },
    { id: 'fully-weaned', label: 'Fully weaned', emoji: '✅', note: '~6–8 weeks.', dayStart: 42, dayTypical: 49, dayEnd: 56 },
    { id: 'ready', label: 'Old enough for a new home', emoji: '🏡', note: '~8–10 weeks.', dayStart: 56, dayTypical: 70, dayEnd: 84 },
  ],
};

interface QuizQuestion { id: string; species: Species; emoji: string; prompt: string; options: string[]; correctIndex: number; }

const QUIZ_BANK: QuizQuestion[] = [
  { id: 'q1', species: 'bird', emoji: '🐦', prompt: 'Blind and featherless, but its eyes are just starting to crack open.', options: ['Day 0–1', 'Day 3–6', 'Day 12–14', 'Day 28+'], correctIndex: 1 },
  { id: 'q2', species: 'bunny', emoji: '🐰', prompt: 'Just hopped out of the nest for the first time to explore.', options: ['Day 0–1', 'Day 8–9', 'Day 14–19', 'Day 30+'], correctIndex: 2 },
  { id: 'q3', species: 'kitten', emoji: '🐱', prompt: "Eyes finally open after being sealed shut since birth.", options: ['Day 0–1', 'Day 7–12', 'Day 25–30', 'Day 56+'], correctIndex: 1 },
  { id: 'q4', species: 'puppy', emoji: '🐶', prompt: 'Taking its first wobbly steps, tail starting to wag.', options: ['Day 0–2', 'Day 10–13', 'Day 18–25', 'Day 42+'], correctIndex: 2 },
  { id: 'q5', species: 'bird', emoji: '🐦', prompt: "Hopping out of the nest but still can't really fly.", options: ['Day 0–2', 'Day 5–7', 'Day 12–15', 'Day 25+'], correctIndex: 2 },
  { id: 'q6', species: 'bunny', emoji: '🐰', prompt: 'Just born — blind and hairless, tucked into a fur-lined nest.', options: ['Day 0–1', 'Day 5–6', 'Day 12–14', 'Day 20+'], correctIndex: 0 },
  { id: 'q7', species: 'kitten', emoji: '🐱', prompt: 'Ears just unfolded and stood up for the first time.', options: ['Day 0–2', 'Day 10–16', 'Day 25–30', 'Day 49+'], correctIndex: 1 },
  { id: 'q8', species: 'puppy', emoji: '🐶', prompt: "Fully weaned off mom's milk, eating solid food only.", options: ['Day 0–5', 'Day 14–20', 'Day 25–35', 'Day 42–56'], correctIndex: 3 },
  { id: 'q9', species: 'bird', emoji: '🐦', prompt: 'No longer fed by its parents — fully on its own.', options: ['Day 5–8', 'Day 12–16', 'Day 18–22', 'Day 28–40'], correctIndex: 3 },
  { id: 'q10', species: 'bunny', emoji: '🐰', prompt: 'Fully weaned and living independently of its mother.', options: ['Day 5–10', 'Day 12–17', 'Day 21–30', 'Day 45+'], correctIndex: 2 },
  { id: 'q11', species: 'kitten', emoji: '🐱', prompt: 'Considered old enough to go to a new home.', options: ['Day 14–21', 'Day 35–42', 'Day 49–56', 'Day 70–98'], correctIndex: 3 },
  { id: 'q12', species: 'puppy', emoji: '🐶', prompt: 'Eyes open for the very first time.', options: ['Day 0–3', 'Day 10–16', 'Day 21–28', 'Day 35+'], correctIndex: 1 },
];

const QUIZ_ROUND_SIZE = 8;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function daysBetween(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

function statusForDay(m: Milestone, previewDay: number): 'upcoming' | 'active' | 'passed' {
  if (previewDay < m.dayStart) return 'upcoming';
  if (previewDay <= m.dayEnd) return 'active';
  return 'passed';
}

function tierForScore(score: number, total: number): { label: string; emoji: string } {
  const pct = score / total;
  if (pct === 1) return { label: 'Nest-Watch Expert', emoji: '🏆' };
  if (pct >= 0.75) return { label: 'Wildlife Whisperer', emoji: '🌟' };
  if (pct >= 0.5) return { label: 'Backyard Naturalist', emoji: '🔎' };
  return { label: 'Nest-Watch Novice', emoji: '🐣' };
}

export function BabyAnimalNestWatch() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();

  const [mode, setMode] = useState<Mode>('timeline');
  const [loaded, setLoaded] = useState(false);
  const [species, setSpecies] = useState<Species | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [toolLiked, setToolLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(31);

  const [quizQueue, setQuizQueue] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.species) setSpecies(saved.species);
        if (saved.startDate) setStartDate(saved.startDate);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ species, startDate })); } catch {}
  }, [species, startDate, loaded]);

  const daysSinceStart = startDate ? daysBetween(new Date(startDate + 'T00:00:00'), new Date()) : 0;
  const [previewDay, setPreviewDay] = useState(daysSinceStart);
  useEffect(() => { setPreviewDay(daysSinceStart); }, [daysSinceStart]);

  const milestones = species ? MILESTONES_BY_SPECIES[species] : [];

  function requireAuth() { showToast('You need to sign up first', '🔒'); }
  function handleLike() {
    if (!session) { requireAuth(); return; }
    setToolLiked(v => !v);
    setLikeCount(c => toolLiked ? c - 1 : c + 1);
  }
  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => showToast('Link copied!', '🔗')).catch(() => showToast('Could not copy link', '⚠️'));
  }
  function handleCommentJump() {
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  function startQuiz() {
    const queue = shuffle(QUIZ_BANK).slice(0, QUIZ_ROUND_SIZE);
    setQuizQueue(queue);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizAnswered(null);
    setQuizDone(false);
    setMode('quiz');
  }

  function answerQuiz(optionIndex: number) {
    if (quizAnswered !== null) return;
    setQuizAnswered(optionIndex);
    const correct = optionIndex === quizQueue[quizIndex].correctIndex;
    if (correct) setQuizScore(s => s + 1);
  }

  function nextQuestion() {
    if (quizIndex + 1 >= quizQueue.length) { setQuizDone(true); return; }
    setQuizIndex(i => i + 1);
    setQuizAnswered(null);
  }

  function handleShareScore() {
    const text = `I scored ${quizScore}/${quizQueue.length} on the Baby Animal Nest-Watch quiz! 🐣🐰🐱🐶 Think you know newborn animal milestones? ${window.location.href}`;
    navigator.clipboard.writeText(text).then(() => showToast('Score copied — go paste it!', '🎉')).catch(() => showToast('Could not copy', '⚠️'));
  }

  if (!loaded) return <div className="ios-card p-8 text-center text-callout" style={{ color: 'var(--text-secondary)' }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <ToastHost toast={toast} />

      <div className="ios-card-nested p-1.5 flex mb-6 relative" style={{ maxWidth: 360 }}>
        {(['timeline', 'quiz'] as Mode[]).map(m => (
          <button key={m} onClick={() => (m === 'quiz' ? startQuiz() : setMode('timeline'))}
            className="press flex-1 relative z-10 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold transition-colors duration-300"
            style={{ color: mode === m ? 'white' : 'var(--text-secondary)' }}>
            <span>{m === 'timeline' ? '🪺' : '🧠'}</span>{m === 'timeline' ? 'Nest Watch' : 'Guess the Stage'}
          </button>
        ))}
        <div className="absolute top-1.5 bottom-1.5 rounded-xl transition-all duration-300 ease-out"
          style={{ width: 'calc(50% - 6px)', left: mode === 'timeline' ? '6px' : 'calc(50% + 0px)', background: `rgb(${GLOW})`, boxShadow: `0 0 16px rgba(${GLOW}, 0.5)` }} />
      </div>

      {mode === 'timeline' ? (
        <div className="anim-fade-up">
          {!species ? (
            <div className="ios-card p-6 sm:p-8 text-center" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
              <p className="text-headline mb-4">Who are we watching?</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.keys(SPECIES_META) as Species[]).map(s => (
                  <button key={s} onClick={() => setSpecies(s)} className="ios-card-nested press p-4 flex flex-col items-center gap-1.5">
                    <span className="text-2xl">{SPECIES_META[s].emoji}</span>
                    <span className="text-footnote font-semibold">{SPECIES_META[s].label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : !startDate ? (
            <div className="ios-card p-6 sm:p-8 text-center" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
              <button onClick={() => setSpecies(null)} className="text-caption font-semibold mb-4" style={{ color: `rgb(${GLOW})` }}>← Choose a different animal</button>
              <p className="text-headline mb-4">{SPECIES_META[species].emoji} When did it hatch or arrive?</p>
              <input type="date" max={new Date().toISOString().slice(0, 10)}
                onChange={e => setStartDate(e.target.value)} className="ios-input"
                style={{ colorScheme: 'dark', color: 'var(--text-primary)', background: 'var(--fill-secondary)' }} />
            </div>
          ) : (
            <>
              <div className="ios-card p-6 sm:p-8 mb-4" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-caption" style={{ color: `rgb(${GLOW})` }}>{SPECIES_META[species].emoji} {SPECIES_META[species].label.toUpperCase()} TIMELINE</p>
                  <button onClick={() => { setSpecies(null); setStartDate(null); }} className="text-caption font-semibold" style={{ color: 'var(--text-tertiary)' }}>Change</button>
                </div>
                <h2 className="text-title2 mb-4">Day {daysSinceStart} old</h2>

                <div className="ios-card-nested p-4 mb-5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-footnote font-semibold">Scrub through time</p>
                    <span className="text-footnote tabular" style={{ color: `rgb(${GLOW})` }}>Day {previewDay}</span>
                  </div>
                  <input type="range" min={0} max={100} value={previewDay}
                    onChange={e => setPreviewDay(Number(e.target.value))}
                    className="w-full" style={{ accentColor: `rgb(${GLOW})` }} />
                  {previewDay !== daysSinceStart && (
                    <button onClick={() => setPreviewDay(daysSinceStart)} className="text-caption font-semibold mt-1" style={{ color: `rgb(${GLOW})` }}>Jump back to today</button>
                  )}
                </div>

                <div className="flex flex-col gap-2.5">
                  {milestones.map(m => {
                    const status = statusForDay(m, previewDay);
                    return (
                      <div key={m.id} className="ios-card-nested p-4" style={{ opacity: status === 'upcoming' ? 0.55 : 1 }}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-lg flex-shrink-0">{m.emoji}</span>
                            <div className="min-w-0">
                              <p className="text-headline">{m.label}</p>
                              <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                                {status === 'passed' ? 'Typically already happened' : status === 'active' ? 'Typically happening around now' : `Typically around day ${m.dayTypical}`}
                              </p>
                              {m.note && <p className="text-caption mt-0.5" style={{ color: 'var(--text-secondary)' }}>{m.note}</p>}
                            </div>
                          </div>
                          <span className="text-caption font-semibold flex-shrink-0" style={{ color: status === 'active' ? `rgb(${GLOW})` : 'var(--text-tertiary)' }}>
                            {status === 'active' ? '●' : status === 'passed' ? '✓' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="ios-card-nested p-4 mb-4 flex gap-3 items-start" style={{ borderLeft: '3px solid rgb(var(--accent-orange))' }}>
                <span className="text-lg flex-shrink-0">💡</span>
                <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{SPECIES_META[species].foundTip}</p>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="anim-fade-up">
          {!quizDone ? (
            quizQueue.length > 0 && (
              <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-caption" style={{ color: `rgb(${GLOW})` }}>QUESTION {quizIndex + 1} OF {quizQueue.length}</p>
                  <p className="text-caption font-semibold tabular">Score: {quizScore}</p>
                </div>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">{quizQueue[quizIndex].emoji}</div>
                  <p className="text-headline">{quizQueue[quizIndex].prompt}</p>
                  <p className="text-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>How old is it?</p>
                </div>
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {quizQueue[quizIndex].options.map((opt, i) => {
                    const isCorrect = i === quizQueue[quizIndex].correctIndex;
                    const isPicked = quizAnswered === i;
                    let bg = 'var(--fill-secondary)';
                    if (quizAnswered !== null && isCorrect) bg = `rgba(${GLOW}, 0.25)`;
                    else if (quizAnswered !== null && isPicked) bg = 'rgba(255, 90, 90, 0.2)';
                    return (
                      <button key={i} onClick={() => answerQuiz(i)} disabled={quizAnswered !== null}
                        className="ios-card-nested press py-3 text-footnote font-semibold tabular" style={{ background: bg }}>
                        {opt}{quizAnswered !== null && isCorrect ? ' ✓' : quizAnswered !== null && isPicked ? ' ✕' : ''}
                      </button>
                    );
                  })}
                </div>
                {quizAnswered !== null && (
                  <button onClick={nextQuestion} className="btn-filled press w-full">
                    {quizIndex + 1 >= quizQueue.length ? 'See my score →' : 'Next question →'}
                  </button>
                )}
              </div>
            )
          ) : (
            <div className="ios-card p-6 sm:p-8 text-center" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
              <div className="text-4xl mb-2">{tierForScore(quizScore, quizQueue.length).emoji}</div>
              <p className="text-title2 mb-1">{quizScore}/{quizQueue.length}</p>
              <p className="text-headline mb-5" style={{ color: `rgb(${GLOW})` }}>{tierForScore(quizScore, quizQueue.length).label}</p>
              <div className="flex gap-2.5">
                <button onClick={handleShareScore} className="ios-card-nested press flex-1 py-3 text-footnote font-semibold">🔗 Share score</button>
                <button onClick={startQuiz} className="btn-filled press flex-1">Play again</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="ios-card-nested p-4 my-4 flex items-center gap-3" style={{ borderLeft: `3px solid rgb(${GLOW})` }}>
        <span className="text-lg flex-shrink-0">🍼</span>
        <p className="text-footnote flex-1" style={{ color: 'var(--text-secondary)' }}>Expecting a human baby too? Track their milestones the same way.</p>
        <Link href="/tools/newborn-milestone-tracker" className="text-caption font-semibold flex-shrink-0" style={{ color: `rgb(${GLOW})` }}>Open →</Link>
      </div>

      <div className="ios-card-nested p-1.5 flex gap-1.5">
        <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: toolLiked ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>
          <span style={{ transform: toolLiked ? 'scale(1.2)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>{toolLiked ? '❤️' : '🤍'}</span>
          <span className="text-footnote font-semibold">{likeCount}</span>
        </button>
        <button onClick={handleShare} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>🔗 <span className="text-footnote font-semibold">Share</span></button>
        <button onClick={handleCommentJump} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>💬 <span className="text-footnote font-semibold">Comment</span></button>
      </div>

      <div className="flex justify-center mt-4 mb-4">
        <EmbedCodeButton slug="baby-animal-nest-watch" title="Baby Animal Nest-Watch" glow={GLOW} />
      </div>

      <CommentThread subjectType="tool" subjectId="baby-animal-nest-watch" glow={GLOW} />
    </div>
  );
}
