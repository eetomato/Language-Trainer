import { useState } from 'react';
import { Save } from 'lucide-react';

export default function AddLesson({ lesson, onSaveLesson }) {
  const [title, setTitle] = useState(lesson?.lessonTitle || '');
  const [youtubeUrl, setYoutubeUrl] = useState(lesson?.youtubeUrl || '');
  const [timestamp, setTimestamp] = useState(lesson?.youtubeTimestamp || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveLesson({ ...lesson, lessonTitle: title, youtubeUrl, youtubeTimestamp: timestamp });
  };

  return (
    <section className="dashboard-band">
      <div className="section-heading">
        <p className="eyebrow">Admin</p>
        <h2>Add or update lesson</h2>
      </div>
      <form className="admin-form" onSubmit={handleSubmit}>
        <label htmlFor="lesson-title">Lesson title</label>
        <input
          id="lesson-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label htmlFor="youtube-url">YouTube URL</label>
        <input
          id="youtube-url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
        />

        <label htmlFor="timestamp">
          Start timestamp <span style={{ fontWeight: 400, color: '#999' }}>(例: 1:23)</span>
        </label>
        <input
          id="timestamp"
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          placeholder="0:00"
          style={{ maxWidth: 120 }}
        />

        <button type="submit" className="secondary-action">
          <Save size={18} /> Save lesson
        </button>
      </form>
    </section>
  );
}
