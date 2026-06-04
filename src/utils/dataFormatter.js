export function normalizeAnswer(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[。.!！?？]/g, '')
    .toLowerCase();
}

export function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return `${hours}h ${rest}m`;
}

export function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    let videoId = null;

    if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.pathname.includes('/shorts/')) {
      // youtube.com/shorts/ID
      videoId = parsed.pathname.split('/shorts/')[1]?.split('/')[0];
    } else {
      // youtube.com/watch?v=ID
      videoId = parsed.searchParams.get('v');
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}
