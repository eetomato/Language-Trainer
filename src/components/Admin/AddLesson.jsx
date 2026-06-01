import { useState } from 'react';
import { Save } from 'lucide-react';

export default function AddLesson({ lesson, onSaveLesson }) {
  const [title, setTitle] = useState(lesson.lessonTitle);
  const [youtubeUrl, setYoutubeUrl] = useState(lesson.youtubeUrl);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSaveLesson({ ...lesson, lessonTitle: title, youtubeUrl });
  };

  return (
    <section className="dashboard-band">
      <div className="section-heading">
        <p className="eyebrow">Admin</p>
        <h2>Add or update lesson</h2>
      </div>
      <form className="admin-form" onSubmit={handleSubmit}>
        <label htmlFor="lesson-title">Lesson title</label>
        <input id="lesson-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <label htmlFor="youtube-url">YouTube URL</label>
        <input
          id="youtube-url"
          value={youtubeUrl}
          onChange={(event) => setYoutubeUrl(event.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <button type="submit" className="secondary-action">
          <Save size={18} />
          Save lesson
        </button>
      </form>
    </section>
  );
}
