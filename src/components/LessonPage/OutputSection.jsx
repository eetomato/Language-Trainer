import { useState } from 'react';
import { Send } from 'lucide-react';

function getLocalFeedback(sentences, memo) {
  const lines = memo.trim().split('\n').filter((l) => l.trim());
  const lessonWords = sentences.flatMap((s) =>
    s.text.toLowerCase().split(/\s+/).map((w) => w.replace(/[.,!?]/g, ''))
  );

  const usedWords = lessonWords.filter((w) =>
    w.length > 3 && memo.toLowerCase().includes(w)
  );

  if (lines.length < 2) {
    return "Try to write at least 3 sentences. You can do it! 💪";
  }
  if (usedWords.length === 0) {
    return "Good effort! Try using words from today's lesson in your sentences.";
  }
  if (lines.length >= 3 && usedWords.length >= 2) {
    return `Great work! You used lesson expressions naturally. Keep practicing on the floor! 🌟`;
  }
  return `Nice try! You used ${usedWords.length} word(s) from the lesson. Try adding more expressions next time.`;
}

export default function OutputSection({ sentences, onSubmit }) {
  const [memo, setMemo] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!memo.trim()) return;
    const fb = getLocalFeedback(sentences, memo);
    setFeedback(fb);
    setSubmitted(true);
    onSubmit?.();
  };

  return (
    <section className="lesson-section output-section">
      <div className="section-heading">
        <p className="eyebrow">D. Output</p>
        <h2>Write it out</h2>
      </div>

      <p className="output-hint">Use today's expressions to write 3 sentences in English.</p>

      <ul className="output-ref-list">
        {sentences.map((s, i) => <li key={i}>{s.text}</li>)}
      </ul>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="output-form">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder={`Line 1: ...\nLine 2: ...\nLine 3: ...`}
            rows={5}
          />
          <button
            type="submit"
            className="primary-action compact"
            disabled={!memo.trim()}
          >
            <Send size={16} /> Submit
          </button>
        </form>
      ) : (
        <div className="output-feedback">
          <p className="eyebrow" style={{ color: 'var(--accent)' }}>Feedback</p>
          <p className="feedback-text">{feedback}</p>
        </div>
      )}
    </section>
  );
}
