import { BookOpen, RotateCcw } from 'lucide-react';
import { formatMinutes } from '../../utils/dataFormatter';

export default function EmployeeDashboard({ user, stats, onStartLesson, onReset }) {
  return (
    <section className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Staff dashboard</p>
          <h2>{user.name}</h2>
          <p>{user.storeName} store practice summary</p>
        </div>
        <button type="button" className="primary-action compact" onClick={onStartLesson}>
          <BookOpen size={18} />
          Start lesson
        </button>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <span>Total Score</span>
          <strong>{stats.score}%</strong>
        </article>
        <article className="metric-card">
          <span>Study Time</span>
          <strong>{formatMinutes(stats.studyMinutes)}</strong>
        </article>
        <article className="metric-card">
          <span>Last Lesson</span>
          <strong>{stats.lastLesson}</strong>
        </article>
        <article className="metric-card">
          <span>Streak</span>
          <strong>{stats.streak} day</strong>
        </article>
      </div>

      <section className="dashboard-band">
        <div className="section-heading">
          <p className="eyebrow">Weak vocabulary</p>
          <h2>Review next</h2>
        </div>
        {stats.weakVocabulary.length ? (
          <div className="weak-list">
            {stats.weakVocabulary.map((item) => (
              <p key={item.word}>
                <strong>{item.word}</strong>
                <span>{item.count} mistake{item.count > 1 ? 's' : ''}</span>
              </p>
            ))}
          </div>
        ) : (
          <p className="empty-state">No weak words yet. Complete the practice once.</p>
        )}
        <button type="button" className="text-action" onClick={onReset}>
          <RotateCcw size={16} />
          Reset my local progress
        </button>
      </section>
    </section>
  );
}
