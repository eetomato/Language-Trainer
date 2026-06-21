import { useEffect, useState, useCallback, useRef } from 'react';
import { calculateEmployeeStats, calculateManagerStats } from '../utils/analytics';
import { supabase } from '../utils/supabaseClient';

const RESULTS_KEY = 'nh_menswear_results';
const SESSIONS_KEY = 'nh_menswear_sessions';

function readLocal() {
  const results = JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]');
  const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
  return { results, sessions };
}

function buildLocalEmployees(localResults, localSessions) {
  const empMap = {};
  localResults.forEach((r) => {
    if (!empMap[r.employeeName]) {
      empMap[r.employeeName] = { name: r.employeeName, store_name: r.storeName || '', role: 'staff', results: [], sessions: [] };
    }
    empMap[r.employeeName].results.push({ is_correct: r.isCorrect });
  });
  localSessions.forEach((s) => {
    if (!empMap[s.employeeName]) {
      empMap[s.employeeName] = { name: s.employeeName, store_name: '', role: 'staff', results: [], sessions: [] };
    }
    empMap[s.employeeName].sessions.push({ study_minutes: s.studyMinutes });
  });
  return Object.values(empMap);
}

function mergeEmployees(supabaseEmps, localEmps) {
  const merged = {};
  supabaseEmps.forEach((emp) => { merged[emp.name] = { ...emp }; });
  localEmps.forEach((emp) => {
    if (merged[emp.name]) {
      // Supabase data takes priority — only use localStorage if Supabase has no records
      merged[emp.name] = {
        ...merged[emp.name],
        results: merged[emp.name].results?.length ? merged[emp.name].results : emp.results,
        sessions: merged[emp.name].sessions?.length ? merged[emp.name].sessions : emp.sessions,
        store_name: merged[emp.name].store_name || emp.store_name,
      };
    } else {
      merged[emp.name] = emp;
    }
  });
  return Object.values(merged);
}

// Supabase rows → stats object
function buildStatsFromSupabase(user, sbResults, sbSessions) {
  const today = new Date().toISOString().slice(0, 10);

  const results = sbResults.map((r) => ({
    employeeName: user.name,
    isCorrect: r.is_correct,
    date: r.attempted_date || r.created_at,
    expectedAnswer: r.expected_answer || '',
  }));

  const sessions = sbSessions.map((s) => ({
    employeeName: user.name,
    studyMinutes: s.study_minutes || 0,
    // sessions table has date (date column) and created_at
    date: s.date || s.created_at,
  }));

  const base = calculateEmployeeStats(user, results, sessions);

  // studyMinutes: Supabase today's sessions
  const sbTodayMinutes = sessions
    .filter((s) => (s.date || '').slice(0, 10) === today)
    .reduce((sum, s) => sum + (s.studyMinutes || 0), 0);

  // Also merge localStorage today's sessions (covers the gap between saveSession and next Supabase poll)
  const { sessions: localSessions } = readLocal();
  const localTodayMinutes = localSessions
    .filter((s) => s.employeeName === user.name && (s.date || '').slice(0, 10) === today)
    .reduce((sum, s) => sum + (s.studyMinutes || 0), 0);

  // Use the higher value (Supabase may already include what's in localStorage)
  const studyMinutes = Math.max(sbTodayMinutes, localTodayMinutes);

  // streak and lastLesson: use all sessions (Supabase + localStorage merged by date)
  const allDates = new Set([
    ...sessions.map((s) => (s.date || '').slice(0, 10)),
    ...localSessions
      .filter((s) => s.employeeName === user.name)
      .map((s) => (s.date || '').slice(0, 10)),
  ]);
  const sortedDates = [...allDates].filter(Boolean).sort().reverse();

  let streak = 0;
  let current = today;
  for (const date of sortedDates) {
    if (date === current) {
      streak++;
      const d = new Date(current);
      d.setDate(d.getDate() - 1);
      current = d.toISOString().slice(0, 10);
    } else if (date < current) {
      break;
    }
  }

  const lastLesson = sortedDates[0]
    ? new Date(sortedDates[0]).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
    : base.lastLesson;

  return { ...base, studyMinutes, streak, lastLesson };
}

