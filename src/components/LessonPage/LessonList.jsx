import { ChevronRight, CheckCircle, ChevronLeft } from 'lucide-react';
import { useProgress } from '../../hooks/useProgress';

export default function LessonList({ lessons, loading, user, onSelect, onBack }) {
  const { isLessonDone } = useProgress(user);

  if (loading) {
    return (
      <div className="lesson-page">
        <div className="lesson-hero">
          <div>
            <p className="eyebrow">Video Lesson / ビデオレッスン</p>
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
          {onBack && (
            <button type="button" className="back-btn" onClick={onBack}>
              <ChevronLeft size={16} /> Back / 戻る
            </button>
          )}
          <p className="eyebrow">Video Lesson / ビデオレッスン</p>
          <h2>レッスンを選んでください</h2>
          <p>Select a lesson to start</p>
        </div>
      </div>

      <div className="lesson-list-grid">
        {lessons.map((lesson) => {
          const done = isLessonDone(lesson.id);
          return (
            <button
              key={lesson.id}
              className={`lesson-card-btn ${done ? 'done' : ''}`}
              onClick={() => onSelect(lesson)}
              type="button"
            >
              <div className="lesson-card-top">
                <h3 className="lesson-card-title">{lesson.lessonTitle}</h3>
                {done && <CheckCircle size={18} className="lesson-done-icon" />}
              </div>
              {lesson.topicArea && (
                <p className="lesson-card-topic">{lesson.topicArea}</p>
              )}
              <div className="lesson-card-footer">
                <ChevronRight size={16} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
