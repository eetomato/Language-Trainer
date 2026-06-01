import { useMemo, useState } from 'react';
import { Check, RotateCcw, Send } from 'lucide-react';
import { normalizeAnswer } from '../../utils/dataFormatter';

export default function PracticeSection({ lesson, onSubmitAnswer }) {
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const matchOptions = useMemo(
    () => ['relaxed fit', 'oversized', 'big', 'slim fit'],
    []
  );

  const handleInput = (questionId, value) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const checkAnswer = async (question, answer) => {
    const expected = question.blankAnswer;
    const isCorrect =
      question.questionType === 'match'
        ? answer === expected
        : normalizeAnswer(answer) === normalizeAnswer(expected);

    setFeedback((current) => ({
      ...current,
      [question.id]: {
        isCorrect,
        message: isCorrect ? 'Correct. Ready for service.' : `Review: ${expected}`,
      },
    }));

    await onSubmitAnswer({ question, userAnswer: answer, isCorrect });
  };

  const renderQuestion = (question) => {
    if (question.questionType === 'match') {
      const pairs = question.blankAnswer.split('|');
      const selected = answers[question.id] || {};
      const answer = pairs.map((pair) => {
        const [jp] = pair.split('=');
        return `${jp}=${selected[jp] || ''}`;
      }).join('|');

      return (
        <div className="matching-grid">
          {pairs.map((pair) => {
            const [jp] = pair.split('=');
            return (
              <label key={jp} className="match-row">
                <span>{jp}</span>
                <select
                  value={selected[jp] || ''}
                  onChange={(event) =>
                    handleInput(question.id, { ...selected, [jp]: event.target.value })
                  }
                >
                  <option value="">Choose</option>
                  {matchOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
          <button type="button" className="secondary-action" onClick={() => checkAnswer(question, answer)}>
            <Check size={18} />
            Check match
          </button>
        </div>
      );
    }

    return (
      <form
        className="answer-form"
        onSubmit={(event) => {
          event.preventDefault();
          checkAnswer(question, answers[question.id] || '');
        }}
      >
        <input
          type="text"
          value={answers[question.id] || ''}
          onChange={(event) => handleInput(question.id, event.target.value)}
          placeholder={question.questionType === 'roleplay' ? 'こちらのジャケットは...' : '大きめ'}
        />
        <button type="submit" className="secondary-action">
          <Send size={18} />
          Submit
        </button>
      </form>
    );
  };

  return (
    <section className="lesson-section practice-section">
      <div className="section-heading">
        <p className="eyebrow">E. Practice</p>
        <h2>Use it now</h2>
      </div>
      <div className="practice-list">
        {lesson.questions.map((question, index) => (
          <article key={question.id} className="practice-card">
            <div className="question-topline">
              <span>Type {index + 1}</span>
              <small>{question.questionType.replace('_', ' ')}</small>
            </div>
            <h3>{question.questionText}</h3>
            <p>{question.context}</p>
            {renderQuestion(question)}
            {feedback[question.id] && (
              <div className={feedback[question.id].isCorrect ? 'feedback correct' : 'feedback wrong'}>
                {feedback[question.id].message}
              </div>
            )}
          </article>
        ))}
      </div>
      <button
        type="button"
        className="text-action"
        onClick={() => {
          setAnswers({});
          setFeedback({});
        }}
      >
        <RotateCcw size={16} />
        Reset visible answers
      </button>
    </section>
  );
}
