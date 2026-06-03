import { useState } from 'react';
import { ChevronLeft, Check, Lock } from 'lucide-react';
import YouTubeEmbed from './YouTubeEmbed';
import ShadowingSection from './ShadowingSection';
import OutputSection from './OutputSection';
import PracticeSection from './PracticeSection';

function LockedSection({ label }) {
  return (
    <div className="locked-section">
      <Lock size={16} />
      <span>{label}</span>
    </div>
  );
}

export default function LessonPage({ user, lesson, onSubmitAnswer, onSaveSession, stats, onBack }) {
  const [practiceDone, setPracticeDone] = useState(false);
  const [shadowingDone, setShadowingDone] = useState(false);
  const [outputDone, setOutputDone] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);

  const sentences = lesson.sentences || [];

  const handleComplete = () => {
    setLessonComplete(true);
    onSaveSession?.({ lessonId: lesson.id, studyMinutes: Math.max(5, sentences.length * 4) });
  };

  if (lessonComplete) {
    return (
      <div className="lesson-page">
        <section className="lesson-section complete-section">
          <p className="eyebrow">Lesson Complete</p>
          <div className="complete-score">
            <strong>{stats.score}%</strong>
            <p>{stats.completed} attempts saved</p>
          </div>
          <p className="complete-msg">
            {stats.score >= 80 ? '素晴らしい！接客でもすぐ使えます。' : '復習してもう一度試してみてください。'}
          </p>
          <button type="button" className="primary-action compact" style={{ marginTop: 24 }} onClick={onBack}>
            ← レッスン一覧へ
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="lesson-page">
      {/* Header */}
      <section className="lesson-hero">
        <div>
          {onBack && (
            <button className="back-btn" type="button" onClick={onBack}>
              <ChevronLeft size={16} /> レッスン一覧
            </button>
          )}
          <p className="eyebrow">{lesson.topicArea}</p>
          <h2>{lesson.lessonTitle}</h2>
          <p>{user.name} — A → B → C → D の順で進んでください。</p>
        </div>
        <div className="score-panel">
          <span>Current score</span>
          <strong>{stats.score}%</strong>
          <small>{stats.completed} attempts</small>
        </div>
      </section>

      {/* A. Video — always visible */}
      <YouTubeEmbed url={lesson.youtubeUrl} timestamp={lesson.youtubeTimestamp} />

      {/* B. Practice — always visible, unlocks C */}
      <PracticeSection
        lesson={lesson}
        onSubmitAnswer={onSubmitAnswer}
        onAllAnswered={() => setPracticeDone(true)}
      />

      {/* C. Shadowing — unlocked after B */}
      {practiceDone
        ? <ShadowingSection sentences={sentences} onComplete={() => setShadowingDone(true)} />
        : <LockedSection label="C. Shadowing — Complete Practice first" />
      }

      {/* D. Output — unlocked after C */}
      {shadowingDone
        ? <OutputSection sentences={sentences} onSubmit={() => setOutputDone(true)} />
        : <LockedSection label="D. Output — Complete Shadowing first" />
      }

      {/* Complete Lesson — unlocked after D */}
      {outputDone && (
        <button type="button" className="primary-action complete-btn" onClick={handleComplete}>
          <Check size={18} /> Complete Lesson
        </button>
      )}
    </div>
  );
}
