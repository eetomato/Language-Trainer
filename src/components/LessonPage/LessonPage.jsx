import { useState } from 'react';
import { ChevronLeft, Check, RotateCcw } from 'lucide-react';
import YouTubeEmbed from './YouTubeEmbed';
import ShadowingSection from './ShadowingSection';
import OutputSection from './OutputSection';
import PracticeSection from './PracticeSection';

// step: 'B' | 'C' | 'D' | 'done'
export default function LessonPage({ user, lesson, onSubmitAnswer, onSaveSession, stats, onBack }) {
  const [step, setStep] = useState('B');
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

      {/* B. Practice */}
      {step === 'B' && (
        <PracticeSection
          lesson={lesson}
          onSubmitAnswer={onSubmitAnswer}
          onAllAnswered={() => setStep('C')}
        />
      )}

      {/* C. Shadowing */}
      {step === 'C' && (
        <ShadowingSection
          sentences={sentences}
          onComplete={() => setStep('D')}
        />
      )}

      {/* D. Output */}
      {step === 'D' && (
        <OutputSection
          sentences={sentences}
          onSubmit={() => setStep('done')}
        />
      )}

      {/* Complete */}
      {step === 'done' && (
        <div className="done-actions">
          <button type="button" className="primary-action complete-btn" onClick={handleComplete}>
            <Check size={18} /> Complete Lesson
          </button>
          <div className="retry-buttons">
            <p className="retry-label">다시 학습하기</p>
            <div className="retry-row">
              <button type="button" className="retry-btn" onClick={() => setStep('B')}>
                <RotateCcw size={15} /> B. Practice 다시
              </button>
              <button type="button" className="retry-btn" onClick={() => setStep('C')}>
                <RotateCcw size={15} /> C. Shadowing 다시
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