export function useDashboard(user) {
  const [employeeStats, setEmployeeStats] = useState(null);
  const [supabaseEmployees, setSupabaseEmployees] = useState([]);
  const [supabaseMistakes, setSupabaseMistakes] = useState([]);
  const [supabaseStores, setSupabaseStores] = useState([]);
  const [localResults, setLocalResults] = useState([]);
  const [localSessions, setLocalSessions] = useState([]);
  const supabaseOk = useRef(false);
  const prevSessionLen = useRef(0);

  // ── localStorage polling (500ms) ────────────────────────────
  useEffect(() => {
    const load = () => {
      const { results, sessions } = readLocal();
      setLocalResults(results);
      setLocalSessions(sessions);
    };
    load();
    window.addEventListener('storage', load);
    const timer = window.setInterval(load, 500);
    return () => {
      window.removeEventListener('storage', load);
      window.clearInterval(timer);
    };
  }, []);

  // ── Employee: Supabase first ────────────────────────────
  const loadEmployeeStats = useCallback(async () => {
    if (!user || user.role === 'manager') return;

    if (!supabase) {
      const { results, sessions } = readLocal();
      setEmployeeStats(calculateEmployeeStats(user, results, sessions));
      return;
    }

    try {
      const { data: empData, error: empErr } = await supabase
        .from('employees')
        .select('id')
        .eq('name', user.name)
        .single();

      if (empErr || !empData) throw new Error('employee not found');
      const empId = empData.id;

      const [{ data: sbResults, error: rErr }, { data: sbSessions, error: sErr }] = await Promise.all([
        supabase
          .from('results')
          .select('is_correct, user_answer, attempted_date, created_at')
          .eq('employee_id', empId),
        supabase
          .from('sessions')
          .select('study_minutes, date, created_at')
          .eq('employee_id', empId),
      ]);

      if (rErr) throw new Error(`results fetch failed: ${rErr.message}`);

      // sessions table might not exist yet — treat as empty rather than failing
      const sessions = sErr ? [] : (sbSessions || []);
      supabaseOk.current = true;
      setEmployeeStats(buildStatsFromSupabase(user, sbResults || [], sessions));
    } catch (e) {
      console.warn('[useDashboard] Supabase stats failed, localStorage fallback:', e.message);
      if (!supabaseOk.current) {
        const { results, sessions } = readLocal();
        setEmployeeStats(calculateEmployeeStats(user, results, sessions));
      }
    }
  }, [user?.name, user?.role]);

  useEffect(() => {
    supabaseOk.current = false;
    loadEmployeeStats();
    const timer = window.setInterval(loadEmployeeStats, 30000);
    return () => window.clearInterval(timer);
  }, [loadEmployeeStats]);

  // Re-fetch immediately when a new session is saved to localStorage
  useEffect(() => {
    const mySessionLen = localSessions.filter((s) => s.employeeName === user?.name).length;
    if (mySessionLen > prevSessionLen.current) {
      prevSessionLen.current = mySessionLen;
      if (user && user.role !== 'manager') loadEmployeeStats();
    }
  }, [localSessions, user?.name, loadEmployeeStats]);

  // ── Manager: Supabase polling (30s) ────────────────────────
  const loadManagerData = useCallback(async () => {
    if (!supabase || user?.role !== 'manager') return;
    try {
      const [
        { data: employees },
        { data: allResults },
        { data: allSessions },
        { data: mistakes },
        { data: stores },
      ] = await Promise.all([
        supabase.from('employees').select('id, name, store_name, role').order('name'),
        supabase.from('results').select('employee_id, is_correct, user_answer, attempted_date, created_at'),
        supabase.from('sessions').select('employee_id, study_minutes, created_at'),
        supabase.from('mistakes').select('wrong_word, frequency').order('frequency', { ascending: false }),
        supabase.from('stores').select('name').order('name'),
      ]);
      if (employees) {
        const enriched = employees.map((emp) => ({
          ...emp,
          results: (allResults || []).filter((r) => r.employee_id === emp.id),
          sessions: (allSessions || []).filter((s) => s.employee_id === emp.id),
        }));
        setSupabaseEmployees(enriched);
      }
      if (mistakes) setSupabaseMistakes(mistakes);
      if (stores) setSupabaseStores(stores);
    } catch (e) {
      console.warn('[useDashboard] Supabase manager load failed:', e.message);
    }
  }, [user?.role]);

  useEffect(() => {
    loadManagerData();
    const timer = window.setInterval(loadManagerData, 30000);
    return () => window.clearInterval(timer);
  }, [loadManagerData]);

  // ── Manager stats ─────────────────────────────────────────────
  const managerNames = new Set(
    supabaseEmployees.filter((e) => e.role === 'manager').map((e) => e.name)
  );
  const localEmps = buildLocalEmployees(localResults, localSessions)
    .filter((emp) => emp.name !== user?.name && !managerNames.has(emp.name));
  const mergedEmployees = mergeEmployees(supabaseEmployees, localEmps);

  const managerStats = calculateManagerStats({
    employees: mergedEmployees,
    mistakes: supabaseMistakes,
    stores: supabaseStores,
  });

  const finalEmployeeStats = employeeStats
    ?? calculateEmployeeStats(user, localResults, localSessions);

  return { employeeStats: finalEmployeeStats, managerStats };
}
