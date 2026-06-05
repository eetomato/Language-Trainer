import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const RESULTS_KEY = 'nh_menswear_results';
const SESSIONS_KEY = 'nh_menswear_sessions';

export function useLesson(user) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(RESULTS_KEY);
    if (saved) setResults(JSON.parse(saved));
  }, []);

  const submitAnswer = async ({ question, userAnswer, isCorrect }) => {
    const result = {
      id: crypto.randomUUID(),
      employeeName: user?.name,
      storeName: user?.storeName,
      lessonId: question.lessonId || '',
      questionId: question.id,
      questionType: question.questionType,
      userAnswer,
      expectedAnswer: question.blankAnswer,
      isCorrect,
      attemptedDate: new Date().toISOString(),
    };

    const next = [result, ...results];
    setResults(next);
    localStorage.setItem(RESULTS_KEY, JSON.stringify(next));

    // Supabase 저장 — question_id는 null (practice_questions FK 제약)
    if (supabase) {
      try {
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('name', user.name)
          .maybeSingle();

        // lesson_id: 유효한 UUID인지 확인 후 삽입
        const lessonId = question.lessonId && question.lessonId.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        ) ? question.lessonId : null;

        const { error } = await supabase.from('results').insert({
          employee_id: employee?.id ?? null,
          lesson_id: lessonId,
          question_id: null,           // ✅ FK 제약으로 null 처리
          user_answer: userAnswer,
          is_correct: isCorrect,
          time_spent_seconds: 0,
        });

        if (error) console.warn('[useLesson] Supabase 저장 실패', error.message);
      } catch (e) {
        console.warn('[useLesson] Supabase 예외', e.message);
      }
    }

    return result;
  };

  const saveSession = ({ lessonId, studyMinutes }) => {
    const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
    sessions.push({
      id: crypto.randomUUID(),
      employeeName: user?.name,
      lessonId,
      studyMinutes,
      date: new Date().toISOString(),
    });
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  };

  const resetProgress = () => {
    const nextResults = results.filter((r) => r.employeeName !== user?.name);
    setResults(nextResults);
    localStorage.setItem(RESULTS_KEY, JSON.stringify(nextResults));

    const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
    const nextSessions = sessions.filter((s) => s.employeeName !== user?.name);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(nextSessions));
  };

  return { results, submitAnswer, saveSession, resetProgress };
}
