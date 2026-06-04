import { useState } from 'react';
import { Volume2, Minus, Plus, ChevronRight, Check } from 'lucide-react';

const MIN_TO_PROCEED = 3;

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-US';
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
}

export default function ShadowingSection({ sentences, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [counts, setCounts] = useState({});
  const [goal, setGoal] = useState(10);
  const [done, setDone] = useState(false);

  const sentence = sentences[idx];
  const count = counts[idx] || 0;
  const canProceed = count >= MIN_TO_PROCEED;
  const isLast = idx === sentences.length - 1;

  const increment = () => {
    setCounts((p) => ({ ...p, [idx]: (p[idx] || 0) + 1 }));
  };

  const next = () => {
    if (isLast) {
      setDone(true);
      onComplete?.();
    } else {
      setIdx((i) => i + 1);
    }
  };

  if (done) {
    return (
      <div className="shadowing-done">
        <Check size={20} />
        <span>Shadowing complete</span>
      </div>
    );
  }

  return (
    <section className="lesson-section shadowing-section">
      <div className="section-heading">
        <p className="eyebrow">C. Shadowing</p>
        <h2>Repeat out loud</h2>
      </div>

      {/* Progress dots */}
      <div className="shadow-dots">
        {sentences.map((_, i) => (
          <span key={i} className={`shadow-dot ${i < idx ? 'done' : i === idx ? 'active' : ''}`} />
        ))}
      </div>

      {/* Sentence card */}
      <div className="shadow-card">
        <p className="shadow-sentence">{sentence?.text || sentence?.english}</p>
        <p className="shadow-jp">{sentence?.japanese}</p>
        <button
          type="button"
          className="tts-btn"
          onClick={() => speak(sentence?.text || sentence?.english || '')}
          aria-label="Play audio"
        >
          <Volume2 size={18} /> Listen
        </button>
      </div>

      {/* Goal adjuster */}
      <div className="shadow-goal-row">
        <span>Goal</span>
        <button type="button" className="goal-btn" onClick={() => setGoal((g) => Math.max(3, g - 1))}>
          <Minus size={14} />
        </button>
        <strong>{goal}</strong>
        <button type="button" className="goal-btn" onClick={() => setGoal((g) => Math.min(30, g + 1))}>
          <Plus size={14} />
        </button>
        <span className="shadow-progress">{count} / {goal}</span>
      </div>

      {/* Progress bar */}
      <div className="shadow-bar-bg">
        <div className="shadow-bar-fill" style={{ width: `${Math.min(100, (count / goal) * 100)}%` }} />
      </div>

      {/* Shadow button */}
      <button type="button" className="shadow-btn" onClick={increment}>
        I said it
      </button>

      {/* Next button — only shown after 3+ */}
      {canProceed && (
        <button type="button" className="primary-action compact next-sentence-btn" onClick={next}>
          {isLast ? <><Check size={16} /> Finish shadowing</> : <><ChevronRight size={16} /> Next sentence</>}
        </button>
      )}
    </section>
  );
}
