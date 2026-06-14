import { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-US';
  utt.rate = 0.85;
  utt.pitch = 1.0;

  // 자연스러운 영어 목소리 우선순위로 선택
  const voices = window.speechSynthesis.getVoices();
  const preferred = [
    'Samantha', 'Karen', 'Daniel', 'Moira',  // Mac
    'Google US English', 'Google UK English Female',  // Chrome
    'Microsoft Aria', 'Microsoft Jenny',  // Windows
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

  // chunk가 text 안에 있으면 인라인 하이라이트, 아니면 text 전체 표시
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
      {/* chunk가 text에 없는 경우 별도 표시 */}
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

function WeekDetail({ sheets, weekDate, onBack }) {
  const sheet = sheets.find((s) => s.week_start_date === weekDate);
  const situations = sheet?.situations || [];
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
        {situations.map((sit, i) => (
          <SituationCard key={i} situation={sit} />
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
