// Employee stats — calculated from localStorage results
export function calculateEmployeeStats(user, results) {
  const personal = results.filter((r) => r.employeeName === user?.name);
  const correct = personal.filter((r) => r.isCorrect).length;
  const total = personal.length;
  const score = total ? Math.round((correct / total) * 100) : 0;

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
    studyMinutes: Math.max(0, Math.ceil(total * 3)),
    streak: total ? 1 : 0,
    weakVocabulary: Object.entries(mistakes).map(([word, count]) => ({ word, count })),
    lastLesson: total ? 'Today' : 'Not started',
  };
}

// Manager stats — calculated from real Supabase data
// employees: [{ name, store_name, results: [{ is_correct }] }]
// mistakes:  [{ wrong_word, frequency }]
export function calculateManagerStats({ employees = [], mistakes = [], stores = [] }) {
  // Build per-employee stats
  const staffList = employees
    .filter((e) => e.role !== 'manager')
    .map((emp) => {
      const res = emp.results || [];
      const total = res.length;
      const correct = res.filter((r) => r.is_correct).length;
      return {
        name: emp.name,
        storeName: emp.store_name,
        score: total ? Math.round((correct / total) * 100) : 0,
        studyMinutes: Math.ceil(total * 3),
        total,
      };
    });

  // Store comparison
  const storeMap = {};
  // Seed stores so even empty stores show up
  stores.forEach((s) => {
    storeMap[s.name] = { storeName: s.name, totalScore: 0, count: 0 };
  });
  staffList.forEach((emp) => {
    const key = emp.storeName;
    storeMap[key] ||= { storeName: key, totalScore: 0, count: 0 };
    storeMap[key].totalScore += emp.score;
    storeMap[key].count += 1;
  });

  // Weak vocabulary from mistakes table
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
