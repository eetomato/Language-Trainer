import { useState } from 'react';
import { Send } from 'lucide-react';

export default function OutputSection({ sentences, onSubmit }) {
  const [memo, setMemo] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!memo.trim()) return;
    setSubmitted(true);
    onSubmit?.(memo);
  };

  if (submitted) {
    return (
      <section className="lesson-section output-section">
        <p className="eyebrow">D. Output</p>
        <p className="output-done">✓ Submitted. Complete the lesson below.</p>
      </section>
    );
  }

  return (
    <section className="lesson-section output-section">
      <div className="section-heading">
        <p className="eyebrow">D. Output</p>
        <h2>Write it out</h2>
      </div>

      <p className="output-hint">
        Today's sentences — write 3 lines in English using what you learned.
      </p>

      <ul className="output-ref-list">
        {sentences.map((s, i) => (
          <li key={i}>{s.english}</li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="output-form">
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder={`Line 1: This jacket runs slightly large.\nLine 2: ...\nLine 3: ...`}
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
    </section>
  );
}
