import { useEffect, useRef, useState } from 'react';

type Defect = 'crack' | 'bolt' | 'dent' | 'misalign' | null;
type Plate = { id: number; defect: Defect };
type Round = { index: number; correct: number; mistakes: number; streak: number; bestStreak: number; done: boolean };
type Feedback = { positive: boolean; timedOut: boolean; headline: string; detail: string };
type Props = { session: string; playing: boolean; onFinish: (session: string, correct: number) => void; onClose: () => void };

const INSPECTION_MS = 4000;
const FEEDBACK_MS = 520;
const tokenReward = (score: number) => score === 10 ? 2 : score >= 7 ? 1 : 0;

function preparePlates(): Plate[] {
  // A fair mix every shift: all defect types appear, with four clean plates.
  const defects: Defect[] = [null, 'crack', 'bolt', null, 'dent', 'misalign', null, 'crack', 'bolt', null];
  for (let i = defects.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [defects[i], defects[j]] = [defects[j], defects[i]];
  }
  return defects.map((defect, id) => ({ id, defect }));
}

function nextRound(round: Round, plate: Plate, reject: boolean | null): Round {
  if (round.done || plate.id !== round.index) return round;
  const correct = reject !== null && reject === Boolean(plate.defect);
  const streak = correct ? round.streak + 1 : 0;
  const index = round.index + 1;
  const mistakes = round.mistakes + (correct ? 0 : 1);
  return {
    index,
    correct: round.correct + (correct ? 1 : 0),
    mistakes,
    streak,
    bestStreak: Math.max(round.bestStreak, streak),
    done: index >= 10 || mistakes >= 3,
  };
}

function PlateIllustration({ defect }: { defect: Defect }) {
  const boltPositions = [[60, 40], [180, 40], [60, 120], [180, 120]];
  return <svg className="qc-plate-art" viewBox="0 0 240 160" role="img" aria-label="Metal plate on the inspection belt">
    <defs>
      <linearGradient id="qcSteel" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#dbe9e8" />
        <stop offset=".52" stopColor="#8da9ad" />
        <stop offset="1" stopColor="#5c797d" />
      </linearGradient>
    </defs>
    <rect x="26" y="16" width="188" height="130" rx="16" fill="#182c32" opacity=".4" />
    {defect === 'dent'
      ? <path d="M36 24H167Q184 24 189 39Q193 51 207 57L204 121Q204 136 189 136H36Q23 136 23 123V37Q23 24 36 24Z" fill="url(#qcSteel)" stroke="#29434d" strokeWidth="5" />
      : <rect x="25" y="22" width="190" height="116" rx="12" fill="url(#qcSteel)" stroke="#29434d" strokeWidth="5" />}
    <rect x={defect === 'misalign' ? 63 : 46} y={defect === 'misalign' ? 44 : 43} width="148" height="74" rx="7" fill="#587781" stroke="#bfd3d3" strokeWidth="3" strokeDasharray={defect === 'misalign' ? '9 5' : undefined} />
    {defect === 'misalign' && <path d="M47 51h12m-6-6v12M47 109h12m-6-6v12" stroke="#e9b966" strokeWidth="4" strokeLinecap="round" />}
    {boltPositions.map(([x, y], i) => defect === 'bolt' && i === 3
      ? <g key={i}><circle cx={x} cy={y} r="11" fill="#243840" stroke="#f4c56e" strokeWidth="3" strokeDasharray="3 3" /><path d={`M${x-4} ${y-4}l8 8m0-8l-8 8`} stroke="#f4c56e" strokeWidth="2" /></g>
      : <g key={i}><circle cx={x} cy={y} r="9" fill="#e4eded" stroke="#344e55" strokeWidth="3" /><path d={`M${x-5} ${y}h10`} stroke="#577078" strokeWidth="3" strokeLinecap="round" /></g>)}
    {defect === 'crack' && <><path d="M108 23l17 24-16 15 29 18-13 20 19 37" stroke="#263039" strokeWidth="8" strokeLinecap="round" fill="none" /><path d="M107 26l18 21-16 15 29 18-13 20 18 34" stroke="#f2b37e" strokeWidth="2" strokeLinecap="round" fill="none" /></>}
    {defect === 'dent' && <><ellipse cx="184" cy="60" rx="20" ry="25" fill="#324f59" opacity=".65" /><path d="M170 40q20 2 26 19-6 21-26 24" fill="none" stroke="#edf4e8" strokeWidth="4" opacity=".75" /></>}
  </svg>;
}

