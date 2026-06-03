import { useState } from 'react';
import { Send, Loader } from 'lucide-react';

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

async function getFeedback(sentences, memo) {
  if (!ANTHROPIC_API_KEY) {
    // Fallback if no API key
    return 'よく書けています！表現を接客の場でも使ってみてください。';
  }

  const sentenceList = sentences.map((s, i) => `${i + 1}. ${s.text}`).join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `You are an English teacher for Japanese retail staff.
Today's lesson sentences:
${sentenceList}

The student wrote:
${memo}

Give short, encouraging feedback in Japanese.
Point out 1 correction if needed.
Keep it under 3 sentences.`,
        },
      ],
    }),
  });

  if (!response.ok) throw new Error('API error');
  const data = await response.json();
  return data.content?.[0]?.text || 'フィードバックを取得できませんでした。';
}

export default function OutputSection({ sentences, onSubmit }) {
  const [memo, setMemo] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!memo.trim()) return;
    setLoading(true);
    try {
      const fb = await getFeedback(sentences, memo);
      setFeedback(fb);
      setSubmitted(true);
      onSubmit?.();
    } catch (_) {
      setFeedback('フィードバックを取得できませんでした。Continue to complete the lesson.');
      setSubmitted(true);
      onSubmit?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="lesson-section output-section">
      <div className="section-heading">
        <p className="eyebrow">D. Output</p>
        <h2>Write it out</h2>
      </div>

      <p className="output-hint">今日学んだ表現を使って英語で3文書いてみましょう。</p>

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
            disabled={loading}
          />
          <button
            type="submit"
            className="primary-action compact"
            disabled={loading || !memo.trim()}
          >
            {loading ? <><Loader size={16} className="spin-icon" /> Checking...</> : <><Send size={16} /> Submit</>}
          </button>
        </form>
      ) : (
        <div className="output-feedback">
          <p className="eyebrow" style={{ color: 'var(--accent)' }}>AI Feedback</p>
          <p className="feedback-text">{feedback}</p>
        </div>
      )}
    </section>
  );
}
