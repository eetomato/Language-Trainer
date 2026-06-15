import { useState, useEffect } from 'react';
import { Volume2, BookOpen, LayoutList, CheckCircle2 } from 'lucide-react';
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
  const found = preferred.map(n => voices.find(v => v.name === n)).find(Boolean);
  if (found) utt.voice = found;
  window.speechSynthesis.speak(utt);
}

function weekLabel(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}〜`;
}

// ── Study tab ─────────────────────────────────────────────────

function ChunkWord({ text, meaning }) {
  const [open, setOpen] = useState(false);
  if (!meaning) return <span className="ws-chunk">{text}</span>;
  return (
    <span className="ws-chunk ws-chunk-hint" onClick={() => setOpen(v => !v)}>
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
        {i < parts.length - 1 && <ChunkWord text={chunk} meaning={chunk_meaning} />}
      </span>
    ));
  } else {
    textContent = <span>{text}</span>;
  }
  return (
    <div className="ws-sentence-row">
      <div className="ws-sentence-top">
        <div className="ws-sentence-text">{textContent}</div>
        <button type="button" className="tts-btn" onClick={() => speak(text)} aria-label="Listen">
          <Volume2 size={16} />
        </button>
      </div>
      {translation && <p className="ws-translation">{translation}</p>}
      {chunk && text && !text.includes(chunk) && (
        <p className="ws-chunk-note"><ChunkWord text={chunk} meaning={chunk_meaning} /></p>
      )}
      {pattern && (
        <p className="ws-pattern"><span className="pattern-label">Pattern: </span>{pattern}</p>
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
          <span className="pattern-label">Pattern: </span>{situation.pattern}
        </p>
      )}
      <div className="ws-sentences">
        {sentences.map((s, i) => <SentenceRow key={i} sentence={s} />)}
      </div>
    </div>
  );
}

// ── Arrange tab ───────────────────────────────────────────────

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

// Single sentence arrange row inside a card
function ArrangeSentenceRow({ sentence, onSolved }) {
  const chunks = getChunks(sentence);
  const [pool, setPool] = useState(() => shuffle(chunks.map((c, i) => ({ text: c, id: i }))));
  const [placed, setPlaced] = useState([]);
  const [status, setStatus] = useState(null); // null | 'correct' | 'wrong'

  const pickChunk = (item) => {
    if (status === 'correct') return;
    setPool(p => p.filter(c => c.id !== item.id));
    setPlaced(p => [...p, item]);
  };

  const removeChunk = (item) => {
    if (status === 'correct') return;
    setPlaced(p => p.filter(c => c.id !== item.id));
    setPool(p => [...p, item]);
  };

  useEffect(() => {
    if (placed.length === chunks.length && status === null) {
      const answer = placed.map(c => c.text).join(' ');
      const correct = chunks.join(' ');
      if (answer === correct) {
        setStatus('correct');
        onSolved();
      } else {
        setStatus('wrong');
        // shake then auto-reset after 900ms
        setTimeout(() => {
          setPool(shuffle(chunks.map((c, i) => ({ text: c, id: i }))));
          setPlaced([]);
          setStatus(null);
        }, 900);
      }
    }
  }, [placed]); // eslint-disable-line

  return (
    <div className={`arr-sentence${status === 'correct' ? ' arr-sentence-done' : ''}`}>
      {/* translation hint */}
      <p className="arr-hint">{sentence.translation || '—'}</p>

      {/* answer drop zone */}
      <div className={`arr-zone${status === 'wrong' ? ' arr-zone-wrong' : ''}${status === 'correct' ? ' arr-zone-correct' : ''}`}>
        {status === 'correct' ? (
          <span className="arr-correct-text">
            <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {chunks.join(' ')}
          </span>
        ) : placed.length === 0 ? (
          <span className="arr-placeholder">Place chunks here</span>
        ) : (
          placed.map(item => (
            <button key={item.id} type="button" className="arr-chip arr-chip-placed" onClick={() => removeChunk(item)}>
              {item.text}
            </button>
          ))
        )}
      </div>

      {/* chunk pool */}
      {status !== 'correct' && (
        <div className="arr-pool">
          {pool.map(item => (
            <button key={item.id} type="button" className="arr-chip" onClick={() => pickChunk(item)}>
              {item.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// One situation card in Arrange mode (all sentences shown)
function ArrangeSituationCard({ situation }) {
  const sentences = (situation.sentences || []).filter(s => s.text);
  const [solvedCount, setSolvedCount] = useState(0);
  const allSolved = solvedCount >= sentences.length && sentences.length > 0;

  return (
    <div className={`arr-card${allSolved ? ' arr-card-done' : ''}`}>
      {/* orange title bar */}
      <div className="arr-card-header">
        <span className="arr-card-title">{situation.title || 'Situation'}</span>
      </div>

      <div className="arr-sentences">
        {sentences.map((s, i) => (
          <ArrangeSentenceRow
            key={i}
            sentence={s}
            onSolved={() => setSolvedCount(n => n + 1)}
          />
        ))}
      </div>

      {allSolved && (
        <div className="arr-card-complete">
          <CheckCircle2 size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Perfect! {sentences.length}/{sentences.length} Correct
        </div>
      )}
    </div>
  );
}

function ArrangeTab({ situations }) {
  if (situations.length === 0) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted)' }}>
        Coming soon
      </div>
    );
  }
  return (
    <div className="arr-list">
      {situations.map((sit, i) => (
        <ArrangeSituationCard key={i} situation={sit} />
      ))}
    </div>
  );
}

// ── WeekDetail (with tabs) ────────────────────────────────────

function WeekDetail({ sheets, weekDate, onBack }) {
  const sheet = sheets.find(s => s.week_start_date === weekDate);
  const situations = sheet?.situations || [];
  const [tab, setTab] = useState('learn');

  return (
    <div className="lesson-page">
      <section className="lesson-hero">
        <div>
          <button type="button" className="back-btn" onClick={onBack}>← Back</button>
          <p className="eyebrow">Week of {weekLabel(weekDate)}</p>
          <h2>Customer English</h2>
        </div>
      </section>

      <div className="ws-tabs">
        <button
          type="button"
          className={`ws-tab${tab === 'learn' ? ' ws-tab-active' : ''}`}
          onClick={() => setTab('learn')}
        >
          <BookOpen size={15} /> Study
        </button>
        <button
          type="button"
          className={`ws-tab${tab === 'sort' ? ' ws-tab-active' : ''}`}
          onClick={() => setTab('sort')}
        >
          <LayoutList size={15} /> Arrange
        </button>
      </div>

      {tab === 'learn' && (
        <div className="ws-situations">
          {situations.map((sit, i) => <SituationCard key={i} situation={sit} />)}
        </div>
      )}

      {tab === 'sort' && (
        <div className="ws-sort-wrapper">
          <ArrangeTab situations={situations} />
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
      <WeekDetail sheets={sheets} weekDate={selectedSheet} onBack={() => setSelectedSheet(null)} />
    );
  }

  const weekDates = [...new Set(sheets.map(s => s.week_start_date))];

  return (
    <div className="lesson-page">
      <section className="lesson-hero">
        <div>
          <button type="button" className="back-btn" onClick={onBack}>← Back</button>
          <p className="eyebrow">Customer English</p>
          <h2>English for Retail Service</h2>
        </div>
      </section>

      {loading && (
        <div style={{ display: 'grid', placeItems: 'center', padding: 48 }}>
          <div className="loading-spinner" style={{ borderColor: 'rgba(0,0,0,.12)', borderTopColor: 'var(--ink)' }} />
        </div>
      )}

      {!loading && sheets.length === 0 && (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted)' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>📋</p>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Coming soon</p>
          <p style={{ fontSize: '0.9rem' }}>Check back later!</p>
        </div>
      )}

      {!loading && weekDates.length > 0 && (
        <div className="ws-week-cards">
          {weekDates.map(date => {
            const sheet = sheets.find(s => s.week_start_date === date);
            const count = (sheet?.situations || []).length;
            return (
              <button key={date} type="button" className="ws-week-card" onClick={() => setSelectedSheet(date)}>
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
