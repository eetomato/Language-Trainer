import { ChevronRight } from 'lucide-react';

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
          <h2>Select a lesson</h2>
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
            <h3 className="lesson-card-title">{lesson.lessonTitle}</h3>
            <div className="lesson-card-footer">
              <span>Week {lesson.weekNumber} · Day {lesson.dayNumber}</span>
              <ChevronRight size={16} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
