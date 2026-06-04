import { useMemo, useState } from 'react';
import { useProgress } from '../../hooks/useProgress';
import LessonPage from './LessonPage';
import ReviewSection from './ReviewSection';
import WeeklyTest from './WeeklyTest';

export default function LessonFlow({
  user, lessons, latestLesson, lessonsLoading,
  submitAnswer, saveSession, employeeStats,
}) {
  const { isLessonDone, isTestDone, markLessonComplete, markTestComplete } = useProgress(user);
  const [reviewDone, setReviewDone] = useState(false);

  // Sort lessons by week → day
  const sorted = useMemo(() =>
    [...lessons].sort((a, b) =>
      a.weekNumber !== b.weekNumber ? a.weekNumber - b.weekNumber : a.dayNumber - b.dayNumber
    ), [lessons]);

  if (lessonsLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: 64 }}>
        <div className="loading-spinner"
          style={{ borderColor: 'rgba(0,0,0,.12)', borderTopColor: 'var(--ink)' }} />
      </div>
    );
  }

  // First uncompleted non-Day7 lesson; fallback to latest created lesson
  const todayIdx = sorted.findIndex((l) => l.dayNumber !== 7 && !isLessonDone(l.id));
  const todayLesson = sorted[todayIdx] ?? latestLesson ?? null;
  const yesterdayLesson = todayIdx > 0 ? sorted[todayIdx - 1] : null;

  // Determine if weekly test is pending
  const currentWeek = todayLesson?.weekNumber
    ?? sorted.filter((l) => l.dayNumber !== 7).at(-1)?.weekNumber
    ?? 1;

  const weekDays = sorted.filter((l) => l.weekNumber === currentWeek && l.dayNumber < 7);
  const allWeekDone = weekDays.length > 0 && weekDays.every((l) => isLessonDone(l.id));
  const testPending = allWeekDone && !isTestDone(currentWeek);

  // ── Day 7 weekly test ──────────────────────────────────────
  if (testPending) {
    const weekSentences = weekDays.flatMap((l) => l.sentences || []);
    return (
      <WeeklyTest
        user={user}
        weekNumber={currentWeek}
        sentences={weekSentences}
        onComplete={(wrongSentences) => markTestComplete(currentWeek)}
      />
    );
  }

  // ── All done ───────────────────────────────────────────────
  if (!todayLesson) {
    return (
      <div className="lesson-page">
        <section className="lesson-hero" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <p className="eyebrow">All complete</p>
          <h2>今週のレッスン完了！</h2>
          <p>マネージャーが次のレッスンを追加するまでお待ちください。</p>
        </section>
      </div>
    );
  }

  const dayNum = todayLesson.dayNumber;
  const isReviewDay = dayNum >= 2 && dayNum <= 6 && !!yesterdayLesson;

  // ── Review (Day 2-6) ───────────────────────────────────────
  if (isReviewDay && !reviewDone) {
    return (
      <ReviewSection
        lesson={yesterdayLesson}
        user={user}
        onComplete={() => setReviewDone(true)}
      />
    );
  }

  // ── New lesson ─────────────────────────────────────────────
  return (
    <LessonPage
      user={user}
      lesson={todayLesson}
      onSubmitAnswer={submitAnswer}
      onSaveSession={(data) => {
        saveSession(data);
        markLessonComplete(todayLesson.id);
      }}
      stats={employeeStats}
      onBack={null}
    />
  );
}
