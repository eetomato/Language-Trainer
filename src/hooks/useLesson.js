import { useEffect, useState } from 'react';
import { defaultLesson } from '../utils/sampleData';
import { normalizeAnswer } from '../utils/dataFormatter';
import { supabase } from '../utils/supabaseClient';

const LESSON_KEY = 'nh_menswear_lesson';
const RESULTS_KEY = 'nh_menswear_results';

export function useLesson(user) {
  const [lesson, setLesson] = useState(defaultLesson);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const savedLesson = localStorage.getItem(LESSON_KEY);
    const savedResults = localStorage.getItem(RESULTS_KEY);
    if (savedLesson) setLesson(JSON.parse(savedLesson));
    if (savedResults) setResults(JSON.parse(savedResults));
  }, []);

  const saveLesson = (nextLesson) => {
    setLesson(nextLesson);
    localStorage.setItem(LESSON_KEY, JSON.stringify(nextLesson));
  };

  const submitAnswer = async ({ question, userAnswer, isCorrect }) => {
    const result = {
      id: crypto.randomUUID(),
      employeeName: user.name,
      storeName: user.storeName,
      lessonId: lesson.id,
      questionId: question.id,
      questionType: question.questionType,
      userAnswer,
      expectedAnswer: question.blankAnswer,
      isCorrect,
      attemptedDate: new Date().toISOString(),
    };

    const nextResults = [result, ...results];
    setResults(nextResults);
    localStorage.setItem(RESULTS_KEY, JSON.stringify(nextResults));

    if (supabase) {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('name', user.name)
        .maybeSingle();

      await supabase.from('results').insert({
        employee_id: employee?.id ?? null,
        user_answer: userAnswer,
        is_correct: isCorrect,
        time_spent_seconds: 90,
      });
    }

    return result;
  };

  const resetProgress = () => {
    const nextResults = results.filter((result) => result.employeeName !== user.name);
    setResults(nextResults);
    localStorage.setItem(RESULTS_KEY, JSON.stringify(nextResults));
  };

  const validateAnswer = (answer, expected) => normalizeAnswer(answer) === normalizeAnswer(expected);

  return { lesson, results, saveLesson, submitAnswer, resetProgress, validateAnswer };
}
