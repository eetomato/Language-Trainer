import { useState } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import YouTubeEmbed from './YouTubeEmbed';
import ShadowingSection from './ShadowingSection';
import OutputSection from './OutputSection';
import PracticeSection from './PracticeSection';

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
        </section>
      </div>
    );
  }

  return (
    <div className="lesson-page">
      <section className="lesson-hero">
        <div>
          {onBack && (
            <button className="back-btn" type="button" onClick={onBack}>
              <ChevronLeft size={16} /> レッスン一覧
            </button>
          )}
          <p className="eyebrow">{lesson.topicArea}</p>
          <h2>{lesson.lessonTitle}</h2>
          <p>{user.name} — B → C → D の順で進んでください。</p>
        </div>
        <div className="score-panel">
          <span>Current score</span>
          <strong>{stats.score}%</strong>
          <small>{stats.completed} attempts</small>
        </div>
      </section>

      {/* A. Video — always visible */}
      <YouTubeEmbed url={lesson.youtubeUrl} timestamp={lesson.youtubeTimestamp} />

      {/* B. Practice — visible until complete */}
      {!practiceDone && (
        <PracticeSection
          lesson={lesson}
          onSubmitAnswer={onSubmitAnswer}
          onAllAnswered={() => setPracticeDone(true)}
        />
      )}

      {/* C. Shadowing — appears only after B, disappears after C */}
      {practiceDone && !shadowingDone && (
        <ShadowingSection
          sentences={sentences}
          onComplete={() => setShadowingDone(true)}
        />
      )}

      {/* D. Output — appears only after C, disappears after D */}
      {shadowingDone && !outputDone && (
        <OutputSection
          sentences={sentences}
          onSubmit={() => setOutputDone(true)}
        />
      )}

      {/* Complete — appears only after D */}
      {outputDone && (
        <button type="button" className="primary-action complete-btn" onClick={handleComplete}>
          <Check size={18} /> Complete Lesson
        </button>
      )}
    </div>
  );
}
