import { useEffect, useState } from 'react';
import { calculateEmployeeStats, calculateManagerStats } from '../utils/analytics';

const RESULTS_KEY = 'nh_menswear_results';

export function useDashboard(user) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const loadResults = () => {
      const saved = localStorage.getItem(RESULTS_KEY);
      setResults(saved ? JSON.parse(saved) : []);
    };
    loadResults();
    window.addEventListener('storage', loadResults);
    const timer = window.setInterval(loadResults, 500);
    return () => {
      window.removeEventListener('storage', loadResults);
      window.clearInterval(timer);
    };
  }, []);

  return {
    employeeStats: calculateEmployeeStats(user, results),
    managerStats: calculateManagerStats(results),
  };
}