export function QualityControlGame({ session, playing, onFinish, onClose }: Props) {
  const [plates] = useState(preparePlates);
  const [round, setRound] = useState<Round>({ index: 0, correct: 0, mistakes: 0, streak: 0, bestStreak: 0, done: false });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const remaining = useRef(INSPECTION_MS);
  const locked = useRef(false);
  const countdown = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transition = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rewardSent = useRef(false);
  const decisionStarted = useRef(false);
  const plate = plates[Math.min(9, round.index)];

  const decide = (reject: boolean | null) => {
    if (!playing || round.done || feedback || locked.current) return;
    locked.current = true;
    decisionStarted.current = true;
    if (countdown.current) clearTimeout(countdown.current);
    const correct = reject !== null && reject === Boolean(plate.defect);
    const headline = reject === null ? 'TIME UP' : correct ? (reject ? 'DEFECT CAUGHT' : 'GOOD PART') : 'WRONG CALL';
    const detail = reject === null ? 'Missed inspection · −1 life' : correct ? (round.streak + 1 >= 3 ? 'COMBO ×' + (round.streak + 1) : 'Streak ' + (round.streak + 1)) : '−1 life · check the next plate';
    setFeedback({ positive: correct, timedOut: reject === null, headline, detail });
    transition.current = setTimeout(() => {
      setRound(current => nextRound(current, plate, reject));
      setFeedback(null);
      locked.current = false;
      decisionStarted.current = false;
    }, FEEDBACK_MS);
  };

  // Reset the countdown for the next plate. Pause safely if factory production pauses.
  useEffect(() => { remaining.current = INSPECTION_MS; }, [round.index]);
  useEffect(() => {
    if (!playing || round.done || feedback) return;
    const started = Date.now();
    const id = setTimeout(() => decide(null), remaining.current);
    countdown.current = id;
    return () => {
      clearTimeout(id);
      if (!decisionStarted.current) remaining.current = Math.max(0, remaining.current - (Date.now() - started));
    };
  }, [round.index, round.done, playing, feedback]);

  useEffect(() => {
    if (round.done && !rewardSent.current) {
      rewardSent.current = true;
      onFinish(session, round.correct);
    }
  }, [round.done, round.correct, onFinish, session]);

  useEffect(() => {
    if (round.done) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable]')) return;
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') { event.preventDefault(); decide(true); }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') { event.preventDefault(); decide(false); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [round.index, round.done, playing, feedback]);

  useEffect(() => () => {
    if (countdown.current) clearTimeout(countdown.current);
    if (transition.current) clearTimeout(transition.current);
  }, []);

  const accuracy = round.index ? Math.round((round.correct / round.index) * 100) : 0;
  const inspected = round.index;
  const completion = round.done ? 100 : Math.round((round.index / 10) * 100);
  return <section className="qc-game qc-v2" aria-label="Quality Control mini-game">
    <div className="qc-game-heading">
      <div><span className="eyebrow">INSPECTION BAY · SHIFT 01</span><h2>{round.done ? 'Shift complete' : 'Quality Control'}</h2></div>
      <button type="button" className="secondary-button" onClick={onClose}>{round.done ? 'BACK TO THEMES' : 'LEAVE SHIFT'}</button>
    </div>
    {round.done
      ? <div className="qc-result" role="status">
          <div className="qc-result-icon" aria-hidden="true">{round.correct === 10 ? '★' : round.correct >= 7 ? '✓' : '⚙'}</div>
          <span className="eyebrow">INSPECTION REPORT</span>
          <b>{round.correct}/10 correct</b>
          <h3>{round.correct === 10 ? 'Flawless shift!' : round.correct >= 7 ? 'Solid inspection!' : 'Shift finished'}</h3>
          <div className="qc-results-grid"><div><strong>{accuracy}%</strong><span>ACCURACY</span></div><div><strong>{round.bestStreak}</strong><span>BEST STREAK</span></div><div><strong>{Math.max(0, 3 - round.mistakes)}</strong><span>LIVES LEFT</span></div></div>
          <div className="qc-token-result"><strong>+{tokenReward(round.correct)} STYLE TOKEN{tokenReward(round.correct) === 1 ? '' : 'S'}</strong><small>{tokenReward(round.correct) ? 'Added to your theme balance' : 'Reach 7 correct inspections to earn one'}</small></div>
          {round.mistakes >= 3 && <p>Three mistakes ended the shift early. You'll get another chance after the cooldown.</p>}
        </div>
      : <>
          <p className="qc-instructions">Inspect each plate. <strong>REJECT</strong> defects or <strong>KEEP</strong> clean parts. Three misses end your shift.</p>
          <div className="qc-score"><span>PLATE <b>{round.index + 1}/10</b></span><span>✓ <b>{round.correct}</b> CORRECT</span><span>⚡ <b>{round.streak}</b> STREAK</span><span>♥ <b>{3 - round.mistakes}</b> LIVES</span></div>
          <div className="qc-shift-progress" aria-label={`Shift ${completion}% complete`}><span>SHIFT PROGRESS</span><div className="qc-shift-track"><div style={{ width: `${completion}%` }} /></div><b>{inspected}/10</b></div>
          <div className="qc-timer"><div className="qc-timer-track"><div key={round.index} className="qc-timer-fill" style={{ animationPlayState: playing && !feedback ? 'running' : 'paused' }} /></div><span>4 SEC / PLATE</span></div>
          <div className={`qc-conveyor ${feedback ? (feedback.positive ? 'is-success' : 'is-error') : ''} ${playing ? '' : 'is-paused'}`}>
            <div className="qc-station-marker">SCAN ZONE <span aria-hidden="true">◆</span> 01</div>
            <span className="qc-station-side-label" aria-hidden="true">IN → INSPECT → OUT</span>
            <div className="qc-conveyor-rail qc-rail-top" aria-hidden="true" />
            <div className="qc-conveyor-rail qc-rail-bottom" aria-hidden="true" />
            <div key={round.index} className="qc-plate-carriage"><PlateIllustration defect={plate.defect} /></div>
            {feedback && <div className={`qc-feedback ${feedback.positive ? 'positive' : 'negative'}`} role="status"><strong>{feedback.positive ? '✓' : '✕'} {feedback.headline}</strong><span>{feedback.detail}</span></div>}
            <span className="qc-accessible-defect">{plate.defect === 'crack' ? 'Crack through the plate' : plate.defect === 'bolt' ? 'Bottom-right bolt is missing' : plate.defect === 'dent' ? 'Dented metal edge' : plate.defect === 'misalign' ? 'Misaligned center panel' : 'All bolts present; no cracks or dents'}</span>
          </div>
          <div className="qc-actions">
            <button type="button" disabled={!playing || !!feedback} className="qc-reject" onClick={() => decide(true)}><span aria-hidden="true">✕</span><b>REJECT</b><small>Damaged · A / ←</small></button>
            <button type="button" disabled={!playing || !!feedback} className="qc-keep" onClick={() => decide(false)}><span aria-hidden="true">✓</span><b>KEEP</b><small>Good part · D / →</small></button>
          </div>
          <p className="qc-help" role="status">{!playing ? 'Production paused · resume to continue.' : feedback ? feedback.headline : round.streak >= 3 ? `Great rhythm · ${round.streak} clean calls in a row.` : 'Look for cracks, missing bolts, dents and shifted panels.'}</p>
        </>}
  </section>;
}
