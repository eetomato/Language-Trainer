import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { defaultLesson } from '../utils/sampleData';

function mapLesson(row) {
  return {
    id: row.id,
    lessonTitle: row.lesson_title,
    topicArea: row.topic_area,
    youtubeUrl: row.youtube_url,
    youtubeTimestamp: row.youtube_timestamp || null,
    grammarPoint: row.grammar_point,
    vocabulary: row.vocabulary_json || [],
    exampleSentences: row.example_sentences || [],
    difficultyLevel: row.difficulty_level,
    sentences: row.sentences || [],
  };
}

export function useLessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    if (!supabase) {
      setLessons([defaultLesson]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('lessons')
      .select('*')
      .order('created_at')
      .then(({ data, error }) => {
        setLessons(error || !data?.length ? [defaultLesson] : data.map(mapLesson));
      })
      .catch(() => setLessons([defaultLesson]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { lessons, loading, refresh: fetch };
}
