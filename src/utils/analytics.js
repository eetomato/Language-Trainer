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
    streak: (() => {
      if (!personalSessions.length) return 0;
      const dates = [...new Set(
        personalSessions.map((s) => s.date?.slice(0, 10)).filter(Boolean)
      )].sort().reverse();

      let count = 0;
      let current = new Date().toISOString().slice(0, 10);

      for (const date of dates) {
        if (date === current) {
          count++;
          const d = new Date(current);
          d.setDate(d.getDate() - 1);
          current = d.toISOString().slice(0, 10);
        } else {
          break;
        }
      }
      return count;
    })(),
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

  // Weekly test results: most recent test per employee within last 21 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 21);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const empLatestTest = {};
  employees
    .forEach((emp) => {
      const testRows = (emp.results || [])
        .filter((r) => r.user_answer?.startsWith('test1:'))
        .filter((r) => (r.attempted_date || r.created_at || '').slice(0, 10) >= cutoffStr)
        .sort((a, b) => {
          const da = (a.attempted_date || a.created_at || '').slice(0, 10);
          const db = (b.attempted_date || b.created_at || '').slice(0, 10);
          return db.localeCompare(da);
        });
      if (testRows.length > 0) empLatestTest[emp.name] = testRows[0];
    });

  const weeklyTestResults = employees
    .map((emp) => {
      const r = empLatestTest[emp.name];
      return {
        name: emp.name,
        completed: !!r,
        userAnswer: r?.user_answer || '',
        isPassed: r?.is_correct || false,
        date: r ? (r.attempted_date || r.created_at || '').slice(0, 10) : null,
      };
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return b.completed - a.completed;
      return a.name.localeCompare(b.name);
    });

  return {
    stores: Object.values(storeMap)
      .filter((s) => s.count > 0)
      .map((s) => ({ ...s, avgScore: Math.round(s.totalScore / s.count) })),
    rankings: [...staffList].sort((a, b) => b.score - a.score).slice(0, 8),
    weakVocabulary,
    studyTime: [...staffList].sort((a, b) => b.studyMinutes - a.studyMinutes).slice(0, 6),
    weeklyTestResults,
  };
}
