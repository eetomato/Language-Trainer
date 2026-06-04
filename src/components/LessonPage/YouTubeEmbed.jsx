import { getYouTubeEmbedUrl } from '../../utils/dataFormatter';

// Convert "1:23" → 83 seconds
function parseTimestamp(ts) {
  if (!ts) return 0;
  const parts = String(ts).split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return Number(ts) || 0;
}

export default function YouTubeEmbed({ url, timestamp }) {
  const base = getYouTubeEmbedUrl(url);
  if (!base) return null; // URL 없으면 섹션 자체 숨김

  const seconds = parseTimestamp(timestamp);
  const src = seconds > 0 ? `${base}?start=${seconds}` : base;

  return (
    <section className="lesson-section video-section">
      <div className="section-heading">
        <p className="eyebrow">A. Video</p>
        <h2>Short clip practice</h2>
      </div>
      <div className="video-frame">
        <iframe
          key={src}
          title="Lesson video"
          src={src}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </section>
  );
}
