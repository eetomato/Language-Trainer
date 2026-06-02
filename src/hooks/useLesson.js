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

  // ── Save answer result ─────────────────────────────────────────
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

    // Save to Supabase if connected
    if (supabase) {
      try {
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('name', user.name)
          .maybeSingle();

        await supabase.from('results').insert({
          employee_id: employee?.id ?? null,
          user_answer: userAnswer,
          is_correct: isCorrect,
          time_spent_seconds: 0,
        });
      } catch (_) {}
    }

    return result;
  };

  // ── Save actual study session (called on Complete Lesson) ──────
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

  // ── Reset personal progress ────────────────────────────────────
  const resetProgress = () => {
    const nextResults = results.filter((r) => r.employeeName !== user?.name);
    setResults(nextResults);
    localStorage.setItem(RESULTS_KEY, JSON.stringify(nextResults));

    // Also clear sessions for this user
    const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
    const nextSessions = sessions.filter((s) => s.employeeName !== user?.name);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(nextSessions));
  };

  return { results, submitAnswer, saveSession, resetProgress };
}
