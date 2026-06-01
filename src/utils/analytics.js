import { seedEmployees } from './sampleData';

export function calculateEmployeeStats(user, results) {
  const personalResults = results.filter((result) => result.employeeName === user?.name);
  const correct = personalResults.filter((result) => result.isCorrect).length;
  const total = personalResults.length;
  const score = total ? Math.round((correct / total) * 100) : 0;
  const mistakes = personalResults
    .filter((result) => !result.isCorrect)
    .reduce((acc, result) => {
      const key = result.expectedAnswer || 'review phrase';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  return {
    score,
    completed: total,
    studyMinutes: Math.max(12, Math.ceil(total * 3)),
    streak: total ? 1 : 0,
    weakVocabulary: Object.entries(mistakes).map(([word, count]) => ({ word, count })),
    lastLesson: total ? 'Today' : 'Not started',
  };
}

export function calculateManagerStats(results) {
  const dynamicEmployees = Object.values(
    results.reduce((acc, result) => {
      acc[result.employeeName] ||= {
        name: result.employeeName,
        storeName: result.storeName,
        score: 0,
        studyMinutes: 0,
        correct: 0,
        total: 0,
      };
      acc[result.employeeName].total += 1;
      acc[result.employeeName].correct += result.isCorrect ? 1 : 0;
      acc[result.employeeName].studyMinutes += 3;
      return acc;
    }, {})
  ).map((employee) => ({
    ...employee,
    score: employee.total ? Math.round((employee.correct / employee.total) * 100) : employee.score,
  }));

  const employees = [...seedEmployees, ...dynamicEmployees];
  const storeMap = employees.reduce((acc, employee) => {
    acc[employee.storeName] ||= { storeName: employee.storeName, totalScore: 0, count: 0 };
    acc[employee.storeName].totalScore += employee.score;
    acc[employee.storeName].count += 1;
    return acc;
  }, {});

  const weakVocabulary = results
    .filter((result) => !result.isCorrect)
    .reduce((acc, result) => {
      const key = result.expectedAnswer || 'oversized';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, { oversized: 12, 'relaxed fit': 8, 'slim fit': 6 });

  return {
    stores: Object.values(storeMap).map((store) => ({
      ...store,
      avgScore: Math.round(store.totalScore / store.count),
    })),
    rankings: employees.sort((a, b) => b.score - a.score).slice(0, 8),
    weakVocabulary: Object.entries(weakVocabulary)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    studyTime: employees.sort((a, b) => b.studyMinutes - a.studyMinutes).slice(0, 6),
  };
}
