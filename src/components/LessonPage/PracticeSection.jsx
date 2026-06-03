import { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { normalizeAnswer } from '../../utils/dataFormatter';

// Render question text with clickable word hints
function QuestionText({ text, wordHints = {} }) {
  const [popup, setPopup] = useState(null);
  if (!Object.keys(wordHints).length) return <h3>{text}</h3>;

  const words = text.split(/(\s+)/);
  return (
    <h3 className="question-text-hints">
      {words.map((word, i) => {
        const clean = word.replace(/[.,!?。、]/g, '').toLowerCase();
        const hint = wordHints[clean] || wordHints[word];
        if (hint) {
          return (
            <span key={i} className="hint-word" onClick={() => setPopup(popup === i ? null : i)}>
              {word}
              {popup === i && (
                <span className="hint-popup" onClick={(e) => e.stopPropagation()}>
                  {hint}
                </span>
              )}
            </span>
          );
        }
        return <span key={i}>{word}</span>;
      })}
    </h3>
  );
}

export default function PracticeSection({ lesson, onSubmitAnswer, onAllAnswered }) {
  const startTime = useRef(Date.now());
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});

  const questions = lesson.questions || [];
  const allAnswered = questions.length > 0 && questions.every((q) => feedback[q.id] !== undefined);

  // Notify parent when all answered
  const prevAllAnswered = useRef(false);
  if (allAnswered && !prevAllAnswered.current) {
    prevAllAnswered.current = true;
    onAllAnswered?.();
  }

  const checkAnswer = async (question, answer) => {
    if (feedback[question.id] !== undefined) return;

    let isCorrect = false;
    if (question.questionType === 'multiple_choice') {
      const options = question.multipleChoice || [];
      const chosen = options.find((o) => o.text === answer);
      isCorrect = chosen?.correct === true;
    } else {
      isCorrect = normalizeAnswer(answer) === normalizeAnswer(question.blankAnswer);
    }

    setFeedback((p) => ({ ...p, [question.id]: { isCorrect, correctAnswer: question.blankAnswer } }));
    await onSubmitAnswer({ question, userAnswer: answer, isCorrect });
  };

  // Type A: fill blank
  const renderFillBlank = (question) => {
    const done = feedback[question.id] !== undefined;
    return (
      <form
        className="answer-form"
        onSubmit={(e) => { e.preventDefault(); checkAnswer(question, answers[question.id] || ''); }}
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

  // Type B: multiple choice
  const renderMultipleChoice = (question) => {
    const done = feedback[question.id] !== undefined;
    const options = question.multipleChoice || [];
    return (
      <div className="mc-grid">
        {options.map((option, i) => {
          let cls = 'mc-btn';
          if (done) {
            if (option.correct) cls += ' mc-correct';
            else if (answers[question.id] === option.text) cls += ' mc-wrong';
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

  return (
    <section className="lesson-section practice-section">
      <div className="section-heading">
        <p className="eyebrow">B. Practice</p>
        <h2>Use it now</h2>
      </div>

      <div className="practice-list">
        {questions.map((question, index) => (
          <article key={question.id} className="practice-card">
            <div className="question-topline">
              <span>Q{index + 1}</span>
              <small>{question.questionType === 'multiple_choice' ? 'Type B — 選択' : 'Type A — 入力'}</small>
            </div>

            <QuestionText text={question.questionText} wordHints={question.wordHints} />

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
    </section>
  );
}
