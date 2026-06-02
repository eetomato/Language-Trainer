import { ChevronRight } from 'lucide-react';

const DIFFICULTY_LABEL = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
};

export default function LessonList({ lessons, loading, onSelect }) {
  if (loading) {
    return (
      <div className="lesson-page">
        <div className="lesson-hero">
          <div>
            <p className="eyebrow">Lessons</p>
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-page">
      <div className="lesson-hero">
        <div>
          <p className="eyebrow">Lessons</p>
          <h2>レッスンを選択</h2>
          <p>学習するレッスンをタップしてください。</p>
        </div>
      </div>

      <div className="lesson-list-grid">
        {lessons.map((lesson) => (
          <button
            key={lesson.id}
            className="lesson-card-btn"
            onClick={() => onSelect(lesson)}
            type="button"
          >
            <div className="lesson-card-top">
              <p className="eyebrow">{lesson.topicArea}</p>
              <span className={`difficulty-badge diff-${lesson.difficultyLevel}`}>
                {DIFFICULTY_LABEL[lesson.difficultyLevel] || lesson.difficultyLevel}
              </span>
            </div>
            <h3 className="lesson-card-title">{lesson.lessonTitle}</h3>
            <div className="lesson-card-footer">
              <span>{lesson.questions.length} questions</span>
              <ChevronRight size={16} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
