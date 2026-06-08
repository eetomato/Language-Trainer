import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { CLOSING_CATEGORIES } from './closingData';
import ClosingCategory from './ClosingCategory';

export default function ClosingTrainer({ user }) {
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
        // 로컬 데이터와 병합 (id 기준 중복 제거)
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
      />
    );
  }

  return (
    <div className="closing-trainer">
      <div className="closing-header">
        <p className="eyebrow">Closing Trainer</p>
        <h2>Closing Expressions</h2>
        <p className="closing-subtitle">接客の締めくくりに使う英語表現を練習しましょう。</p>
      </div>

      <div className="closing-grid">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className="closing-cat-card"
            style={{ background: cat.color }}
            type="button"
            onClick={() => setSelected(cat)}
          >
            <p className="closing-cat-name">{cat.category}</p>
            <p className="closing-cat-intent">{cat.intent}</p>
            <p className="closing-cat-count">{(cat.expressions || []).length} expressions</p>
          </button>
        ))}
      </div>
    </div>
  );
}
