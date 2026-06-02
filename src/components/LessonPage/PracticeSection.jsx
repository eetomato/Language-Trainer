import { useRef, useState } from 'react';
import { Check, Send } from 'lucide-react';
import { normalizeAnswer } from '../../utils/dataFormatter';

export default function PracticeSection({ lesson, onSubmitAnswer, onSaveSession }) {
  const startTime = useRef(Date.now());
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [completed, setCompleted] = useState(false);

  const questions = lesson.questions || [];
  const allAnswered = questions.length > 0 && questions.every((q) => feedback[q.id] !== undefined);

  // ── Check and save one answer ──────────────────────────────────
  const checkAnswer = async (question, answer) => {
    if (feedback[question.id] !== undefined) return; // already answered

    let isCorrect = false;
    if (question.questionType === 'multiple_choice') {
      // Check against option's correct flag OR blank_answer
      const options = question.multipleChoice || [];
      const chosen = options.find((o) => o.text === answer);
      isCorrect = chosen?.correct === true;
    } else {
      // fill_blank / roleplay
      isCorrect = normalizeAnswer(answer) === normalizeAnswer(question.blankAnswer);
    }

    setFeedback((prev) => ({
      ...prev,
      [question.id]: { isCorrect, correctAnswer: question.blankAnswer },
    }));

    await onSubmitAnswer({ question, userAnswer: answer, isCorrect });
  };

  // ── Complete lesson ────────────────────────────────────────────
  const handleComplete = () => {
    const studyMinutes = Math.max(1, Math.round((Date.now() - startTime.current) / 60000));
    setCompleted(true);
    if (onSaveSession) onSaveSession({ lessonId: lesson.id, studyMinutes });
  };

  // ── Type A: fill-in-blank ──────────────────────────────────────
  const renderFillBlank = (question) => {
    const done = feedback[question.id] !== undefined;
    return (
      <form
        className="answer-form"
        onSubmit={(e) => {
          e.preventDefault();
          checkAnswer(question, answers[question.id] || '');
        }}
      >
        <input
          type="text"
          value={answers[question.id] || ''}
          onChange={(e) => setAnswers((p) => ({ ...p, [question.id]: e.target.value }))}
          placeholder={question.context || 'Type your answer...'}
          disabled={done}
        />
        {!done && (
          <button type="submit" className="secondary-action">
            <Send size={16} /> Submit
          </button>
        )}
      </form>
    );
  };

  // ── Type B: multiple choice ────────────────────────────────────
  const renderMultipleChoice = (question) => {
    const done = feedback[question.id] !== undefined;
    const options = question.multipleChoice || [];

    return (
      <div className="mc-grid">
        {options.map((option, i) => {
          let cls = 'mc-btn';
          if (done) {
            if (option.correct) cls += ' mc-correct';
            else if (answers[question.id] === option.text && !option.correct) cls += ' mc-wrong';
          }
          return (
            <button
              key={i}
              type="button"
              className={cls}
              disabled={done}
              onClick={() => {
                setAnswers((p) => ({ ...p, [question.id]: option.text }));
                checkAnswer(question, option.text);
              }}
            >
              {option.text}
            </button>
          );
        })}
      </div>
    );
  };

  // ── Completed screen ───────────────────────────────────────────
  if (completed) {
    const correct = Object.values(feedback).filter((f) => f.isCorrect).length;
    const total = questions.length;
    const pct = total ? Math.round((correct / total) * 100) : 0;
    return (
      <section className="lesson-section complete-section">
        <p className="eyebrow">Lesson Complete</p>
        <div className="complete-score">
          <strong>{pct}%</strong>
          <p>{correct} / {total} correct</p>
        </div>
        <p className="complete-msg">
          {pct >= 80 ? '素晴らしい！接客でもすぐ使えます。' : '復習してもう一度試してみてください。'}
        </p>
      </section>
    );
  }

  return (
    <section className="lesson-section practice-section">
      <div className="section-heading">
        <p className="eyebrow">E. Practice</p>
        <h2>Use it now</h2>
      </div>

      <div className="practice-list">
        {questions.map((question, index) => (
          <article key={question.id} className="practice-card">
            <div className="question-topline">
              <span>Q{index + 1}</span>
              <small>
                {question.questionType === 'multiple_choice' ? 'Type B — 選択' : 'Type A — 入力'}
              </small>
            </div>
            <h3>{question.questionText}</h3>

            {question.questionType === 'multiple_choice'
              ? renderMultipleChoice(question)
              : renderFillBlank(question)}

            {feedback[question.id] !== undefined && (
              <div className={`feedback ${feedback[question.id].isCorrect ? 'correct' : 'wrong'}`}>
                {feedback[question.id].isCorrect
                  ? '✓ Correct. Ready for service.'
                  : `✗ Answer: ${feedback[question.id].correctAnswer}`}
              </div>
            )}
          </article>
        ))}
      </div>

      {allAnswered && (
        <button type="button" className="primary-action complete-btn" onClick={handleComplete}>
          <Check size={18} /> Complete Lesson
        </button>
      )}
    </section>
  );
}
