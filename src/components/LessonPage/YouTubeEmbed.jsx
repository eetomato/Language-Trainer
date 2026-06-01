import { getYouTubeEmbedUrl } from '../../utils/dataFormatter';

export default function YouTubeEmbed({ url }) {
  return (
    <section className="lesson-section video-section">
      <div className="section-heading">
        <p className="eyebrow">A. Video</p>
        <h2>Short clip practice</h2>
      </div>
      <div className="video-frame">
        <iframe
          title="Lesson video"
          src={getYouTubeEmbedUrl(url)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </section>
  );
}
