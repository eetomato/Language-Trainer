import { useEffect, useState, useCallback } from 'react';
import { calculateEmployeeStats, calculateManagerStats } from '../utils/analytics';
import { supabase } from '../utils/supabaseClient';

const RESULTS_KEY = 'nh_menswear_results';
const SESSIONS_KEY = 'nh_menswear_sessions';

export function useDashboard(user) {
  const [localResults, setLocalResults] = useState([]);
  const [localSessions, setLocalSessions] = useState([]);
  const [managerData, setManagerData] = useState({ employees: [], mistakes: [], stores: [] });

  useEffect(() => {
    const load = () => {
      const results = localStorage.getItem(RESULTS_KEY);
      const sessions = localStorage.getItem(SESSIONS_KEY);
      setLocalResults(results ? JSON.parse(results) : []);
      setLocalSessions(sessions ? JSON.parse(sessions) : []);
    };
    load();
    window.addEventListener('storage', load);
    const timer = window.setInterval(load, 500);
    return () => {
      window.removeEventListener('storage', load);
      window.clearInterval(timer);
    };
  }, []);

  const loadManagerData = useCallback(async () => {
    if (!supabase || user?.role !== 'manager') return;
    try {
      const [{ data: employees }, { data: mistakes }, { data: stores }] = await Promise.all([
        supabase
          .from('employees')
          .select(`
            id, name, store_name, role,
            results(is_correct, attempted_date),
            sessions(study_minutes, date)
          `)
          .order('name'),
        supabase
          .from('mistakes')
          .select('wrong_word, frequency')
          .order('frequency', { ascending: false }),
        supabase.from('stores').select('name').order('name'),
      ]);
      setManagerData({
        employees: employees || [],
        mistakes: mistakes || [],
        stores: stores || [],
      });
    } catch (e) {
      console.warn('[useDashboard] 매니저 데이터 로드 실패', e.message);
    }
  }, [user?.role]);

  useEffect(() => {
    loadManagerData();
    const timer = window.setInterval(loadManagerData, 30000);
    return () => window.clearInterval(timer);
  }, [loadManagerData]);

  return {
    employeeStats: calculateEmployeeStats(user, localResults, localSessions),
    managerStats: calculateManagerStats(managerData),
  };
}
