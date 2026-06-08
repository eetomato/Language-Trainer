import { useState, useMemo } from 'react';
import { Check } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ── 빈칸 채우기만 (청크 순서 없음) ───────────────────────────
function ReviewBlankStage({ sentence, onPass }) {
  const options = useMemo(() => shuffle(sentence.chunks), [sentence.text]);
  const blanks = useMemo(() => {
    const idx = shuffle([...Array(sentence.chunks.length).keys()]);
    return idx.slice(0, Math.min(2, sentence.chunks.length)).sort((a, b) => a - b);
  }, [sentence.text]);

  const [filled, setFilled] = useState({});
  const [result, setResult] = useState(null);
  const blankSet = useMemo(() => new Set(blanks), [blanks]);

  const handleOption = (chunk) => {
    if (result === 'correct') return;
    const nextBlank = blanks.find((i) => filled[i] === undefined);
    if (nextBlank === undefined) return;
    const next = { ...filled, [nextBlank]: chunk };
    setFilled(next);

    if (blanks.every((i) => next[i] !== undefined)) {
      const ok = blanks.every((i) => next[i] === sentence.chunks[i]);
      setResult(ok ? 'correct' : 'wrong');
      if (ok) setTimeout(onPass, 600);
      else setTimeout(() => { setFilled({}); setResult(null); }, 900);
    }
  };

  return (
    <div className="blank-stage">
      <p className="stage-label">Choose the missing chunk{blanks.length > 1 ? 's' : ''}</p>
      <div className="blank-sentence">
        {sentence.chunks.map((chunk, i) =>
          blankSet.has(i) ? (
            <span key={i} className={`blank-box ${filled[i] ? 'filled' : ''} ${result === 'wrong' ? 'wrong' : result === 'correct' ? 'correct' : ''}`}>
              {filled[i] || '___'}
            </span>
          ) : (
            <span key={i} className="blank-chunk">{chunk}</span>
          )
        )}
      </div>
      {result !== 'correct' && (
        <div className="choice-options">
          {options.map((c, i) => (
            <button key={i} type="button" className="chunk-token choice-btn" onClick={() => handleOption(c)}>
              {c}
            </button>
          ))}
        </div>
      )}
      {result === 'wrong' && <p className="blank-feedback wrong">✗ Try again</p>}
      {result === 'correct' && <p className="blank-feedback correct">✓ Correct!</p>}
    </div>
  );
}

// ── 한 문장 카드 (preview → 빈칸) ────────────────────────────
function ReviewCard({ sentence, index, onComplete }) {
  const [phase, setPhase] = useState('preview');

  if (phase === 'done') {
    return (
      <div className="sentence-card done-card">
        <Check size={18} />
        <span>Sentence {index + 1} complete</span>
      </div>
    );
  }

  if (phase === 'preview') {
    return (
      <div className="sentence-card">
        <div className="sentence-card-header">
          <span className="sentence-num">Sentence {index + 1}</span>
        </div>
        <p className="sentence-full">{sentence.text}</p>
        <button
          type="button"
          className="primary-action compact"
          onClick={() => setPhase('practice')}
        >
          Practice <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="sentence-card">
      <div className="sentence-card-header">
        <span className="sentence-num">Sentence {index + 1}</span>
      </div>
      <ReviewBlankStage
        sentence={sentence}
        onPass={() => { setPhase('done'); onComplete(); }}
      />
    </div>
  );
}

// ── Main ReviewSection ────────────────────────────────────────
export default function ReviewSection({ lesson, user, onComplete, onBack }) {
  const [cleared, setCleared] = useState(0);
  const sentences = lesson?.sentences || [];

  if (!sentences.length) {
    onComplete?.();
    return null;
  }

  const handleComplete = (idx) => {
    if (idx === cleared) {
      const next = cleared + 1;
      setCleared(next);
      if (next >= sentences.length) onComplete?.();
    }
  };

  return (
    <div className="lesson-page">
      <section className="lesson-hero">
        <div>
          {onBack && (
            <button className="back-btn" type="button" onClick={onBack}>
              ← Back / 戻る
            </button>
          )}
          <p className="eyebrow">Review</p>
          <h2>Yesterday's expressions</h2>
          <p>{user.name} — Let's practice what you learned yesterday.</p>
        </div>
        <div className="review-badge">
          <span>復習</span>
        </div>
      </section>

      <section className="lesson-section practice-section">
        <div className="section-heading">
          <p className="eyebrow">Review</p>
          <h2>Fill in the blanks</h2>
        </div>
        <div className="sentence-cards">
          {sentences.map((sentence, i) =>
            i <= cleared ? (
              <ReviewCard
                key={i}
                sentence={sentence}
                index={i}
                onComplete={() => handleComplete(i)}
              />
            ) : (
              <div key={i} className="sentence-card locked-card">
                <span className="lock-icon">🔒</span>
                <span>Sentence {i + 1} — Complete previous sentence first</span>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
