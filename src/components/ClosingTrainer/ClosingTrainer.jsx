import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import ClosingCategory from './ClosingCategory';

const CATEGORY_ICONS = {
  appreciation: '🙏',
  reassurance: '✨',
  farewell: '👋',
  revisit: '🔄',
  product: '👔',
};

export default function ClosingTrainer({ user, saveSession }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase
      .from('closing_content')
      .select('*')
      .eq('is_hidden', false)
      .order('created_at')
      .then(({ data, error }) => {
        if (!error && data) {
          setCategories(data.map((row) => ({
            id: row.id,
            category: row.category,
            intent: row.intent,
            description: row.intent,
            expressions: row.expressions || [],
            color: '#F7F7F7',
          })));
        }
        setLoading(false);
      });
  }, []);

  if (selected) {
    return (
      <ClosingCategory
        category={selected}
        onBack={() => setSelected(null)}
        onComplete={(studyMinutes) => {
          saveSession?.({ lessonId: `closing-${selected.id}`, studyMinutes });
          setSelected(null);
        }}
      />
    );
  }

  return (
    <div className="closing-trainer">
      <div className="closing-header">
        <p className="eyebrow">Customer English</p>
        <h2>接客で使える英語表現</h2>
        <p className="closing-subtitle">カテゴリを選んで表現を練習しましょう。</p>
      </div>

      {loading && (
        <div style={{ display: 'grid', placeItems: 'center', padding: 48 }}>
          <div className="loading-spinner"
            style={{ borderColor: 'rgba(0,0,0,.12)', borderTopColor: 'var(--ink)' }} />
        </div>
      )}

      {!loading && categories.length === 0 && (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted)' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>💬</p>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>準備中です</p>
          <p style={{ fontSize: '0.9rem' }}>Coming soon — check back later!</p>
        </div>
      )}

      {!loading && categories.length > 0 && (
        <div className="closing-grid">
          {categories.map((cat) => {
            const icon = CATEGORY_ICONS[cat.id] || '💬';
            const count = (cat.expressions || []).length;
            return (
              <button
                key={cat.id}
                className="closing-cat-card"
                style={{ background: cat.color }}
                type="button"
                onClick={() => setSelected(cat)}
              >
                <span className="closing-cat-icon">{icon}</span>
                <p className="closing-cat-name">{cat.category}</p>
                <p className="closing-cat-intent">{cat.intent}</p>
                <p className="closing-cat-count">{count} expressions</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
