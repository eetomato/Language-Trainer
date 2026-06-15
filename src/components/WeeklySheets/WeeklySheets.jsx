import { useState, useEffect } from 'react';
import { Volume2, BookOpen, Shuffle } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-US';
  utt.rate = 0.85;
  utt.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const preferred = [
    'Samantha', 'Karen', 'Daniel', 'Moira',
    'Google US English', 'Google UK English Female',
    'Microsoft Aria', 'Microsoft Jenny',
  ];

  const found = preferred
    .map(name => voices.find(v => v.name === name))
    .find(Boolean);

  if (found) utt.voice = found;
  window.speechSynthesis.speak(utt);
}

function weekLabel(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}/${day}〜`;
}

// ── 学習タブ ──────────────────────────────────────────────────

function ChunkWord({ text, meaning }) {
  const [open, setOpen] = useState(false);
  if (!meaning) return <span className="ws-chunk">{text}</span>;
  return (
    <span
      className="ws-chunk ws-chunk-hint"
      onClick={() => setOpen((v) => !v)}
    >
      {text}
      {open && <span className="ws-chunk-popup">{meaning}</span>}
    </span>
  );
}

function SentenceRow({ sentence }) {
  const { text, translation, chunk, chunk_meaning, pattern } = sentence;

  let textContent;
  if (chunk && text && text.includes(chunk)) {
    const parts = text.split(chunk);
    textContent = parts.map((part, i) => (
      <span key={i}>
        {part}
        {i < parts.length - 1 && (
          <ChunkWord text={chunk} meaning={chunk_meaning} />
        )}
      </span>
    ));
  } else {
    textContent = <span>{text}</span>;
  }

  return (
    <div className="ws-sentence-row">
      <div className="ws-sentence-top">
        <div className="ws-sentence-text">{textContent}</div>
        <button
          type="button"
          className="tts-btn"
          onClick={() => speak(text)}
          aria-label="Listen"
        >
          <Volume2 size={16} />
        </button>
      </div>
      {translation && (
        <p className="ws-translation">{translation}</p>
      )}
      {chunk && text && !text.includes(chunk) && (
        <p className="ws-chunk-note">
          <ChunkWord text={chunk} meaning={chunk_meaning} />
        </p>
      )}
      {pattern && (
        <p className="ws-pattern">
          <span className="pattern-label">Pattern: </span>
          {pattern}
        </p>
      )}
    </div>
  );
}

function SituationCard({ situation }) {
  const sentences = situation.sentences || [];
  return (
    <div className="ws-situation-card">
      <p className="ws-situation-title">{situation.title}</p>
      {situation.pattern && (
        <p className="ws-situation-pattern">
          <span className="pattern-label">Pattern: </span>
          {situation.pattern}
        </p>
      )}
      <div className="ws-sentences">
        {sentences.map((s, i) => (
          <SentenceRow key={i} sentence={s} />
        ))}
      </div>
    </div>
  );
}

// ── 並べ替えタブ ───────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getChunks(sentence) {
  if (sentence.chunks && Array.isArray(sentence.chunks) && sentence.chunks.length > 1) {
    return sentence.chunks;
  }
  return (sentence.text || '').trim().split(/\s+/).filter(Boolean);
}

function SortingQuestion({ sentence, onNext }) {
  const chunks = getChunks(sentence);
  const [pool, setPool] = useState(() => shuffle(chunks.map((c, i) => ({ text: c, id: i }))));
  const [placed, setPlaced] = useState([]);
  const [status, setStatus] = useState(null);

  const pickChunk = (item) => {
    if (status) return;
    setPool((p) => p.filter((c) => c.id !== item.id));
    setPlaced((p) => [...p, item]);
  };

  const removeChunk = (item) => {
    if (status) return;
    setPlaced((p) => p.filter((c) => c.id !== item.id));
    setPool((p) => [...p, item]);
  };

  useEffect(() => {
    if (placed.length === chunks.length && status === null) {
      const answer = placed.map((c) => c.text).join(' ');
      const correct = chunks.join(' ');
      if (answer === correct) {
        setStatus('correct');
        setTimeout(() => onNext(true), 1500);
      } else {
        setStatus('wrong');
      }
    }
  }, [placed]); // eslint-disable-line

  const reset = () => {
    setPool(shuffle(chunks.map((c, i) => ({ text: c, id: i }))));
    setPlaced([]);
    setStatus(null);
  };

  return (
    <div className="sort-question">
      <p className="sort-translation">{sentence.translation || '—'}</p>

      <div className={`sort-placed-area${status === 'correct' ? ' sort-correct' : ''}${status === 'wrong' ? ' sort-wrong' : ''}`}>
        {placed.length === 0 ? (
          <span className="sort-placeholder">ここにチャンクを並べる</span>
        ) : (
          placed.map((item) => (
            <button
              key={item.id}
              type="button"
              className="sort-chip sort-chip-placed"
              onClick={() => removeChunk(item)}
            >
              {item.text}
            </button>
          ))
        )}
      </div>

      <div className="sort-pool">
        {pool.map((item) => (
          <button
            key={item.id}
            type="button"
            className="sort-chip"
            onClick={() => pickChunk(item)}
            disabled={!!status}
          >
            {item.text}
          </button>
        ))}
      </div>

      {status === 'correct' && (
        <p className="sort-feedback sort-feedback-correct">✓ 正解！</p>
      )}
      {status === 'wrong' && (
        <div style={{ marginTop: 12 }}>
          <p className="sort-feedback sort-feedback-wrong">✗ もう一度試してください</p>
          <button type="button" className="secondary-action" style={{ marginTop: 10 }} onClick={reset}>
            リセット
          </button>
        </div>
      )}
    </div>
  );
}

function SortingExercise({ situations }) {
  const [selectedSit, setSelectedSit] = useState(null);
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);

  if (selectedSit === null) {
    return (
      <div className="sort-sit-list">
        <p className="sort-sit-heading">シチュエーションを選んでください</p>
        {situations.map((sit, i) => (
          <button
            key={i}
            type="button"
            className="sort-sit-btn"
            onClick={() => {
              setSelectedSit(i);
              setSentenceIdx(0);
              setScore({ correct: 0, total: 0 });
              setDone(false);
            }}
          >
            {sit.title || `Situation ${i + 1}`}
          </button>
        ))}
      </div>
    );
  }

  const sit = situations[selectedSit];
  const sentences = (sit?.sentences || []).filter((s) => s.text);
  const total = sentences.length;

  if (done || sentenceIdx >= total) {
    return (
      <div className="sort-result">
        <p className="sort-result-title">{sit.title}</p>
        <p className="sort-result-score">{score.correct} / {score.total} 正解</p>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 24 }}>
          {score.correct === score.total ? '🎉 完璧！' : '📚 もう一度練習してみよう！'}
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="secondary-action"
            onClick={() => { setSentenceIdx(0); setScore({ correct: 0, total: 0 }); setDone(false); }}
          >
            もう一度
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={() => setSelectedSit(null)}
          >
            ← シチュエーション選択
          </button>
        </div>
      </div>
    );
  }

  const handleNext = (isCorrect) => {
    const newScore = { correct: score.correct + (isCorrect ? 1 : 0), total: score.total + 1 };
    setScore(newScore);
    const next = sentenceIdx + 1;
    if (next >= total) {
      setDone(true);
      setScore(newScore);
    } else {
      setSentenceIdx(next);
    }
  };

  return (
    <div className="sort-exercise">
      <div className="sort-progress">
        <span className="sort-sit-title">{sit.title}</span>
        <span className="sort-count">{sentenceIdx + 1} / {total}</span>
      </div>
      <SortingQuestion
        key={sentenceIdx}
        sentence={sentences[sentenceIdx]}
        onNext={handleNext}
      />
    </div>
  );
}

// ── WeekDetail (タブ付き) ──────────────────────────────────────

function WeekDetail({ sheets, weekDate, onBack }) {
  const sheet = sheets.find((s) => s.week_start_date === weekDate);
  const situations = sheet?.situations || [];
  const [tab, setTab] = useState('learn');

  return (
    <div className="lesson-page">
      <section className="lesson-hero">
        <div>
          <button type="button" className="back-btn" onClick={onBack}>
            ← Back / 戻る
          </button>
          <p className="eyebrow">Week of {weekLabel(weekDate)}</p>
          <h2>接客で使える英語表現</h2>
        </div>
      </section>

      <div className="ws-tabs">
        <button
          type="button"
          className={`ws-tab${tab === 'learn' ? ' ws-tab-active' : ''}`}
          onClick={() => setTab('learn')}
        >
          <BookOpen size={15} /> 学習
        </button>
        <button
          type="button"
          className={`ws-tab${tab === 'sort' ? ' ws-tab-active' : ''}`}
          onClick={() => setTab('sort')}
        >
          <Shuffle size={15} /> 並べ替え
        </button>
      </div>

      {tab === 'learn' && (
        <div className="ws-situations">
          {situations.map((sit, i) => (
            <SituationCard key={i} situation={sit} />
          ))}
        </div>
      )}

      {tab === 'sort' && (
        <div className="ws-sort-wrapper">
          {situations.length === 0 ? (
            <p style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted)' }}>
              準備中です
            </p>
          ) : (
            <SortingExercise situations={situations} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────

export default function WeeklySheets({ user, saveSession, onBack }) {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase
      .from('weekly_sheets')
      .select('*')
      .eq('is_hidden', false)
      .order('week_start_date', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setSheets(data);
        setLoading(false);
      });
  }, []);

  if (selectedSheet) {
    return (
      <WeekDetail
        sheets={sheets}
        weekDate={selectedSheet}
        onBack={() => setSelectedSheet(null)}
      />
    );
  }

  const weekDates = [...new Set(sheets.map((s) => s.week_start_date))];

  return (
    <div className="lesson-page">
      <section className="lesson-hero">
        <div>
          <button type="button" className="back-btn" onClick={onBack}>
            ← Back / 戻る
          </button>
          <p className="eyebrow">Customer English</p>
          <h2>接客で使える英語表現</h2>
        </div>
      </section>

      {loading && (
        <div style={{ display: 'grid', placeItems: 'center', padding: 48 }}>
          <div className="loading-spinner"
            style={{ borderColor: 'rgba(0,0,0,.12)', borderTopColor: 'var(--ink)' }} />
        </div>
      )}

      {!loading && sheets.length === 0 && (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted)' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>📋</p>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>準備中です</p>
          <p style={{ fontSize: '0.9rem' }}>Coming soon — check back later!</p>
        </div>
      )}

      {!loading && weekDates.length > 0 && (
        <div className="ws-week-cards">
          {weekDates.map((date) => {
            const sheet = sheets.find((s) => s.week_start_date === date);
            const count = (sheet?.situations || []).length;
            return (
              <button
                key={date}
                type="button"
                className="ws-week-card"
                onClick={() => setSelectedSheet(date)}
              >
                <span className="ws-week-card-label">{weekLabel(date)}</span>
                <span className="ws-week-card-count">{count} situations</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
