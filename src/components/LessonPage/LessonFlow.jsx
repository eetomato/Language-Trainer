import { useMemo, useState } from 'react';
import { useProgress } from '../../hooks/useProgress';
import LessonPage from './LessonPage';
import LessonList from './LessonList';
import ReviewSection from './ReviewSection';
import WeeklyTest from './WeeklyTest';
import ClosingTrainer from '../ClosingTrainer/ClosingTrainer';

function toDateStr(isoStr) {
  return isoStr ? isoStr.slice(0, 10) : null;
}

// ── 허브 화면 ─────────────────────────────────────────────────
function LessonHub({ onSelectVideo, onSelectClosing }) {
  return (
    <div className="lesson-page">
      <div className="lesson-hero">
        <div>
          <p className="eyebrow">Lesson / レッスン</p>
          <h2>今日は何を練習しますか？</h2>
          <p>What would you like to practice today?</p>
        </div>
      </div>

      <div className="lesson-hub-grid">
        <button type="button" className="lesson-hub-card" onClick={onSelectVideo}>
          <span className="hub-icon">📹</span>
          <h3>Video Lesson</h3>
          <p>ビデオレッスン</p>
          <span className="hub-sub">英語表現を動画で学ぶ<br/>Learn expressions from video</span>
        </button>

        <button type="button" className="lesson-hub-card" onClick={onSelectClosing}>
          <span className="hub-icon">💬</span>
          <h3>Closing Trainer</h3>
          <p>接客トレーニング</p>
          <span className="hub-sub">クロージング表現を練習する<br/>Practice closing expressions</span>
        </button>
      </div>
    </div>
  );
}

export default function LessonFlow({
  user, lessons, latestLesson, lessonsLoading,
  submitAnswer, saveSession, employeeStats,
}) {
  const { completed, isLessonDone, isTestDone, markLessonComplete, markTestComplete } = useProgress(user);
  const [mode, setMode] = useState('hub'); // 'hub' | 'video' | 'closing'
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [reviewDone, setReviewDone] = useState(false);

  const sorted = useMemo(() =>
    [...lessons].sort((a, b) =>
      a.weekNumber !== b.weekNumber
        ? a.weekNumber - b.weekNumber
        : a.dayNumber - b.dayNumber
    ), [lessons]);

  if (lessonsLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: 64 }}>
        <div className="loading-spinner"
          style={{ borderColor: 'rgba(0,0,0,.12)', borderTopColor: 'var(--ink)' }} />
      </div>
    );
  }

  // ── 허브 ───────────────────────────────────────────────────
  if (mode === 'hub') {
    return (
      <LessonHub
        onSelectVideo={() => setMode('video')}
        onSelectClosing={() => setMode('closing')}
      />
    );
  }

  // ── Closing Trainer ────────────────────────────────────────
  if (mode === 'closing') {
    return (
      <div>
        <button type="button" className="back-btn"
          style={{ margin: '16px 16px 0' }}
          onClick={() => setMode('hub')}>
          ← Back / 戻る
        </button>
        <ClosingTrainer user={user} />
      </div>
    );
  }

  // ── Video Lesson ───────────────────────────────────────────
  if (!selectedLesson) {
    return (
      <LessonList
        lessons={sorted}
        loading={lessonsLoading}
        user={user}
        onBack={() => setMode('hub')}
        onSelect={(lesson) => {
          setSelectedLesson(lesson);
          setReviewDone(false);
        }}
      />
    );
  }

  // 복습 판단
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

  // Weekly test
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

  if (isReviewDay) {
    return (
      <ReviewSection
        lesson={lastCompletedLesson}
        user={user}
        onComplete={() => setReviewDone(true)}
      />
    );
  }

  return (
    <LessonPage
      user={user}
      lesson={selectedLesson}
      onSubmitAnswer={submitAnswer}
      onSaveSession={(data) => {
        saveSession(data);
        markLessonComplete(selectedLesson.id);
        setSelectedLesson(null);
        setMode('hub');
      }}
      stats={employeeStats}
      onBack={() => setSelectedLesson(null)}
    />
  );
}
