import { useState } from 'react';
import { Check } from 'lucide-react';

function normalize(s) {
  return String(s || '').trim().toLowerCase().replace(/[.,!?。、'']/g, '');
}

function weekLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}〜`;
}

export default function WeeklyTest({ user, weekDate, testQuestions, onComplete, onBack }) {
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);

  const part1 = (testQuestions || []).filter((q) => q.type === 'translation');
  const part2 = (testQuestions || []).filter((q) => q.type === 'situation');

  // ── 로딩 중 ───────────────────────────────────────────────
  if (testQuestions === null) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: 64 }}>
        <div className="loading-spinner"
          style={{ borderColor: 'rgba(0,0,0,.12)', borderTopColor: 'var(--ink)' }} />
      </div>
    );
  }

  // ── 문제 없음 ──────────────────────────────────────────────
  if (testQuestions.length === 0) {
    return (
      <div className="lesson-page">
        <section className="lesson-hero">
          <div>
            <button type="button" className="back-btn" onClick={onBack}>← Back / 戻る</button>
            <p className="eyebrow">Weekly Test</p>
            <h2>週間テスト</h2>
          </div>
        </section>
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted)' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>📝</p>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>準備中です</p>
          <p style={{ fontSize: '0.9rem' }}>Coming soon — check back later!</p>
        </div>
      </div>
    );
  }

  // ── 채점 ───────────────────────────────────────────────────
  const handleSubmit = () => {
    const allQ = [...part1, ...part2];
    const res = allQ.map((q, i) => {
      const isCorrect = normalize(answers[i]) === normalize(q.answer);
      return { ...q, userAnswer: answers[i] || '', isCorrect };
    });
    setResults(res);

    const wrong = res.filter((r) => !r.isCorrect);
    const score = Math.round(((res.length - wrong.length) / res.length) * 100);

    const stored = JSON.parse(localStorage.getItem('nh_test_results') || '[]');
    stored.push({
      week: weekDate,
      score,
      wrong: wrong.map((r) => ({ question: r.question, answer: r.answer })),
      date: new Date().toISOString(),
      shown: false,
    });
    localStorage.setItem('nh_test_results', JSON.stringify(stored));
    onComplete?.();
  };

  // ── 결과 화면 ──────────────────────────────────────────────
  if (results) {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const pct = Math.round((correctCount / results.length) * 100);
    return (
      <div className="lesson-page">
        <section className="lesson-hero">
          <div>
            <button type="button" className="back-btn" onClick={onBack}>← Back / 戻る</button>
            <p className="eyebrow">Weekly Test — Complete</p>
            <h2>週間テスト結果</h2>
          </div>
        </section>
        <section className="lesson-section complete-section">
          <div className="complete-score">
            <strong>{pct}%</strong>
            <p>{correctCount} / {results.length} correct</p>
          </div>

          {results.some((r) => !r.isCorrect) && (
            <div className="test-wrong-list">
              <p className="eyebrow" style={{ marginTop: 24 }}>要復習</p>
              {results.filter((r) => !r.isCorrect).map((r, i) => (
                <div key={i} className="test-wrong-item">
                  <p className="test-sentence" style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                    {r.question}
                  </p>
                  <p className="test-answer-row">
                    <span className="wrong-label">Your answer:</span> {r.userAnswer || '(blank)'}
                  </p>
                  <p className="test-answer-row correct-answer">
                    <span className="correct-label">Correct:</span> {r.answer}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // ── 테스트 화면 ────────────────────────────────────────────
  const allFilled = [...part1, ...part2].every((_, i) => (answers[i] || '').trim());

  const QuestionCard = ({ q, idx, label }) => (
    <div className="sentence-card">
      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontWeight: 600, marginBottom: 10 }}>{q.question}</p>
      <input
        type="text"
        className="blank-input"
        style={{ width: '100%', boxSizing: 'border-box' }}
        value={answers[idx] || ''}
        onChange={(e) => setAnswers((p) => ({ ...p, [idx]: e.target.value }))}
        placeholder="英語で入力してください..."
      />
    </div>
  );

  return (
    <div className="lesson-page">
      <section className="lesson-hero">
        <div>
          <button type="button" className="back-btn" onClick={onBack}>← Back / 戻る</button>
          <p className="eyebrow">Weekly Test {weekDate ? `— ${weekLabel(weekDate)}` : ''}</p>
          <h2>週間テスト</h2>
          <p>{user.name} — 英語で答えてください。</p>
        </div>
        <div className="review-badge test-badge"><span>TEST</span></div>
      </section>

      <section className="lesson-section">
        {part1.length > 0 && (
          <>
            <div className="section-heading">
              <p className="eyebrow">Part 1 — Translation</p>
              <h2>日本語 → 英語</h2>
            </div>
            <div className="sentence-cards">
              {part1.map((q, i) => (
                <QuestionCard key={i} q={q} idx={i} label={`Q${i + 1}`} />
              ))}
            </div>
          </>
        )}

        {part2.length > 0 && (
          <>
            <div className="section-heading" style={{ marginTop: 24 }}>
              <p className="eyebrow">Part 2 — Situation</p>
              <h2>状況 → 英語</h2>
            </div>
            <div className="sentence-cards">
              {part2.map((q, i) => (
                <QuestionCard key={i} q={q} idx={part1.length + i} label={`Q${part1.length + i + 1}`} />
              ))}
            </div>
          </>
        )}

        <button
          type="button"
          className="primary-action complete-btn"
          style={{ marginTop: 24 }}
          onClick={handleSubmit}
          disabled={!allFilled}
        >
          <Check size={18} /> Submit Test
        </button>
      </section>
    </div>
  );
}
