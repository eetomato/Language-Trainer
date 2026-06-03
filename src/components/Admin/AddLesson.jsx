import { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

const EMPTY_SENTENCE = { text: '', chunks: '', hints: '' };

function parseSentences(rawList) {
  return rawList
    .filter(({ text }) => text.trim()) // text 있는 것만
    .map(({ text, chunks, hints }) => {
      const trimmed = text.trim();

      // chunks가 비어있으면 text 전체를 단일 청크로 사용
      const rawChunks = chunks?.trim();
      const chunkArr = rawChunks
        ? rawChunks.split('/').map((c) => c.trim()).filter(Boolean)
        : [trimmed];

      // hints: "pants:ズボン, knit:ニット"
      const hintObj = {};
      (hints || '').split(',').forEach((pair) => {
        const [k, v] = pair.split(':').map((s) => s.trim());
        if (k && v) hintObj[k.toLowerCase()] = v;
      });

      return { text: trimmed, chunks: chunkArr, hints: hintObj };
    });
}

export default function AddLesson({ lessons = [], onRefresh }) {
  const [lessonId, setLessonId] = useState(''); // '' = 新規INSERT
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);
  const [dayNumber, setDayNumber] = useState(1);
  const [rawSentences, setRawSentences] = useState([
    { ...EMPTY_SENTENCE },
    { ...EMPTY_SENTENCE },
    { ...EMPTY_SENTENCE },
  ]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const updateSentence = (i, field, value) => {
    setRawSentences((prev) => prev.map((s, j) => j === i ? { ...s, [field]: value } : s));
  };

  const addSentence = () => setRawSentences((p) => [...p, { ...EMPTY_SENTENCE }]);
  const removeSentence = (i) => setRawSentences((p) => p.filter((_, j) => j !== i));

  const handleSave = async (e) => {
    e.preventDefault();
    console.log('[AddLesson] 저장 버튼 클릭', { supabaseExists: !!supabase, lessonId, title, youtubeUrl });
    if (!supabase) { setMsg({ type: 'err', text: 'Supabase not connected.' }); return; }
    setSaving(true);

    const sentences = parseSentences(rawSentences);
    console.log('[AddLesson] parseSentences 결과', sentences);

    const payload = {
      lesson_title: title,
      topic_area: topic,
      youtube_url: youtubeUrl || null,
      youtube_timestamp: timestamp || null,
      week_number: parseInt(weekNumber) || 1,
      day_number: parseInt(dayNumber) || 1,
      sentences,
      vocabulary_json: [],
      example_sentences: sentences.map((s) => ({ japanese: '', english: s.text })),
      difficulty_level: 'beginner',
    };

    let error;
    if (lessonId) {
      console.log('[AddLesson] UPDATE 실행', { lessonId, payload });
      ({ error } = await supabase.from('lessons').update(payload).eq('id', lessonId));
    } else {
      console.log('[AddLesson] INSERT 실행', { payload });
      ({ error } = await supabase.from('lessons').insert(payload));
    }

    console.log('[AddLesson] 저장 결과', { error });
    setSaving(false);
    if (error) {
      setMsg({ type: 'err', text: error.message });
    } else {
      setMsg({ type: 'ok', text: 'レッスンを保存しました！' });
      onRefresh?.();
    }
  };

  return (
    <section className="dashboard-band">
      <div className="section-heading">
        <p className="eyebrow">Admin — Lesson</p>
        <h2>レッスン入力</h2>
      </div>

      {msg && (
        <p className={`feedback ${msg.type === 'ok' ? 'correct' : 'wrong'}`} style={{ marginBottom: 16 }}>
          {msg.text}
        </p>
      )}

      <form className="admin-form lesson-form" onSubmit={handleSave}>

        {/* Basic info */}
        {/* Week / Day */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label>Week</label>
            <input type="number" min="1" max="52" value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)} />
          </div>
          <div>
            <label>Day (1–6 = 신규, 7 = 테스트)</label>
            <input type="number" min="1" max="7" value={dayNumber}
              onChange={(e) => setDayNumber(e.target.value)} />
          </div>
        </div>

        <label>レッスンタイトル</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Size Expression" required />

        <label>トピック</label>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Menswear fit" />

        {/* YouTube */}
        <label>YouTube URL</label>
        <input
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <label>
          タイムスタンプ <span style={{ fontWeight: 400, color: '#999' }}>(例: 1:23)</span>
        </label>
        <input
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          placeholder="0:00"
          style={{ maxWidth: 120 }}
        />

        {/* Sentences */}
        <div className="lesson-sentences-header">
          <strong>文章 ({rawSentences.length})</strong>
          <button type="button" className="icon-btn" onClick={addSentence} title="文章を追加">
            <Plus size={15} />
          </button>
        </div>

        {rawSentences.map((s, i) => (
          <div key={i} className="sentence-input-block">
            <div className="sentence-input-header">
              <span>文章 {i + 1}</span>
              {rawSentences.length > 1 && (
                <button type="button" className="icon-btn danger" onClick={() => removeSentence(i)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <label>英文</label>
            <input
              value={s.text}
              onChange={(e) => updateSentence(i, 'text', e.target.value)}
              placeholder="These pants go very well with this knit."
            />

            <label>
              チャンク <span style={{ fontWeight: 400, color: '#999' }}>( / で区切る)</span>
            </label>
            <input
              value={s.chunks}
              onChange={(e) => updateSentence(i, 'chunks', e.target.value)}
              placeholder="These pants / go very well / with this knit."
            />

            <label>
              ヒント <span style={{ fontWeight: 400, color: '#999' }}>(単語:意味, 単語:意味)</span>
            </label>
            <input
              value={s.hints}
              onChange={(e) => updateSentence(i, 'hints', e.target.value)}
              placeholder="pants:ズボン, knit:ニット"
            />
          </div>
        ))}

        <button type="submit" className="secondary-action" disabled={saving}>
          <Save size={18} /> {saving ? '保存中...' : 'レッスンを保存'}
        </button>
      </form>
    </section>
  );
}
