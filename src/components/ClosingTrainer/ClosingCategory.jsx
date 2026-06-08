import { useState } from 'react';
import { Volume2, ChevronLeft, ChevronRight, RotateCcw, Check } from 'lucide-react';

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-US';
  utt.rate = 0.9;
  window.speechSynthesis.speak(utt);
}

const CHOICES_POOL = [
  'Thanks for coming in.',
  'See you around.',
  'Have a great day.',
  'That was a nice pick.',
  'You made a good call.',
  'Feel free to come back.',
];

function makeChoices(correct) {
  const wrong = CHOICES_POOL.filter((c) => c !== correct).sort(() => Math.random() - 0.5).slice(0, 2);
  return [...wrong, correct].sort(() => Math.random() - 0.5);
}

function normalize(str) {
  return str.trim().toLowerCase().replace(/[.!?,]/g, '');
}

// 。で文を分割して改行表示
function DescriptionText({ text }) {
  const lines = text.split('。').map((s) => s.trim()).filter(Boolean);
  return (
    <div className="closing-description-lines">
      {lines.map((line, i) => (
        <p key={i}>{line}。</p>
      ))}
    </div>
  );
}

function StepNav({ onPrev, onNext, nextLabel = 'Next', nextDisabled = false }) {
  return (
    <div className="step-nav">
      <button className="step-nav-prev" type="button" onClick={onPrev}>
        <ChevronLeft size={16} /> Back
      </button>
      {onNext && (
        <button className="primary-action step-nav-next" type="button"
          onClick={onNext} disabled={nextDisabled}>
          {nextLabel} <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

export default function ClosingCategory({ category, onBack, onComplete }) {
  const expressions = category.expressions || [];
  const [exprIndex, setExprIndex] = useState(0);
  const [step, setStep] = useState(1);
  const [choices] = useState(() => expressions.map((e) => makeChoices(e.text)));
  const [choiceResult, setChoiceResult] = useState(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [typeResult, setTypeResult] = useState(null); // 'correct' | 'wrong' | null

  const expr = expressions[exprIndex];
  const isLast = exprIndex === expressions.length - 1;

  const goNext = () => {
    if (isLast) {
      // 카테고리 완료 — 세션 저장 후 목록으로
      const studyMinutes = Math.max(3, expressions.length * 2);
      onComplete?.(studyMinutes);
      onBack();
    } else {
      setExprIndex((i) => i + 1);
      setStep(1);
      setChoiceResult(null);
      setTypedAnswer('');
      setTypeResult(null);
    }
  };

  const resetTypeStep = () => {
    setTypedAnswer('');
    setTypeResult(null);
  };

  if (!expr) return null;

  return (
    <div className="closing-category">
      <div className="closing-cat-header">
        <button className="back-btn" type="button" onClick={onBack}>← Back</button>
        <span className="closing-cat-title">{category.category}</span>
        <span className="closing-cat-progress">{exprIndex + 1} / {expressions.length}</span>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="closing-step">
          <p className="closing-step-label">Step 1 — Why this expression?</p>
          <div className="closing-intent-box">
            <DescriptionText text={category.description} />
          </div>
          <StepNav onPrev={onBack} onNext={() => setStep(2)} nextLabel="Start" />
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="closing-step">
          <p className="closing-step-label">Step 2 — Listen</p>
          <div className="closing-expr-card">
            <p className="closing-expr-text">{expr.text}</p>
            <button className="tts-btn" type="button" onClick={() => speak(expr.text)}>
              <Volume2 size={20} /> Listen
            </button>
          </div>
          <StepNav onPrev={() => setStep(1)} onNext={() => setStep(3)} />
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="closing-step">
          <p className="closing-step-label">Step 3 — Meaning</p>
          <div className="closing-expr-card">
            <p className="closing-expr-text">{expr.text}</p>
            <p className="closing-expr-translation">{expr.translation}</p>
          </div>
          <StepNav onPrev={() => setStep(2)} onNext={() => setStep(4)} />
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div className="closing-step">
          <p className="closing-step-label">Step 4 — In context</p>
          <div className="closing-dialogue">
            <div className="dialogue-line staff">
              <span className="dialogue-role">Staff</span>
              <div className="dialogue-content">
                <span>{expr.text}</span>
                <button className="tts-inline" type="button" onClick={() => speak(expr.text)}>
                  <Volume2 size={14} />
                </button>
                <span className="dialogue-translation">{expr.translation}</span>
              </div>
            </div>
            <div className="dialogue-line customer">
              <span className="dialogue-role">Customer</span>
              <div className="dialogue-content">
                <span>Thank you. I&apos;ll come again.</span>
                <span className="dialogue-translation">ありがとうございます。またお伺いします。</span>
              </div>
            </div>
          </div>
          <StepNav onPrev={() => setStep(3)} onNext={() => { setStep(5); resetTypeStep(); }} />
        </div>
      )}

      {/* Step 5: 빈칸 채우기 (정답만 통과) */}
      {step === 5 && (
        <div className="closing-step">
          <p className="closing-step-label">Step 5 — Type it out</p>
          <p className="closing-recall-prompt">&ldquo;{expr.translation}&rdquo;</p>
          <p className="closing-type-hint">英語で書いてみましょう</p>

          <div className="closing-type-area">
            <input
              className={`closing-type-input ${typeResult || ''}`}
              type="text"
              value={typedAnswer}
              onChange={(e) => { if (!typeResult) setTypedAnswer(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !typeResult && typedAnswer.trim()) {
                  const ok = normalize(typedAnswer) === normalize(expr.text);
                  setTypeResult(ok ? 'correct' : 'wrong');
                }
              }}
              placeholder="Type the English expression..."
              disabled={!!typeResult}
              autoFocus
            />
            {!typeResult && (
              <button className="primary-action" type="button"
                disabled={!typedAnswer.trim()}
                onClick={() => {
                  const ok = normalize(typedAnswer) === normalize(expr.text);
                  setTypeResult(ok ? 'correct' : 'wrong');
                }}>
                Check
              </button>
            )}
          </div>

          {typeResult === 'correct' && (
            <div className="type-feedback correct">
              <Check size={16} /> Correct!
            </div>
          )}
          {typeResult === 'wrong' && (
            <div className="type-feedback wrong">
              <p>Answer: <strong>{expr.text}</strong></p>
              <button className="retry-small" type="button" onClick={resetTypeStep}>
                <RotateCcw size={14} /> Try again
              </button>
            </div>
          )}

          {/* 정답일 때만 Next 활성화 */}
          <StepNav
            onPrev={() => { setStep(4); resetTypeStep(); }}
            onNext={typeResult === 'correct' ? () => { setStep(6); setChoiceResult(null); } : null}
          />
        </div>
      )}

      {/* Step 6: 객관식 */}
      {step === 6 && (
        <div className="closing-step">
          <p className="closing-step-label">Step 6 — Recall</p>
          <p className="closing-recall-prompt">&ldquo;{expr.translation}&rdquo; — 英語で？</p>
          <div className="closing-choices">
            {choices[exprIndex].map((c) => {
              let cls = 'choice-btn';
              if (choiceResult) {
                if (c === expr.text) cls += ' correct';
                else if (c === choiceResult && c !== expr.text) cls += ' wrong';
              }
              return (
                <button key={c} className={cls} type="button"
                  disabled={!!choiceResult}
                  onClick={() => setChoiceResult(c)}>
                  {c}
                </button>
              );
            })}
          </div>
          <StepNav
            onPrev={() => { setStep(5); setChoiceResult(null); resetTypeStep(); }}
            onNext={choiceResult ? () => setStep(7) : null}
            nextLabel={choiceResult === expr.text ? '✓ Great!' : 'Continue'}
          />
        </div>
      )}

      {/* Step 7: 완료 */}
      {step === 7 && (
        <div className="closing-step closing-complete">
          <p className="closing-step-label">Complete ✓</p>
          <p className="closing-expr-text">{expr.text}</p>
          <p className="closing-expr-translation">{expr.translation}</p>
          <StepNav
            onPrev={() => setStep(6)}
            onNext={goNext}
            nextLabel={isLast ? 'Finish' : 'Next expression'}
          />
        </div>
      )}
    </div>
  );
}
