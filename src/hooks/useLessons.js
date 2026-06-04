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
  const [latestLesson, setLatestLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!supabase) {
      console.warn('[useLessons] Supabase 미연결 → defaultLesson 사용');
      setLessons([defaultLesson]);
      setLatestLesson(defaultLesson);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // week/day 순 전체 레슨
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('week_number', { ascending: true })
        .order('day_number', { ascending: true });

      if (error) throw error;

      if (!data?.length) {
        console.warn('[useLessons] 레슨 없음 → defaultLesson 사용');
        setLessons([defaultLesson]);
        setLatestLesson(defaultLesson);
      } else {
        console.log(`[useLessons] ${data.length}개 레슨 로드 완료`);
        const mapped = data.map(mapLesson);
        setLessons(mapped);

        // created_at 기준 최신 레슨 별도 저장
        const { data: latest } = await supabase
          .from('lessons')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        setLatestLesson(latest ? mapLesson(latest) : mapped.at(-1));
      }
    } catch (e) {
      console.error('[useLessons] fetch 실패', e);
      setLessons([defaultLesson]);
      setLatestLesson(defaultLesson);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { lessons, latestLesson, loading, refresh: fetch };
}
