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

export function calculateEmployeeStats(user, results = [], sessions = []) {
  const personal = results.filter((r) => r.employeeName === user?.name);
  const correct = personal.filter((r) => r.isCorrect).length;
  const total = personal.length;
  const score = total ? Math.round((correct / total) * 100) : 0;

  const personalSessions = sessions.filter((s) => s.employeeName === user?.name);
  const studyMinutes = personalSessions.reduce((sum, s) => sum + (s.studyMinutes || 0), 0);

  const mistakes = personal
    .filter((r) => !r.isCorrect)
    .reduce((acc, r) => {
      const key = r.expectedAnswer || 'review phrase';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  return {
    score,
    completed: total,
    studyMinutes,
    streak: personalSessions.length ? 1 : 0,
    weakVocabulary: Object.entries(mistakes).map(([word, count]) => ({ word, count })),
    lastLesson: personalSessions.length
      ? new Date(personalSessions.at(-1).date).toLocaleDateString('ja-JP')
      : 'Not started',
  };
}

export function calculateManagerStats({ employees = [], mistakes = [], stores = [] }) {
  const staffList = employees
    .filter((e) => e.role !== 'manager')
    .map((emp) => {
      const res = emp.results || [];
      const total = res.length;
      const correct = res.filter((r) => r.is_correct).length;

      // ✅ sessions에서 study time 합산
      const empSessions = emp.sessions || [];
      const studyMinutes = empSessions.reduce((sum, s) => sum + (s.study_minutes || 0), 0);

      return {
        name: emp.name,
        storeName: emp.store_name,
        score: total ? Math.round((correct / total) * 100) : 0,
        studyMinutes,
        total,
      };
    });

  const storeMap = {};
  stores.forEach((s) => {
    storeMap[s.name] = { storeName: s.name, totalScore: 0, count: 0 };
  });
  staffList.forEach((emp) => {
    const key = emp.storeName;
    storeMap[key] ||= { storeName: key, totalScore: 0, count: 0 };
    storeMap[key].totalScore += emp.score;
    storeMap[key].count += 1;
  });

  const weakVocabulary = [...mistakes]
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 6)
    .map((m) => ({ word: m.wrong_word, count: m.frequency }));

  return {
    stores: Object.values(storeMap)
      .filter((s) => s.count > 0)
      .map((s) => ({ ...s, avgScore: Math.round(s.totalScore / s.count) })),
    rankings: [...staffList].sort((a, b) => b.score - a.score).slice(0, 8),
    weakVocabulary,
    studyTime: [...staffList].sort((a, b) => b.studyMinutes - a.studyMinutes).slice(0, 6),
  };
}
