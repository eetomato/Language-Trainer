import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { defaultLesson } from '../utils/sampleData';

// Map Supabase row format → app format
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
    questions: (row.practice_questions || [])
      .slice(0, 3)
      .map((q) => ({
        id: q.id,
        questionType: q.question_type,
        questionText: q.question_text,
        blankAnswer: q.blank_answer,
        multipleChoice: q.multiple_choice || null,
        wordHints: q.word_hints || {},
        context: q.context,
      })),
  };
}

export function useLessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLessons([defaultLesson]);
      setLoading(false);
      return;
    }

    supabase
      .from('lessons')
      .select('*, practice_questions(*)')
      .order('created_at')
      .then(({ data, error }) => {
        if (error || !data?.length) {
          setLessons([defaultLesson]);
        } else {
          setLessons(data.map(mapLesson));
        }
      })
      .catch(() => setLessons([defaultLesson]))
      .finally(() => setLoading(false));
  }, []);

  return { lessons, loading };
}
