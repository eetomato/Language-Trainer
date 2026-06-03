import { useState } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import YouTubeEmbed from './YouTubeEmbed';
import VocabularyBlock from './VocabularyBlock';
import ExampleSentences from './ExampleSentences';
import PracticeSection from './PracticeSection';
import ShadowingSection from './ShadowingSection';
import OutputSection from './OutputSection';

export default function LessonPage({ user, lesson, onSubmitAnswer, onSaveSession, stats, onBack }) {
  // Track completion of each section
  const [practicesDone, setPracticesDone] = useState(false);
  const [shadowingDone, setShadowingDone] = useState(false);
  const [outputDone, setOutputDone] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);

  const canComplete = practicesDone && shadowingDone && outputDone;

  const handleComplete = () => {
    setLessonComplete(true);
    // Calculate session time roughly (shadowing + output adds time)
    onSaveSession?.({ lessonId: lesson.id, studyMinutes: Math.max(5, lesson.questions.length * 3) });
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
            {stats.score >= 80
              ? '素晴らしい！接客でもすぐ使えます。'
              : '復習してもう一度試してみてください。'}
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
          <p>{user.name}, follow the steps A → D to complete this lesson.</p>
        </div>
        <div className="score-panel">
          <span>Current score</span>
          <strong>{stats.score}%</strong>
          <small>{stats.completed} attempts saved</small>
        </div>
      </section>

      {/* A. Video */}
      <YouTubeEmbed url={lesson.youtubeUrl} timestamp={lesson.youtubeTimestamp} />

      {/* B. Practice (Type A / B) */}
      <PracticeSection
        lesson={lesson}
        onSubmitAnswer={onSubmitAnswer}
        onAllAnswered={() => setPracticesDone(true)}
      />

      {/* C. Shadowing */}
      <ShadowingSection
        sentences={lesson.exampleSentences}
        onComplete={() => setShadowingDone(true)}
      />

      {/* D. Output */}
      <OutputSection
        sentences={lesson.exampleSentences}
        onSubmit={() => setOutputDone(true)}
      />

      {/* Complete Lesson */}
      {canComplete && (
        <button type="button" className="primary-action complete-btn" onClick={handleComplete}>
          <Check size={18} /> Complete Lesson
        </button>
      )}
    </div>
  );
}
