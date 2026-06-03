import { ChevronRight } from 'lucide-react';
import PracticeSection from './PracticeSection';

export default function ReviewSection({ lesson, user, onComplete }) {
  if (!lesson?.sentences?.length) {
    onComplete?.();
    return null;
  }

  return (
    <div className="lesson-page">
      <section className="lesson-hero">
        <div>
          <p className="eyebrow">Review — Day {lesson.dayNumber}</p>
          <h2>昨日の復習</h2>
          <p>{user.name} — 昨日の表現をもう一度練習しましょう。</p>
        </div>
        <div className="review-badge">
          <span>復習</span>
        </div>
      </section>

      <PracticeSection
        lesson={lesson}
        onSubmitAnswer={async () => {}}
        onAllAnswered={onComplete}
      />
    </div>
  );
}
