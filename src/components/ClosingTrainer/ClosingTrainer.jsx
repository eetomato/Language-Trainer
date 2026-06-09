import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { CLOSING_CATEGORIES } from './closingData';
import ClosingCategory from './ClosingCategory';

const CATEGORY_ICONS = {
  appreciation: '🙏',
  reassurance: '✨',
  farewell: '👋',
  revisit: '🔄',
  product: '👔',
};

export default function ClosingTrainer({ user, saveSession }) {
  const [categories, setCategories] = useState(CLOSING_CATEGORIES);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('closing_content')
      .select('*')
      .order('created_at')
      .then(({ data, error }) => {
        if (error || !data) return;
        setCategories((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const newOnes = data
            .filter((row) => !existingIds.has(row.id))
            .map((row) => ({
              id: row.id,
              category: row.category,
              intent: row.intent,
              description: row.intent,
              expressions: row.expressions || [],
              color: '#F7F7F7',
            }));
          return [...prev, ...newOnes];
        });
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
    </div>
  );
}
