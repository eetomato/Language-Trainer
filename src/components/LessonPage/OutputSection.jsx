import { useState, useMemo } from 'react';
import { Check, ChevronRight, SkipForward } from 'lucide-react';

function normalize(str) {
  return str.trim().toLowerCase().replace(/[.,!?'"]/g, '').replace(/\s+/g, ' ');
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function OutputSection({ sentences, onSubmit }) {
  const order = useMemo(() => shuffle(sentences.map((_, i) => i)), []);
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null); // null | 'correct' | 'wrong'
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

  if (!sentences.length) {
    onSubmit?.();
    return null;
  }

  if (done) {
    return (
      <section className="lesson-section output-section">
        <div className="section-heading">
          <p className="eyebrow">D. Output</p>
          <h2>Write it out</h2>
        </div>
        <div className="output-feedback">
          <p className="eyebrow" style={{ color: 'var(--accent)' }}>Complete! 🎉</p>
          <p className="feedback-text">Great work! Keep using these expressions on the floor.</p>
        </div>
      </section>
    );
  }

  const sentenceIdx = order[current];
  const sentence = sentences[sentenceIdx];

  const handleCheck = () => {
    if (!input.trim()) return;
    const ok = normalize(input) === normalize(sentence.text);
    setResult(ok ? 'correct' : 'wrong');
    setRevealed(true);
  };

  const handleNext = () => {
    const next = current + 1;
    if (next >= sentences.length) {
      setDone(true);
      onSubmit?.();
    } else {
      setCurrent(next);
      setInput('');
      setResult(null);
      setRevealed(false);
    }
  };

  const handleSkip = () => {
    setRevealed(true);
    setResult('skipped');
  };

  return (
    <section className="lesson-section output-section">
      <div className="section-heading">
        <p className="eyebrow">D. Output</p>
        <h2>Write it out</h2>
      </div>

      <p className="output-hint">
        Type the sentence from memory. ({current + 1} / {sentences.length})
      </p>

      {sentence.translation && (
        <p className="sentence-translation" style={{ marginBottom: 4 }}>
          {sentence.translation}
        </p>
      )}
      {sentence.pattern && (
        <div className="sentence-pattern" style={{ marginBottom: 16 }}>
          <span className="pattern-label">Pattern</span>
          <span className="pattern-text">{sentence.pattern}</span>
        </div>
      )}

      <textarea
        className="output-textarea"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type the full sentence..."
        rows={3}
        disabled={revealed}
      />

      {revealed && (
        <div className={`output-result ${result}`}>
          {result === 'correct' && <p className="blank-feedback correct">✓ Correct!</p>}
          {result === 'wrong' && (
            <>
              <p className="blank-feedback wrong">✗ Not quite</p>
              <p className="output-answer">Answer: <strong>{sentence.text}</strong></p>
            </>
          )}
          {result === 'skipped' && (
            <p className="output-answer">Answer: <strong>{sentence.text}</strong></p>
          )}
        </div>
      )}

      <div className="output-actions">
        {!revealed ? (
          <>
            <button type="button" className="primary-action compact"
              onClick={handleCheck} disabled={!input.trim()}>
              <Check size={16} /> Check
            </button>
            <button type="button" className="retry-btn" onClick={handleSkip}
              title="Skip this sentence">
              <SkipForward size={16} /> Pass
            </button>
          </>
        ) : (
          <button type="button" className="primary-action compact" onClick={handleNext}>
            {current + 1 >= sentences.length ? 'Complete' : 'Next'} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </section>
  );
}
