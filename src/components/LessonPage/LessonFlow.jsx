import { useMemo, useState } from 'react';
import { useProgress } from '../../hooks/useProgress';
import LessonPage from './LessonPage';
import ReviewSection from './ReviewSection';
import WeeklyTest from './WeeklyTest';

// ✅ 날짜 문자열 (YYYY-MM-DD) 반환
function toDateStr(isoStr) {
  return isoStr ? isoStr.slice(0, 10) : null;
}

export default function LessonFlow({
  user, lessons, latestLesson, lessonsLoading,
  submitAnswer, saveSession, employeeStats,
}) {
  const { completed, isLessonDone, isTestDone, markLessonComplete, markTestComplete } = useProgress(user);
  const [reviewDone, setReviewDone] = useState(false);

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

  // ✅ 미완료 레슨 중 첫 번째
  const todayIdx = sorted.findIndex((l) => l.dayNumber !== 7 && !isLessonDone(l.id));
  const todayLesson = sorted[todayIdx] ?? latestLesson ?? null;

  // ✅ dayNumber 대신 날짜 기반으로 복습 판단
  const today = toDateStr(new Date().toISOString());
  const lastCompleted = completed.length > 0
    ? completed[completed.length - 1]
    : null;
  const lastCompletedDate = lastCompleted ? toDateStr(lastCompleted.date) : null;
  const lastCompletedLesson = lastCompleted
    ? sorted.find((l) => l.id === lastCompleted.lessonId) ?? null
    : null;

  // 어제 완료한 레슨이 있고, 오늘 아직 새 레슨을 시작 안 했으면 복습
  const isReviewDay = lastCompletedDate !== null
    && lastCompletedDate !== today
    && !!lastCompletedLesson
    && !reviewDone;

  // Weekly test
  const currentWeek = todayLesson?.weekNumber
    ?? sorted.filter((l) => l.dayNumber !== 7).at(-1)?.weekNumber
    ?? 1;
  const weekDays = sorted.filter((l) => l.weekNumber === currentWeek && l.dayNumber < 7);
  const allWeekDone = weekDays.length > 0 && weekDays.every((l) => isLessonDone(l.id));
  const testPending = allWeekDone && !isTestDone(currentWeek);

  if (testPending) {
    const weekSentences = weekDays.flatMap((l) => l.sentences || []);
    return (
      <WeeklyTest
        user={user}
        weekNumber={currentWeek}
        sentences={weekSentences}
        onComplete={() => markTestComplete(currentWeek)}
      />
    );
  }

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

  // ── Review ─────────────────────────────────────────────────
  if (isReviewDay) {
    return (
      <ReviewSection
        lesson={lastCompletedLesson}
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
