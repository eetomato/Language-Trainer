import { useState } from 'react';
import { ChevronLeft, Check, RotateCcw } from 'lucide-react';
import YouTubeEmbed from './YouTubeEmbed';
import ShadowingSection from './ShadowingSection';
import OutputSection from './OutputSection';
import PracticeSection from './PracticeSection';

export default function LessonPage({ user, lesson, onSubmitAnswer, onSaveSession, stats, onBack }) {
  const [step, setStep] = useState('B');
  const [lessonComplete, setLessonComplete] = useState(false);

  // ✅ 로컬 score 카운터 — stats prop 의존 제거
  const [localCorrect, setLocalCorrect] = useState(0);
  const [localTotal, setLocalTotal] = useState(0);

  const sentences = lesson.sentences || [];

  const handleSubmitAnswer = (result) => {
    setLocalTotal((t) => t + 1);
    if (result.isCorrect) setLocalCorrect((c) => c + 1);
    onSubmitAnswer?.(result);
  };

  const localScore = localTotal > 0 ? Math.round((localCorrect / localTotal) * 100) : 0;

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
            <strong>{localScore}%</strong>
            <p>{localTotal} attempts saved</p>
          </div>
          <p className="complete-msg">
            {localScore >= 80 ? 'Great work! Ready to use on the floor.' : 'Review and try again.'}
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
          <strong>{localScore}%</strong>
          <small>{localTotal} attempts</small>
        </div>
      </section>

      {/* A. Video — always visible */}
      <YouTubeEmbed url={lesson.youtubeUrl} timestamp={lesson.youtubeTimestamp} />

      {/* B. Practice */}
      {step === 'B' && (
        <PracticeSection
          lesson={lesson}
          onSubmitAnswer={handleSubmitAnswer}
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
            <p className="retry-label">Retry</p>
            <div className="retry-row">
              <button type="button" className="retry-btn" onClick={() => setStep('B')}>
                <RotateCcw size={15} /> B. Practice again
              </button>
              <button type="button" className="retry-btn" onClick={() => setStep('C')}>
                <RotateCcw size={15} /> C. Shadowing again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
