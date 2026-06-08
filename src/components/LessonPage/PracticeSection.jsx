import { useState, useMemo } from 'react';
import { ChevronRight, Check } from 'lucide-react';

function HintText({ text, hints = {} }) {
  const [open, setOpen] = useState(null);

  const speak = (word) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = 'en-US';
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };

  const words = text.split(/(\s+)/);
  return (
    <span>
      {words.map((word, i) => {
        const key = word.replace(/[.,!?。、]/g, '').toLowerCase();
        const hint = hints[key] || hints[word];
        if (hint) {
          return (
            <span key={i} className="hint-word"
              onClick={() => { speak(word.replace(/[.,!?。、]/g, '')); setOpen(open === i ? null : i); }}>
              {word}
              {open === i && <span className="hint-popup">{hint}</span>}
            </span>
          );
        }
        return <span key={i}>{word}</span>;
      })}
    </span>
  );
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function ChunkStage({ sentence, onPass }) {
  const shuffled = useMemo(() => shuffle(sentence.chunks), [sentence.text]);
  const [selected, setSelected] = useState([]);
  const [wrong, setWrong] = useState(false);

  const remaining = shuffled.filter((c) => !selected.includes(c));
  const add = (chunk) => setSelected((p) => [...p, chunk]);
  const remove = (i) => setSelected((p) => p.filter((_, j) => j !== i));

  const check = () => {
    if (selected.join(' ') === sentence.chunks.join(' ')) {
      onPass();
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 600);
    }
  };

  return (
    <div className="chunk-stage">
      <p className="stage-label">Step 1 — Put the chunks in order</p>
      <div className={`chunk-answer ${wrong ? 'shake' : ''}`}>
        {selected.length === 0
          ? <span className="chunk-placeholder">Tap chunks below ↓</span>
          : selected.map((c, i) => (
            <button key={i} type="button" className="chunk-token selected" onClick={() => remove(i)}>{c}</button>
          ))}
      </div>
      <div className="chunk-pool">
        {remaining.map((c, i) => (
          <button key={i} type="button" className="chunk-token" onClick={() => add(c)}>{c}</button>
        ))}
      </div>
      {selected.length === sentence.chunks.length && (
        <button type="button" className="primary-action compact" onClick={check}>
          <Check size={16} /> Check
        </button>
      )}
    </div>
  );
}

function ChoiceBlankStage({ sentence, blankCount, stepNum, onPass, onSubmitAnswer }) {
  const blanks = useMemo(() => {
    const idx = shuffle([...Array(sentence.chunks.length).keys()]);
    return idx.slice(0, blankCount).sort((a, b) => a - b);
  }, [sentence.text, blankCount]);

  const options = useMemo(() => shuffle(sentence.chunks), [sentence.text]);
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
      onSubmitAnswer?.({
        question: { id: sentence.text, lessonId: sentence.lessonId || '', questionType: 'chunk', blankAnswer: sentence.text },
        userAnswer: blanks.map((i) => next[i]).join(' / '),
        isCorrect: ok,
      });
      if (ok) setTimeout(onPass, 600);
      else setTimeout(() => { setFilled({}); setResult(null); }, 900);
    }
  };

  return (
    <div className="blank-stage">
      <p className="stage-label">Step {stepNum} — Choose the missing chunk{blankCount > 1 ? 's' : ''}</p>
      <div className="blank-sentence">
        {sentence.chunks.map((chunk, i) =>
          blankSet.has(i) ? (
            <span key={i} className={`blank-box ${filled[i] ? 'filled' : ''} ${result === 'wrong' ? 'wrong' : result === 'correct' ? 'correct' : ''}`}>
              {filled[i] || '___'}
            </span>
          ) : (
            <span key={i} className="blank-chunk"><HintText text={chunk} hints={sentence.hints} /></span>
          )
        )}
      </div>
      {result !== 'correct' && (
        <div className="choice-options">
          {options.map((c, i) => (
            <button key={i} type="button" className="chunk-token choice-btn" onClick={() => handleOption(c)}>{c}</button>
          ))}
        </div>
      )}
      {result === 'wrong' && <p className="blank-feedback wrong">✗ Try again</p>}
      {result === 'correct' && <p className="blank-feedback correct">✓ Correct!</p>}
    </div>
  );
}

function SentenceCard({ sentence, index, onComplete, onSubmitAnswer }) {
  const [phase, setPhase] = useState('preview');
  const [stage, setStage] = useState(1);

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
        <p className="sentence-full">
          <HintText text={sentence.text} hints={sentence.hints} />
        </p>
        {/* ✅ 일본어 번역 */}
        {sentence.translation && (
          <p className="sentence-translation">{sentence.translation}</p>
        )}
        {/* ✅ 문법 패턴 */}
        {sentence.pattern && (
          <div className="sentence-pattern">
            <span className="pattern-label">Pattern: </span>
            <span className="pattern-text">{sentence.pattern}</span>
          </div>
        )}
        <button type="button" className="primary-action compact" style={{ marginTop: '16px' }} onClick={() => setPhase('practice')}>
          Start Practice <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="sentence-card">
      <div className="sentence-card-header">
        <span className="sentence-num">Sentence {index + 1}</span>
        <span className="stage-dots">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`stage-dot ${s < stage ? 'done' : s === stage ? 'active' : ''}`} />
          ))}
        </span>
      </div>
      {sentence.translation && (
        <p className="sentence-translation-hint">{sentence.translation}</p>
      )}
      {stage === 1 && <ChunkStage sentence={sentence} onPass={() => setStage(2)} />}
      {stage === 2 && (
        <ChoiceBlankStage sentence={sentence} blankCount={2} stepNum={2}
          onPass={() => setStage(3)} onSubmitAnswer={onSubmitAnswer} />
      )}
      {stage === 3 && (
        <ChoiceBlankStage sentence={sentence} blankCount={1} stepNum={3}
          onPass={() => { setPhase('done'); onComplete(); }} onSubmitAnswer={onSubmitAnswer} />
      )}
    </div>
  );
}

export default function PracticeSection({ lesson, onSubmitAnswer, onAllAnswered }) {
  const sentences = lesson.sentences || [];
  const [cleared, setCleared] = useState(0);

  const handleSentenceComplete = (idx) => {
    if (idx === cleared) {
      const next = cleared + 1;
      setCleared(next);
      if (next >= sentences.length) onAllAnswered?.();
    }
  };

  if (!sentences.length) {
    return (
      <section className="lesson-section practice-section">
        <div className="section-heading">
          <p className="eyebrow">B. Practice</p>
          <h2>No sentences yet</h2>
        </div>
        <p style={{ color: 'var(--muted)' }}>Manager: add sentences in the Manager → Add Lesson form.</p>
      </section>
    );
  }

  return (
    <section className="lesson-section practice-section">
      <div className="section-heading">
        <p className="eyebrow">B. Practice</p>
        <h2>Use it now</h2>
      </div>
      <div className="sentence-cards">
        {sentences.map((sentence, i) =>
          i <= cleared ? (
            <SentenceCard key={i} sentence={sentence} index={i}
              onComplete={() => handleSentenceComplete(i)} onSubmitAnswer={onSubmitAnswer} />
          ) : (
            <div key={i} className="sentence-card locked-card">
              <span className="lock-icon">🔒</span>
              <span>Sentence {i + 1} — Complete previous sentence first</span>
            </div>
          )
        )}
      </div>
    </section>
  );
}
