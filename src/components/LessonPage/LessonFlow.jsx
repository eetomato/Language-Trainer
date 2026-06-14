import { useMemo, useState } from 'react';
import { useProgress } from '../../hooks/useProgress';
import LessonPage from './LessonPage';
import LessonList from './LessonList';
import ReviewSection from './ReviewSection';
import WeeklyTest from './WeeklyTest';
import WeeklySheets from '../WeeklySheets/WeeklySheets';
import AudioLesson from '../AudioLesson/AudioLesson';
import { supabase } from '../../utils/supabaseClient';

function toDateStr(isoStr) {
  return isoStr ? isoStr.slice(0, 10) : null;
}

// ── 허브 화면 ─────────────────────────────────────────────────
function LessonHub({ onSelectSheets, onSelectTest, onSelectAudio }) {
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
        <button type="button" className="lesson-hub-card" onClick={onSelectSheets}>
          <span className="hub-icon">💬</span>
          <h3>Customer English</h3>
          <p>お客様との英会話</p>
          <span className="hub-sub">接客で使える英語表現を練習する<br/>Practice English with customers</span>
        </button>

        <button type="button" className="lesson-hub-card" onClick={onSelectAudio}>
          <span className="hub-icon">🎧</span>
          <h3>Audio Lesson</h3>
          <p>オーディオレッスン</p>
          <span className="hub-sub">音声で英語を学ぶ<br/>Learn English by listening</span>
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
  const { completed, markLessonComplete, markTestComplete } = useProgress(user);
  const [mode, setMode] = useState('hub'); // 'hub' | 'sheets' | 'audio' | 'test' | 'video'
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [reviewDone, setReviewDone] = useState(false);
  const [testQuestions, setTestQuestions] = useState(null); // null = 로딩 전
  const [testWeek, setTestWeek] = useState(null);

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
        onSelectSheets={() => setMode('sheets')}
        onSelectAudio={() => setMode('audio')}
        onSelectTest={async () => {
          setTestQuestions(null);
          setMode('test');
          if (!supabase) { setTestQuestions([]); return; }
          const { data, error } = await supabase
            .from('weekly_sheets')
            .select('week_start_date, test_questions')
            .eq('is_hidden', false)
            .order('week_start_date', { ascending: false })
            .limit(1)
            .single();
          if (!error && data) {
            setTestQuestions(data.test_questions || []);
            setTestWeek(data.week_start_date);
          } else {
            setTestQuestions([]);
          }
        }}
      />
    );
  }

  // ── Customer English (WeeklySheets) ───────────────────────
  if (mode === 'sheets') {
    return (
      <WeeklySheets
        user={user}
        saveSession={saveSession}
        onBack={() => setMode('hub')}
      />
    );
  }

  // ── Audio Lesson ───────────────────────────────────────────
  if (mode === 'audio') {
    return <AudioLesson onBack={() => setMode('hub')} />;
  }

  // ── Weekly Test ────────────────────────────────────────────
  if (mode === 'test') {
    return (
      <WeeklyTest
        user={user}
        weekDate={testWeek}
        testQuestions={testQuestions}
        onComplete={() => {
          markTestComplete(testWeek);
          setMode('hub');
        }}
        onBack={() => setMode('hub')}
      />
    );
  }

  // ── Video Lesson (레거시) ───────────────────────────────────
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

  if (!selectedLesson) {
    if (sorted.length === 1) {
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
