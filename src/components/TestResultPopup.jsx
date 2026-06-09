import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

export default function TestResultPopup({ result, onClose }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="popup-close" onClick={onClose}>
          <X size={18} />
        </button>

        <p className="eyebrow" style={{ color: 'var(--accent)' }}>
          先週のテスト結果 / Last Week's Test
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 8 }}>
          Week {result.week}
        </p>

        <div className="popup-score">
          <strong>{result.score}%</strong>
        </div>

        <p className="popup-msg">
          {result.score >= 80
            ? '🎉 よくできました！Great work!'
            : '📚 復習が必要です。Keep practicing!'}
        </p>

        <button
          type="button"
          className="popup-expand-btn"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? '閉じる' : '詳細を見る'}
        </button>

        {expanded && (
          <div className="popup-detail">
            {result.wrong?.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                ✓ 全問正解！Perfect score!
              </p>
            ) : (
              <>
                <p className="eyebrow" style={{ marginBottom: 8 }}>要復習</p>
                {result.wrong.map((sentence, i) => (
                  <div key={i} className="popup-wrong-item">
                    <p>{sentence.text}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <button type="button" className="primary-action compact"
          style={{ width: '100%', marginTop: 16 }} onClick={onClose}>
          閉じる
        </button>
      </div>
    </div>
  );
}
