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
function LessonHub({ onSelectVideo, onSelectClosing, onSelectTest }) {
  return (
    <div className="lesson-page">
      <div className="lesson-hero">
        <div>
          <p className="eyebrow">Lesson / レッスン</p>
          <h2>今日は何を練習しますか？</h2>
          <p>What would you like to practice today?</p>
        </div>
      </div>

      <div className="lesson-hub-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
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

        <button type="button" className="lesson-hub-card" onClick={onSelectTest}>
          <span className="hub-icon">📝</span>
          <h3>Weekly Test</h3>
          <p>週次テスト</p>
          <span className="hub-sub">今週の表現をテストする<br/>Test this week's expressions</span>
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
  const [mode, setMode] = useState('hub'); // 'hub' | 'video' | 'closing' | 'test'
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

  // ── 복습 판단 (Video 모드 진입 시 공통 체크) ──────────────
  const today = toDateStr(new Date().toISOString());
  const lastCompleted = completed.length > 0 ? completed[completed.length - 1] : null;
  const lastCompletedDate = lastCompleted ? toDateStr(lastCompleted.date) : null;
  const lastCompletedLesson = lastCompleted
    ? sorted.find((l) => l.id === lastCompleted.lessonId) ?? null
    : null;

  const isReviewPending = lastCompletedDate !== null
    && lastCompletedDate !== today
    && !!lastCompletedLesson
    && !reviewDone;

  // ── 허브 ───────────────────────────────────────────────────
  if (mode === 'hub') {
    return (
      <LessonHub
        onSelectVideo={() => setMode('video')}
        onSelectClosing={() => setMode('closing')}
        onSelectTest={() => setMode('test')}
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
        <ClosingTrainer user={user} saveSession={saveSession} />
      </div>
    );
  }

  // ── Weekly Test ────────────────────────────────────────────
  if (mode === 'test') {
    const currentWeek = sorted.filter((l) => l.dayNumber !== 7).at(-1)?.weekNumber ?? 1;
    const weekDays = sorted.filter((l) => l.weekNumber === currentWeek && l.dayNumber < 7);
    const weekSentences = weekDays.flatMap((l) => l.sentences || []);

    return (
      <WeeklyTest
        user={user}
        weekNumber={currentWeek}
        sentences={weekSentences}
        onComplete={() => {
          markTestComplete(currentWeek);
          setMode('hub');
        }}
        onBack={() => setMode('hub')}
      />
    );
  }

  // ── Video Lesson ───────────────────────────────────────────

  // 복습이 남아 있으면 먼저 표시
  if (isReviewPending && !selectedLesson) {
    return (
      <ReviewSection
        lesson={lastCompletedLesson}
        user={user}
        onComplete={() => setReviewDone(true)}
        onBack={() => setMode('hub')}
      />
    );
  }

  // 레슨이 1개면 목록 없이 바로 자동 선택
  if (!selectedLesson) {
    if (sorted.length === 1) {
      // 다음 렌더에서 바로 LessonPage로 진입
      return (
        <LessonPage
          user={user}
          lesson={sorted[0]}
          onSubmitAnswer={submitAnswer}
          onSaveSession={(data) => {
            saveSession(data);
            markLessonComplete(sorted[0].id);
            setMode('hub');
          }}
          stats={employeeStats}
          onBack={() => setMode('hub')}
        />
      );
    }

    return (
      <LessonList
        lessons={sorted}
        loading={lessonsLoading}
        user={user}
        onBack={() => setMode('hub')}
        onSelect={(lesson) => setSelectedLesson(lesson)}
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
