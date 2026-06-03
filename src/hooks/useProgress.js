import { useState, useEffect } from 'react';

const key = (name) => `nh_progress_${name}`;
const testKey = (name) => `nh_tests_${name}`;

export function useProgress(user) {
  const [completed, setCompleted] = useState([]);     // [{lessonId, date}]
  const [testsDone, setTestsDone] = useState([]);     // [weekNumber]

  useEffect(() => {
    if (!user?.name) return;
    const c = localStorage.getItem(key(user.name));
    const t = localStorage.getItem(testKey(user.name));
    if (c) setCompleted(JSON.parse(c));
    if (t) setTestsDone(JSON.parse(t));
  }, [user?.name]);

  const markLessonComplete = (lessonId) => {
    if (completed.some((c) => c.lessonId === lessonId)) return;
    const next = [...completed, { lessonId, date: new Date().toISOString() }];
    setCompleted(next);
    localStorage.setItem(key(user.name), JSON.stringify(next));
  };

  const markTestComplete = (weekNumber) => {
    if (testsDone.includes(weekNumber)) return;
    const next = [...testsDone, weekNumber];
    setTestsDone(next);
    localStorage.setItem(testKey(user.name), JSON.stringify(next));
  };

  const isLessonDone = (lessonId) => completed.some((c) => c.lessonId === lessonId);
  const isTestDone = (weekNumber) => testsDone.includes(weekNumber);

  return { completed, markLessonComplete, markTestComplete, isLessonDone, isTestDone };
}
