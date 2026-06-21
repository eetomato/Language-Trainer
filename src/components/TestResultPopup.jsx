import { X } from 'lucide-react';

export default function TestResultPopup({ result, onClose }) {
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

        <button type="button" className="primary-action compact"
          style={{ width: '100%', marginTop: 16 }} onClick={onClose}>
          閉じる
        </button>
      </div>
    </div>
  );
}
