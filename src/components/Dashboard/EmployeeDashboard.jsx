import { useState, useEffect } from 'react';
import { BookOpen, Clock, CalendarDays, Flame, CheckCircle2, XCircle } from 'lucide-react';
import { formatMinutes } from '../../utils/dataFormatter';

function weekLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}〜`;
}

function TodayStats({ stats }) {
  const today = new Date().toLocaleDateString('ja-JP');
  return (
    <div className="metric-grid">
      <article className="metric-card">
        <Clock size={18} className="metric-icon" />
        <span>Study Time</span>
        <strong>{formatMinutes(stats.studyMinutes)}</strong>
      </article>
      <article className="metric-card">
        <CalendarDays size={18} className="metric-icon" />
        <span>Last Study</span>
        <strong>{stats.lastLesson}</strong>
      </article>
      <article className="metric-card">
        <Flame size={18} className="metric-icon" />
        <span>Streak</span>
        <strong>{stats.streak} day{stats.streak !== 1 ? 's' : ''}</strong>
      </article>
    </div>
  );
}

function TestResultSection({ userName }) {
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem('nh_test_results') || '[]');
    // 本人の最新テスト結果
    const mine = all
      .filter((r) => r.employeeName === userName)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    if (mine.length) setResult(mine[0]);
  }, [userName]);

  if (!result) return null;

  const passed = result.score >= 80;

  return (
    <section className="dashboard-band">
      <div className="section-heading">
        <p className="eyebrow">Weekly Test — {weekLabel(result.week)}</p>
        <h2>テスト結果</h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: passed ? 'var(--success, #22c55e)' : 'var(--warning, #ef4444)',
          }}
        >
          {result.score}%
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            {passed ? '🎉 よくできました！' : '📚 復習して再挑戦！'}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            {new Date(result.date).toLocaleDateString('ja-JP')} 受験
          </p>
        </div>
      </div>

      {result.wrong?.length > 0 && (
        <>
          <button
            type="button"
            className="text-action"
            style={{ marginBottom: 12 }}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? '▲ 閉じる' : `▼ 間違えた問題を見る (${result.wrong.length}問)`}
          </button>
          {expanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.wrong.map((w, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--paper, #f5f5f5)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    borderLeft: '3px solid var(--warning, #ef4444)',
                  }}
                >
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 4 }}>Q{i + 1}</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 4 }}>{w.question}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--success, #22c55e)' }}>→ {w.answer}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {(!result.wrong || result.wrong.length === 0) && (
        <p style={{ fontSize: '0.9rem', color: 'var(--success, #22c55e)', fontWeight: 600 }}>
          <CheckCircle2 size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          全問正解！
        </p>
      )}
    </section>
  );
}

export default function EmployeeDashboard({ user, stats, onStartLesson }) {
  return (
    <section className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Staff dashboard</p>
          <h2>{user.name}</h2>
          <p>{user.storeName || user.store_name} store practice summary</p>
        </div>
        <button type="button" className="primary-action compact" onClick={onStartLesson}>
          <BookOpen size={18} />
          Start lesson
        </button>
      </div>

      <TodayStats stats={stats} />

      <TestResultSection userName={user.name} />
    </section>
  );
}
