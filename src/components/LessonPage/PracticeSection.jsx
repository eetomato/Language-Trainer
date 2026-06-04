import { useState, useMemo } from 'react';
import { ChevronRight, Check } from 'lucide-react';

// ── Word hint popup ────────────────────────────────────────────
function HintText({ text, hints = {} }) {
  const [open, setOpen] = useState(null);

  // ✅ TTS
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
            <span
              key={i}
              className="hint-word"
              onClick={() => {
                speak(word.replace(/[.,!?。、]/g, ''));
                setOpen(open === i ? null : i);
              }}
            >
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

// ── Shuffle array ─────────────────────────────────────────────
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ── Stage 1: chunk ordering (drag & click) ────────────────────
function ChunkStage({ sentence, onPass }) {
  const shuffled = useMemo(() => shuffle(sentence.chunks), [sentence.text]);
  const [selected, setSelected] = useState([]);
  const [wrong, setWrong] = useState(false);

  const remaining = shuffled.filter((c) => !selected.includes(c));

  const add = (chunk) => setSelected((p) => [...p, chunk]);
  const remove = (i) => setSelected((p) => p.filter((_, j) => j !== i));

  const check = () => {
    const correct = sentence.chunks.join(' ');
    const attempt = selected.join(' ');
    if (attempt === correct) {
      onPass();
    } else {
      setWrong(true);
      setTimeout(() => { setSelected([]); setWrong(false); }, 800);
    }
  };

  return (
    <div className="chunk-stage">
      <p className="stage-label">Step 1 — Put the chunks in order</p>

      {/* Answer area */}
      <div className={`chunk-answer ${wrong ? 'shake' : ''}`}>
        {selected.length === 0
          ? <span className="chunk-placeholder">Tap chunks below ↓</span>
          : selected.map((c, i) => (
            <button key={i} type="button" className="chunk-token selected" onClick={() => remove(i)}>
              {c}
            </button>
          ))}
      </div>

      {/* Remaining chunks */}
      <div className="chunk-pool">
        {remaining.map((c, i) => (
          <button key={i} type="button" className="chunk-token" onClick={() => add(c)}>
            {c}
          </button>
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

// ── Stage 2: 객관식 빈칸 채우기 (클릭) ───────────────────────
function ChoiceBlankStage({ sentence, blankCount, stepNum, onPass, onSubmitAnswer }) {
  const blanks = useMemo(() => {
    const idx = shuffle([...Array(sentence.chunks.length).keys()]);
    return idx.slice(0, blankCount).sort((a, b) => a - b); // 왼→오 순서 보장
  }, [sentence.text, blankCount]);

  // Options = all chunks shuffled
  const options = useMemo(() => shuffle(sentence.chunks), [sentence.text]);

  const [filled, setFilled] = useState({}); // { blankIdx: chunkStr }
  const [result, setResult] = useState(null); // null | 'correct' | 'wrong'

  const blankSet = useMemo(() => new Set(blanks), [blanks]);

  const handleOption = (chunk) => {
    if (result === 'correct') return;
    // Fill next empty blank in order
    const nextBlank = blanks.find((i) => filled[i] === undefined);
    if (nextBlank === undefined) return;
    const next = { ...filled, [nextBlank]: chunk };
    setFilled(next);

    // Auto-check when all blanks filled
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

      {/* Sentence with blanks */}
      <div className="blank-sentence">
        {sentence.chunks.map((chunk, i) =>
          blankSet.has(i) ? (
            <span key={i} className={`blank-box ${filled[i] ? 'filled' : ''} ${result === 'wrong' ? 'wrong' : result === 'correct' ? 'correct' : ''}`}>
              {filled[i] || '___'}
            </span>
          ) : (
            <span key={i} className="blank-chunk">
              <HintText text={chunk} hints={sentence.hints} />
            </span>
          )
        )}
      </div>

      {/* Choice buttons */}
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

// ── Stage 3: 1-blank 객관식 (동일 방식) ─────────────────────

// ── One sentence card (3 stages) ─────────────────────────────
function SentenceCard({ sentence, index, onComplete, onSubmitAnswer }) {
  const [stage, setStage] = useState(1); // 1, 2, 3, 'done'

  if (stage === 'done') {
    return (
      <div className="sentence-card done-card">
        <Check size={18} />
        <span>Sentence {index + 1} complete</span>
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

      <p className="sentence-full">
        <HintText text={sentence.text} hints={sentence.hints} />
      </p>

      {stage === 1 && (
        <ChunkStage sentence={sentence} onPass={() => setStage(2)} />
      )}
      {stage === 2 && (
        <ChoiceBlankStage sentence={sentence} blankCount={2} stepNum={2} onPass={() => setStage(3)} onSubmitAnswer={onSubmitAnswer} />
      )}
      {stage === 3 && (
        <ChoiceBlankStage sentence={sentence} blankCount={1} stepNum={3} onPass={() => { setStage('done'); onComplete(); }} onSubmitAnswer={onSubmitAnswer} />
      )}
    </div>
  );
}

// ── Main PracticeSection ──────────────────────────────────────
export default function PracticeSection({ lesson, onSubmitAnswer, onAllAnswered }) {
  const sentences = lesson.sentences || [];
  const [cleared, setCleared] = useState(0); // how many sentences fully cleared

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
        <p style={{ color: 'var(--muted)' }}>
          Manager: add sentences in the Manager → Add Lesson form.
        </p>
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
        {sentences.map((sentence, i) => (
          i <= cleared ? (
            <SentenceCard
              key={i}
              sentence={sentence}
              index={i}
              onComplete={() => handleSentenceComplete(i)}
              onSubmitAnswer={onSubmitAnswer}
            />
          ) : (
            <div key={i} className="sentence-card locked-card">
              <span className="lock-icon">🔒</span>
              <span>Sentence {i + 1} — Complete previous sentence first</span>
            </div>
          )
        ))}
      </div>
    </section>
  );
}
