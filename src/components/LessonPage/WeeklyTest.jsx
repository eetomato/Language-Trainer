import { useState } from 'react';
import { Check } from 'lucide-react';

function normalize(s) {
  return String(s || '').trim().toLowerCase().replace(/[.,!?。、]/g, '');
}

export default function WeeklyTest({ user, weekNumber, sentences, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);

  const handleSubmit = () => {
    const res = sentences.map((s, i) => {
      // Blank the last chunk as the test target
      const targetIdx = s.chunks.length - 1;
      const correct = s.chunks[targetIdx];
      const isCorrect = normalize(answers[i]) === normalize(correct);
      return { sentence: s, userAnswer: answers[i] || '', isCorrect, correct };
    });
    setResults(res);
    const wrong = res.filter((r) => !r.isCorrect).map((r) => r.sentence);
    onComplete?.(wrong);
  };

  // ── Results screen ─────────────────────────────────────────
  if (results) {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const pct = Math.round((correctCount / results.length) * 100);
    return (
      <div className="lesson-page">
        <section className="lesson-section complete-section">
          <p className="eyebrow">Week {weekNumber} — Test Complete</p>
          <div className="complete-score">
            <strong>{pct}%</strong>
            <p>{correctCount} / {results.length} correct</p>
          </div>

          {results.filter((r) => !r.isCorrect).length > 0 && (
            <div className="test-wrong-list">
              <p className="eyebrow" style={{ marginTop: 24 }}>要復習</p>
              {results.filter((r) => !r.isCorrect).map((r, i) => (
                <div key={i} className="test-wrong-item">
                  <p className="test-sentence">{r.sentence.text}</p>
                  <p className="test-answer-row">
                    <span className="wrong-label">Your answer:</span> {r.userAnswer || '(blank)'}
                  </p>
                  <p className="test-answer-row correct-answer">
                    <span className="correct-label">Correct:</span> {r.correct}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // ── Test screen ────────────────────────────────────────────
  const allFilled = sentences.every((_, i) => (answers[i] || '').trim());

  return (
    <div className="lesson-page">
      <section className="lesson-hero">
        <div>
          <p className="eyebrow">Week {weekNumber} — Day 7</p>
          <h2>週間テスト</h2>
          <p>{user.name} — 今週の {sentences.length} 文を完成させてください。</p>
        </div>
        <div className="review-badge test-badge">
          <span>TEST</span>
        </div>
      </section>

      <section className="lesson-section">
        <div className="section-heading">
          <p className="eyebrow">Fill in the blank</p>
          <h2>最後の単語を入れてください</h2>
        </div>

        <div className="sentence-cards">
          {sentences.map((s, i) => {
            const blankIdx = s.chunks.length - 1;
            return (
              <div key={i} className="sentence-card">
                <div className="blank-sentence">
                  {s.chunks.map((chunk, j) =>
                    j === blankIdx ? (
                      <input
                        key={j}
                        type="text"
                        className="blank-input"
                        value={answers[i] || ''}
                        onChange={(e) => setAnswers((p) => ({ ...p, [i]: e.target.value }))}
                        placeholder="___"
                        style={{ width: Math.max(80, chunk.length * 9) }}
                      />
                    ) : (
                      <span key={j} className="blank-chunk">{chunk}{' '}</span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="primary-action complete-btn"
          onClick={handleSubmit}
          disabled={!allFilled}
        >
          <Check size={18} /> Submit Test
        </button>
      </section>
    </div>
  );
}
