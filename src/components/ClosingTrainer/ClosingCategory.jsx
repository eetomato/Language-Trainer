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

// ── 스텝 네비게이션 버튼 ──────────────────────────────────────
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

export default function ClosingCategory({ category, onBack }) {
  const expressions = category.expressions || [];
  const [exprIndex, setExprIndex] = useState(0);
  const [step, setStep] = useState(1);
  const [shadowCount, setShadowCount] = useState(0);
  const [choices] = useState(() => expressions.map((e) => makeChoices(e.text)));
  const [choiceResult, setChoiceResult] = useState(null);

  const expr = expressions[exprIndex];
  const isLast = exprIndex === expressions.length - 1;

  const goNext = () => {
    if (isLast) {
      onBack();
    } else {
      setExprIndex((i) => i + 1);
      setStep(1);
      setShadowCount(0);
      setChoiceResult(null);
    }
  };

  const prevStep = (n) => () => setStep(n);

  if (!expr) return null;

  return (
    <div className="closing-category">
      {/* 헤더 */}
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
            <p>{category.description}</p>
          </div>
          <StepNav
            onPrev={onBack}
            onNext={() => setStep(2)}
            nextLabel="Start"
          />
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
          <StepNav onPrev={prevStep(1)} onNext={() => setStep(3)} />
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
          <StepNav onPrev={prevStep(2)} onNext={() => setStep(4)} />
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
          <StepNav onPrev={prevStep(3)} onNext={() => { setStep(5); setShadowCount(0); }} />
        </div>
      )}

      {/* Step 5 */}
      {step === 5 && (
        <div className="closing-step">
          <p className="closing-step-label">Step 5 — Shadowing ({shadowCount}/3)</p>
          <div className="closing-expr-card">
            <p className="closing-expr-text">{expr.text}</p>
          </div>
          <button className="tts-btn" type="button" onClick={() => {
            speak(expr.text);
            setShadowCount((c) => Math.min(c + 1, 3));
          }}>
            <Volume2 size={20} /> Say it
          </button>
          <StepNav
            onPrev={prevStep(4)}
            onNext={shadowCount >= 3 ? () => setStep(6) : null}
          />
        </div>
      )}

      {/* Step 6 */}
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
            onPrev={() => { prevStep(5)(); setChoiceResult(null); }}
            onNext={choiceResult ? () => setStep(7) : null}
            nextLabel={choiceResult === expr.text ? '✓ Great!' : 'Continue'}
          />
        </div>
      )}

      {/* Step 7 */}
      {step === 7 && (
        <div className="closing-step closing-complete">
          <p className="closing-step-label">Complete ✓</p>
          <p className="closing-expr-text">{expr.text}</p>
          <p className="closing-expr-translation">{expr.translation}</p>
          <StepNav
            onPrev={prevStep(6)}
            onNext={goNext}
            nextLabel={isLast ? 'Finish' : 'Next expression'}
          />
        </div>
      )}
    </div>
  );
}
