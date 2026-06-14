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

function weekLabel(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}/${day}〜`;
}

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
  // chunks/chunk_meanings(object) 또는 chunk/chunk_meaning(단수) 양쪽 지원
  const chunks = sentence.chunks
    || (sentence.chunk ? [sentence.chunk] : []);
  const chunkMeanings = sentence.chunk_meanings
    || (sentence.chunk && sentence.chunk_meaning
      ? { [sentence.chunk]: sentence.chunk_meaning }
      : {});

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

function WeekDetail({ sheets, weekDate, onBack }) {
  const situations = sheets.filter((s) => s.week_start_date === weekDate);
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
      <div className="ws-situations">
        {situations.map((sit) => (
          <SituationCard key={sit.id} situation={sit} />
        ))}
      </div>
    </div>
  );
}

export default function WeeklySheets({ user, saveSession, onBack }) {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState(null); // null = 목록, date string = 상세

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

  // 상세 화면
  if (selectedSheet) {
    return (
      <WeekDetail
        sheets={sheets}
        weekDate={selectedSheet}
        onBack={() => setSelectedSheet(null)}
      />
    );
  }

  // 주차 카드 목록
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
            const count = sheets.filter((s) => s.week_start_date === date).length;
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
