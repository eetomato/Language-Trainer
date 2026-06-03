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
    weekNumber: row.week_number || 1,
    dayNumber: row.day_number || 1,
    sentences: row.sentences || [],
  };
}

export function useLessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    if (!supabase) {
      console.warn('[useLessons] Supabase 미연결 → defaultLesson 사용');
      setLessons([defaultLesson]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('lessons')
      .select('*')
      .order('week_number', { ascending: true })
      .order('day_number', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('[useLessons] Supabase 오류 → defaultLesson 사용', error);
          setLessons([defaultLesson]);
        } else if (!data?.length) {
          console.warn('[useLessons] 레슨 없음 → defaultLesson 사용');
          setLessons([defaultLesson]);
        } else {
          console.log(`[useLessons] ${data.length}개 레슨 로드 완료`);
          setLessons(data.map(mapLesson));
        }
      })
      .catch((e) => {
        console.error('[useLessons] fetch 실패', e);
        setLessons([defaultLesson]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { lessons, loading, refresh: fetch };
}
