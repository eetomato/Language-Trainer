import { useMemo, useState } from 'react';
import { useProgress } from '../../hooks/useProgress';
import LessonPage from './LessonPage';
import LessonList from './LessonList';
import ReviewSection from './ReviewSection';
import WeeklyTest from './WeeklyTest';

function toDateStr(isoStr) {
  return isoStr ? isoStr.slice(0, 10) : null;
}

export default function LessonFlow({
  user, lessons, latestLesson, lessonsLoading,
  submitAnswer, saveSession, employeeStats,
}) {
  const { completed, isLessonDone, isTestDone, markLessonComplete, markTestComplete } = useProgress(user);
  const [selectedLesson, setSelectedLesson] = useState(null);
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

  // ── 레슨 선택 화면 ─────────────────────────────────────────
  if (!selectedLesson) {
    return (
      <LessonList
        lessons={sorted}
        loading={lessonsLoading}
        user={user}
        onSelect={(lesson) => {
          setSelectedLesson(lesson);
          setReviewDone(false);
        }}
      />
    );
  }

  // ── 복습 판단 (날짜 기반) ──────────────────────────────────
  const today = toDateStr(new Date().toISOString());
  const lastCompleted = completed.length > 0 ? completed[completed.length - 1] : null;
  const lastCompletedDate = lastCompleted ? toDateStr(lastCompleted.date) : null;
  const lastCompletedLesson = lastCompleted
    ? sorted.find((l) => l.id === lastCompleted.lessonId) ?? null
    : null;

  const isReviewDay = lastCompletedDate !== null
    && lastCompletedDate !== today
    && !!lastCompletedLesson
    && lastCompletedLesson.id !== selectedLesson.id
    && !reviewDone;

  // ── Weekly test ────────────────────────────────────────────
  const currentWeek = selectedLesson.weekNumber ?? 1;
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
      lesson={selectedLesson}
      onSubmitAnswer={submitAnswer}
      onSaveSession={(data) => {
        saveSession(data);
        markLessonComplete(selectedLesson.id);
        setSelectedLesson(null); // 완료 후 목록으로 돌아가기
      }}
      stats={employeeStats}
      onBack={() => setSelectedLesson(null)}
    />
  );
}
