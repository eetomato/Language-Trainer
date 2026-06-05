import { useState, useEffect } from 'react';
import { ChevronLeft, Check, RotateCcw } from 'lucide-react';
import YouTubeEmbed from './YouTubeEmbed';
import ShadowingSection from './ShadowingSection';
import OutputSection from './OutputSection';
import PracticeSection from './PracticeSection';

const PROGRESS_KEY = 'nh_lesson_progress';

function loadProgress(lessonId) {
  try {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (!saved) return null;
    const data = JSON.parse(saved);
    return data.lessonId === lessonId ? data : null;
  } catch { return null; }
}

function saveProgress(lessonId, step) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ lessonId, step }));
}

function clearProgress() {
  localStorage.removeItem(PROGRESS_KEY);
}

export default function LessonPage({ user, lesson, onSubmitAnswer, onSaveSession, stats, onBack }) {
  const saved = loadProgress(lesson.id);
  const [step, setStep] = useState(saved?.step || 'B');
  const [lessonComplete, setLessonComplete] = useState(false);
  const [localCorrect, setLocalCorrect] = useState(0);
  const [localTotal, setLocalTotal] = useState(0);

  const sentences = lesson.sentences || [];

  // ✅ step 바뀔 때마다 저장
  useEffect(() => {
    if (!lessonComplete) saveProgress(lesson.id, step);
  }, [step, lesson.id, lessonComplete]);

  const handleSubmitAnswer = (result) => {
    setLocalTotal((t) => t + 1);
    if (result.isCorrect) setLocalCorrect((c) => c + 1);
    onSubmitAnswer?.(result);
  };

  const localScore = localTotal > 0 ? Math.round((localCorrect / localTotal) * 100) : 0;

  const handleComplete = () => {
    clearProgress(); // ✅ 완료 시 진행 상태 삭제
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

      <YouTubeEmbed url={lesson.youtubeUrl} timestamp={lesson.youtubeTimestamp} />

      {step === 'B' && (
        <PracticeSection lesson={lesson} onSubmitAnswer={handleSubmitAnswer}
          onAllAnswered={() => setStep('C')} />
      )}
      {step === 'C' && (
        <ShadowingSection sentences={sentences} onComplete={() => setStep('D')} />
      )}
      {step === 'D' && (
        <OutputSection sentences={sentences} onSubmit={() => setStep('done')} />
      )}
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
