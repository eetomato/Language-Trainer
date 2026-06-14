import { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-US';
  utt.rate = 0.9;
  window.speechSynthesis.speak(utt);
}

// 주차 탭 레이블 생성 (week_start_date 기준)
function weekLabel(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}/${day}〜`;
}

// 청크 클릭 시 뜻 팝업
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

// 문장 카드
function SentenceRow({ sentence }) {
  const chunks = sentence.chunks || [];
  const chunkMeanings = sentence.chunk_meanings || {};

  return (
    <div className="ws-sentence-row">
      <div className="ws-sentence-top">
        <div className="ws-sentence-text">
          {chunks.length > 0
            ? chunks.map((c, i) => (
                <ChunkWord key={i} text={c} meaning={chunkMeanings[c]} />
              ))
            : <span>{sentence.text}</span>
          }
        </div>
        <button
          type="button"
          className="tts-btn"
          onClick={() => speak(sentence.text)}
          aria-label="Listen"
        >
          <Volume2 size={16} />
        </button>
      </div>
      {sentence.translation && (
        <p className="ws-translation">{sentence.translation}</p>
      )}
      {sentence.pattern && (
        <p className="ws-pattern">
          <span className="pattern-label">Pattern: </span>
          {sentence.pattern}
        </p>
      )}
    </div>
  );
}

// Situation 카드
function SituationCard({ situation }) {
  const sentences = situation.sentences || [];
  return (
    <div className="ws-situation-card">
      <p className="ws-situation-title">{situation.title}</p>
      <div className="ws-sentences">
        {sentences.map((s, i) => (
          <SentenceRow key={i} sentence={s} />
        ))}
      </div>
    </div>
  );
}

export default function WeeklySheets({ user, saveSession, onBack }) {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase
      .from('weekly_sheets')
      .select('*')
      .eq('is_hidden', false)
      .order('week_start_date', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setSheets(data);
          if (data.length > 0) setActiveWeek(data[0].week_start_date);
        }
        setLoading(false);
      });
  }, []);

  // 탭별 그룹: week_start_date → situations[]
  const weekDates = [...new Set(sheets.map((s) => s.week_start_date))];
  const activeSituations = sheets.filter((s) => s.week_start_date === activeWeek);

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

      {!loading && sheets.length > 0 && (
        <>
          {/* 주차 탭 */}
          <div className="ws-week-tabs">
            {weekDates.map((date) => (
              <button
                key={date}
                type="button"
                className={`ws-week-tab ${activeWeek === date ? 'active' : ''}`}
                onClick={() => setActiveWeek(date)}
              >
                {weekLabel(date)}
              </button>
            ))}
          </div>

          {/* Situation 목록 */}
          <div className="ws-situations">
            {activeSituations.map((sit) => (
              <SituationCard key={sit.id} situation={sit} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
