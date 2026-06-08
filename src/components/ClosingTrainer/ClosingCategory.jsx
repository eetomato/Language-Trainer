import { useState } from 'react';
import { Volume2, ChevronRight, RotateCcw, Check } from 'lucide-react';

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

export default function ClosingCategory({ category, onBack }) {
  const expressions = category.expressions || [];
  const [exprIndex, setExprIndex] = useState(0);
  const [step, setStep] = useState(1);
  const [shadowCount, setShadowCount] = useState(0);
  const [choices] = useState(() => expressions.map((e) => makeChoices(e.text)));
  const [choiceResult, setChoiceResult] = useState(null);

  const expr = expressions[exprIndex];
  const isLast = exprIndex === expressions.length - 1;

  const next = () => {
    if (isLast) {
      onBack();
    } else {
      setExprIndex((i) => i + 1);
      setStep(1);
      setShadowCount(0);
      setChoiceResult(null);
    }
  };

  if (!expr) return null;

  return (
    <div className="closing-category">
      {/* 헤더 */}
      <div className="closing-cat-header">
        <button className="back-btn" type="button" onClick={onBack}>← Back</button>
        <span className="closing-cat-title">{category.category}</span>
        <span className="closing-cat-progress">{exprIndex + 1} / {expressions.length}</span>
      </div>

      {/* Step 1: 목적 설명 */}
      {step === 1 && (
        <div className="closing-step">
          <p className="closing-step-label">Step 1 — Why this expression?</p>
          <div className="closing-intent-box">
            <p>{category.description}</p>
          </div>
          <button className="primary-action" type="button" onClick={() => setStep(2)}>
            Start <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Step 2: 표현 보기 + TTS */}
      {step === 2 && (
        <div className="closing-step">
          <p className="closing-step-label">Step 2 — Listen</p>
          <div className="closing-expr-card">
            <p className="closing-expr-text">{expr.text}</p>
            <button className="tts-btn" type="button" onClick={() => speak(expr.text)}>
              <Volume2 size={20} /> Listen
            </button>
          </div>
          <button className="primary-action" type="button" onClick={() => setStep(3)}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Step 3: 번역 */}
      {step === 3 && (
        <div className="closing-step">
          <p className="closing-step-label">Step 3 — Meaning</p>
          <div className="closing-expr-card">
            <p className="closing-expr-text">{expr.text}</p>
            <p className="closing-expr-translation">{expr.translation}</p>
          </div>
          <button className="primary-action" type="button" onClick={() => setStep(4)}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Step 4: 대화 예시 */}
      {step === 4 && (
        <div className="closing-step">
          <p className="closing-step-label">Step 4 — In context</p>
          <div className="closing-dialogue">
            <div className="dialogue-line staff">
              <span className="dialogue-role">Staff</span>
              <span>{expr.text}</span>
              <button className="tts-inline" type="button" onClick={() => speak(expr.text)}>
                <Volume2 size={14} />
              </button>
            </div>
            <div className="dialogue-line customer">
              <span className="dialogue-role">Customer</span>
              <span>ありがとう。また来ます。</span>
            </div>
          </div>
          <button className="primary-action" type="button" onClick={() => { setStep(5); setShadowCount(0); }}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Step 5: 쉐도잉 3회 */}
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
          {shadowCount >= 3 && (
            <button className="primary-action" type="button" onClick={() => setStep(6)}>
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}

      {/* Step 6: 객관식 */}
      {step === 6 && (
        <div className="closing-step">
          <p className="closing-step-label">Step 6 — Recall</p>
          <p className="closing-recall-prompt">"{expr.translation}" — 英語で？</p>
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
          {choiceResult && (
            <button className="primary-action" type="button" onClick={() => setStep(7)}>
              {choiceResult === expr.text ? <><Check size={16} /> Great!</> : <><RotateCcw size={16} /> Continue</>}
            </button>
          )}
        </div>
      )}

      {/* Step 7: 완료 */}
      {step === 7 && (
        <div className="closing-step closing-complete">
          <p className="closing-step-label">Complete ✓</p>
          <p className="closing-expr-text">{expr.text}</p>
          <p className="closing-expr-translation">{expr.translation}</p>
          <button className="primary-action" type="button" onClick={next}>
            {isLast ? 'Finish' : 'Next expression'} <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
