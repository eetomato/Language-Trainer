import { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Square } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

// ── TTS ────────────────────────────────────────────────────
function getVoice(role) {
  const voices = window.speechSynthesis?.getVoices() || [];
  const staffNames = ['Daniel', 'Google UK English Male', 'Rishi'];
  const customerNames = ['Aaron', 'Google US English', 'Samantha', 'Karen'];
  const preferred = role === 'Staff' ? staffNames : customerNames;
  return preferred.map((n) => voices.find((v) => v.name === n)).find(Boolean) ?? null;
}

function speakLine(text, role) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = 0.85;
    utt.pitch = 1.0;
    const voice = getVoice(role);
    if (voice) utt.voice = voice;
    utt.onend = resolve;
    utt.onerror = resolve;
    window.speechSynthesis.speak(utt);
  });
}

// ── 대화 화면 ───────────────────────────────────────────────
function DialogueView({ situation, onBack }) {
  const lines = situation.lines || [];
  const [playing, setPlaying] = useState(false);
  const [activeIdx, setActiveIdx] = useState(null);
  const stopRef = useRef(false);

  const stopAll = () => {
    stopRef.current = true;
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setActiveIdx(null);
  };

  const playAll = async () => {
    if (playing) { stopAll(); return; }
    stopRef.current = false;
    setPlaying(true);
    for (let i = 0; i < lines.length; i++) {
      if (stopRef.current) break;
      setActiveIdx(i);
      await speakLine(lines[i].text, lines[i].role);
      await new Promise((r) => setTimeout(r, 300));
    }
    setPlaying(false);
    setActiveIdx(null);
  };

  const playOne = (line) => {
    stopAll();
    setTimeout(() => {
      stopRef.current = false;
      speakLine(line.text, line.role);
    }, 50);
  };

  useEffect(() => () => { stopAll(); }, []);

  return (
    <div className="lesson-page">
      <section className="lesson-hero">
        <div>
          <button type="button" className="back-btn" onClick={() => { stopAll(); onBack(); }}>
            ← Back / 戻る
          </button>
          <p className="eyebrow">Audio Lesson</p>
          <h2>{situation.title}</h2>
        </div>
      </section>

      <div className="al-toolbar">
        <button
          type="button"
          className={`al-play-btn ${playing ? 'playing' : ''}`}
          onClick={playAll}
        >
          {playing ? <><Square size={16} /> Stop</> : <><Play size={16} /> 全部再生</>}
        </button>
      </div>

      <div className="al-dialogue">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`al-line ${line.role === 'Staff' ? 'al-staff' : 'al-customer'} ${activeIdx === i ? 'al-active' : ''}`}
          >
            <div className="al-line-header">
              <span className="al-role">{line.role}</span>
              <button
                type="button"
                className="al-tts-btn"
                onClick={() => playOne(line)}
                aria-label="Listen"
              >
                <Volume2 size={14} />
              </button>
            </div>
            <p className="al-text">{line.text}</p>
            {line.translation && (
              <p className="al-translation">{line.translation}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Situation 목록 ──────────────────────────────────────────
export default function AudioLesson({ onBack }) {
  const [situations, setSituations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase
      .from('weekly_sheets')
      .select('week_start_date, audio_script')
      .eq('is_hidden', false)
      .order('week_start_date', { ascending: false })
      .limit(1)
      .single()
      .then(({ data, error }) => {
        if (!error && data?.audio_script) {
          setSituations(data.audio_script);
        }
        setLoading(false);
      });
  }, []);

  if (selected) {
    return <DialogueView situation={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="lesson-page">
      <section className="lesson-hero">
        <div>
          <button type="button" className="back-btn" onClick={onBack}>
            ← Back / 戻る
          </button>
          <p className="eyebrow">Audio Lesson</p>
          <h2>オーディオレッスン</h2>
          <p>シチュエーションを選んでください</p>
        </div>
      </section>

      {loading && (
        <div style={{ display: 'grid', placeItems: 'center', padding: 48 }}>
          <div className="loading-spinner"
            style={{ borderColor: 'rgba(0,0,0,.12)', borderTopColor: 'var(--ink)' }} />
        </div>
      )}

      {!loading && situations.length === 0 && (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted)' }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>🎧</p>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>準備中です</p>
          <p style={{ fontSize: '0.9rem' }}>Coming soon — check back later!</p>
        </div>
      )}

      {!loading && situations.length > 0 && (
        <div className="al-situation-list">
          {situations.map((sit, i) => (
            <button
              key={i}
              type="button"
              className="al-situation-card"
              onClick={() => setSelected(sit)}
            >
              <span className="al-situation-num">#{i + 1}</span>
              <span className="al-situation-title">{sit.title}</span>
              <Volume2 size={18} className="al-situation-icon" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
