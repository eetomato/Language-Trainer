import { useState } from 'react';
import { Check } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

function normalize(s) {
  return String(s || '').trim().toLowerCase().replace(/[.,!?。、'']/g, '');
}

function weekLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}〜`;
}

// 빈칸 문장: "I ___ the shirt" → 인라인 입력창
function BlankSentence({ sentence, value, onChange, disabled }) {
  const parts = (sentence || '').split('___');
  if (parts.length < 2) {
    return (
      <input
        type="text"
        className="blank-input"
        style={{ width: '100%', boxSizing: 'border-box' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="英語で入力..."
        disabled={disabled}
      />
    );
  }
  return (
    <span className="blank-sentence-inline">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <input
              type="text"
              className="blank-input inline-blank"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="___"
              disabled={disabled}
              style={{ width: Math.max(80, (value?.length || 4) * 11) }}
            />
          )}
        </span>
      ))}
    </span>
  );
}

// ── 단계별 테스트 (Test 1 / Test 2 공용) ─────────────────────
function TestStage({ questions, stageLabel, stageTitle, nextLabel = '次へ', onComplete }) {
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);

  const allFilled = questions.every((_, i) => (answers[i] || '').trim());

  const handleSubmit = () => {
    const res = questions.map((q, i) => {
      const isCorrect = normalize(answers[i]) === normalize(q.answer);
      return { ...q, userAnswer: answers[i] || '', isCorrect };
    });
    setResults(res);
  };

  // 결과 화면
  if (results) {
    const correct = results.filter((r) => r.isCorrect).length;
    return (
      <div className="lesson-page">
        <section className="lesson-hero">
          <div>
            <p className="eyebrow">{stageLabel} — 結果</p>
            <h2>{correct} / {results.length} 正解</h2>
          </div>
        </section>
        <section className="lesson-section">
          <div className="sentence-cards">
            {results.map((r, i) => (
              <div key={i} className={`sentence-card ${r.isCorrect ? 'result-correct' : 'result-wrong'}`}>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>Q{i + 1}</p>
                {r.hint && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 6 }}>{r.hint}</p>
                )}
                <p style={{ fontWeight: 600, marginBottom: 8 }}>{r.sentence || r.question}</p>
                {r.isCorrect
                  ? <p style={{ color: 'var(--success)', fontSize: '0.9rem' }}>✓ {r.userAnswer}</p>
                  : <>
                      <p style={{ color: 'var(--warning)', fontSize: '0.9rem' }}>✗ {r.userAnswer || '(blank)'}</p>
                      <p style={{ color: 'var(--success)', fontSize: '0.85rem', marginTop: 2 }}>→ {r.answer}</p>
                    </>
                }
              </div>
            ))}
          </div>
          <button
            type="button"
            className="primary-action complete-btn"
            style={{ marginTop: 24 }}
            onClick={() => onComplete(results)}
          >
            {nextLabel} <Check size={16} />
          </button>
        </section>
      </div>
    );
  }

  // 문제 화면
  return (
    <div className="lesson-page">
      <section className="lesson-hero">
        <div>
          <p className="eyebrow">{stageLabel}</p>
          <h2>{stageTitle}</h2>
        </div>
        <div className="review-badge test-badge"><span>TEST</span></div>
      </section>
      <section className="lesson-section">
        <div className="sentence-cards">
          {questions.map((q, i) => (
            <div key={i} className="sentence-card">
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>Q{i + 1}</p>
              {q.hint && (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 8 }}>{q.hint}</p>
              )}
              <div style={{ marginBottom: 4 }}>
                <BlankSentence
                  sentence={q.sentence || q.question || ''}
                  value={answers[i] || ''}
                  onChange={(v) => setAnswers((p) => ({ ...p, [i]: v }))}
                  disabled={false}
                />
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="primary-action complete-btn"
          style={{ marginTop: 24 }}
          onClick={handleSubmit}
          disabled={!allFilled}
        >
          <Check size={18} /> 採点する
        </button>
      </section>
    </div>
  );
}

// ── 최종 결과 ─────────────────────────────────────────────────
function FinalResult({ test1Results, test2Results, weekDate, user, startedAt, saveSession, onBack, onComplete }) {
  const allResults = [...test1Results, ...(test2Results || [])];
  const correct = allResults.filter((r) => r.isCorrect).length;
  const total = allResults.length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const t1c = test1Results.filter((r) => r.isCorrect).length;
  const t2c = (test2Results || []).filter((r) => r.isCorrect).length;

  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'ok:...' | '저장エラー:...'

  const handleComplete = async () => {
    const elapsedMinutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));

    const stored = JSON.parse(localStorage.getItem('nh_test_results') || '[]');
    stored.push({
      week: weekDate,
      score: pct,
      employeeName: user?.name || '',
      wrong: allResults
        .filter((r) => !r.isCorrect)
        .map((r) => ({ question: r.sentence || r.question, answer: r.answer })),
      date: new Date().toISOString(),
      shown: false,
    });
    localStorage.setItem('nh_test_results', JSON.stringify(stored));

    setSaveStatus('saving');

    let errorMsg = null;
    let debugInfo = '';
    try {
      if (supabase && user) {
        debugInfo = `user="${user.name}"`;
        console.log('[WeeklyTest] 저장 시작 — user.name:', user.name);

        const { data: emp, error: empErr } = await supabase
          .from('employees')
          .select('id, name')
          .eq('name', user.name)
          .maybeSingle();

        console.log('[WeeklyTest] employee lookup →', { emp, empErr });
        debugInfo += ` emp=${emp?.id?.slice(0, 8) ?? 'null'} empErr=${empErr?.message ?? 'none'}`;

        if (empErr) {
          throw new Error(`employee lookup エラー (name="${user.name}"): ${empErr.message}`);
        }
        if (!emp?.id) {
          throw new Error(`employee 見つからない (name="${user.name}")`);
        }

        const insertPayload = {
          employee_id: emp.id,
          user_answer: `test1:${t1c}/${test1Results.length}, test2:${t2c}/${(test2Results || []).length}`,
          is_correct: pct >= 80,
          time_spent_seconds: elapsedMinutes * 60,
          attempted_date: new Date().toISOString().slice(0, 10),
        };
        console.log('[WeeklyTest] results INSERT payload:', insertPayload);

        const [rRes, sRes] = await Promise.all([
          supabase.from('results').insert(insertPayload),
          supabase.from('sessions').insert({
            employee_id: emp.id,
            lesson_id: null,
            study_minutes: elapsedMinutes,
          }),
        ]);

        console.log('[WeeklyTest] results INSERT →', { data: rRes.data, error: rRes.error });
        console.log('[WeeklyTest] sessions INSERT →', { data: sRes.data, error: sRes.error });
        debugInfo += ` rErr=${rRes.error?.message ?? 'ok'} sErr=${sRes.error?.message ?? 'ok'}`;

        if (rRes.error) throw new Error(`results INSERT: ${rRes.error.message}`);
        if (sRes.error) throw new Error(`sessions INSERT: ${sRes.error.message}`);
      } else {
        debugInfo = `supabase=${!!supabase} user=${!!user}`;
      }
    } catch (e) {
      console.error('[WeeklyTest] Supabase 저장 실패:', e.message, e);
      errorMsg = e.message;
    } finally {
      saveSession?.({ lessonId: `weekly-test-${weekDate}`, studyMinutes: elapsedMinutes });
      if (errorMsg) {
        setSaveStatus(`저장エラー: ${errorMsg}`);
      } else {
        setSaveStatus(`ok:${debugInfo}`);
        onComplete?.();
      }
    }
  };

  return (
    <div className="lesson-page">
      <section className="lesson-hero">
        <div>
          <button type="button" className="back-btn" onClick={onBack}>← Back / 戻る</button>
          <p className="eyebrow">Weekly Test — Complete</p>
          <h2>テスト完了！</h2>
        </div>
      </section>
      <section className="lesson-section complete-section">
        <div className="complete-score">
          <strong>{pct}%</strong>
          <p>{correct} / {total} 正解</p>
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 16 }}>
          <div style={{ textAlign: 'center', padding: '12px 20px', background: 'var(--paper)', borderRadius: 12 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Test 1</p>
            <p style={{ fontWeight: 700 }}>{t1c} / {test1Results.length}</p>
          </div>
          {test2Results?.length > 0 && (
            <div style={{ textAlign: 'center', padding: '12px 20px', background: 'var(--paper)', borderRadius: 12 }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Test 2</p>
              <p style={{ fontWeight: 700 }}>{t2c} / {test2Results.length}</p>
            </div>
          )}
        </div>
        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--muted)', fontSize: '0.9rem' }}>
          {pct >= 80 ? '🎉 よくできました！Great work!' : '📚 復習して次回また挑戦！'}
        </p>

        {saveStatus && !saveStatus.startsWith('ok') && (
          <div style={{
            margin: '16px 0 0',
            padding: '12px 16px',
            borderRadius: 10,
            background: saveStatus === 'saving' ? 'var(--paper)' : '#fff0f0',
            border: `1px solid ${saveStatus === 'saving' ? 'var(--border)' : '#ffaaaa'}`,
            fontSize: '0.8rem',
            wordBreak: 'break-all',
          }}>
            {saveStatus === 'saving' ? '⏳ 保存中...' : `❌ ${saveStatus}`}
            {saveStatus !== 'saving' && (
              <button
                type="button"
                style={{ display: 'block', marginTop: 8, fontSize: '0.8rem', color: 'var(--muted)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={onComplete}
              >
                このまま終了する →
              </button>
            )}
          </div>
        )}

        {saveStatus !== 'saving' && (
          <button
            type="button"
            className="primary-action complete-btn"
            style={{ marginTop: 24 }}
            onClick={handleComplete}
            disabled={saveStatus === 'saving'}
          >
            <Check size={18} /> 完了
          </button>
        )}
      </section>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function WeeklyTest({ user, weekDate, test1Questions, test2Questions, saveSession, onComplete, onBack }) {
  const [stage, setStage] = useState('test1'); // 'test1' | 'test2' | 'final'
  const [test1Results, setTest1Results] = useState(null);
  const [test2Results, setTest2Results] = useState(null);
  const [startedAt] = useState(() => Date.now());

  // 로딩 중
  if (test1Questions === null) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: 64 }}>
        <div className="loading-spinner"
          style={{ borderColor: 'rgba(0,0,0,.12)', borderTopColor: 'var(--ink)' }} />
      </div>
    );
  }

  // 문제 없음
  if (!test1Questions?.length && !test2Questions?.length) {
    return (
      <div className="lesson-page">
        <section className="lesson-hero">
          <div>
            <button type="button" className="back-btn" onClick={onBack}>← Back / 戻る</button>
            <p className="eyebrow">Weekly Test</p>
            <h2>週間テスト</h2>
          </div>
        </section>
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted)' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>📝</p>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>準備中です</p>
          <p style={{ fontSize: '0.9rem' }}>Coming soon — check back later!</p>
        </div>
      </div>
    );
  }

  if (stage === 'test1') {
    return (
      <TestStage
        key="test1"
        questions={test1Questions || []}
        stageLabel={`Test 1${weekDate ? ` — ${weekLabel(weekDate)}` : ''}`}
        stageTitle="キーワード穴埋め"
        nextLabel={test2Questions?.length ? 'Test 2へ' : '結果を見る'}
        onComplete={(results) => {
          setTest1Results(results);
          if (test2Questions?.length) {
            setStage('test2');
          } else {
            setTest2Results([]);
            setStage('final');
          }
        }}
      />
    );
  }

  if (stage === 'test2') {
    return (
      <TestStage
        key="test2"
        questions={test2Questions || []}
        stageLabel="Test 2"
        stageTitle="チャンク穴埋め"
        nextLabel="結果を見る"
        onComplete={(results) => {
          setTest2Results(results);
          setStage('final');
        }}
      />
    );
  }

  return (
    <FinalResult
      test1Results={test1Results || []}
      test2Results={test2Results || []}
      weekDate={weekDate}
      user={user}
      startedAt={startedAt}
      saveSession={saveSession}
      onBack={onBack}
      onComplete={onComplete}
    />
  );
}
