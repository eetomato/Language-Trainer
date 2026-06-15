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
      merged[emp.name] = {
        ...merged[emp.name],
        results: emp.results,
        sessions: emp.sessions,
        store_name: merged[emp.name].store_name || emp.store_name,
      };
    } else {
      merged[emp.name] = emp;
    }
  });
  return Object.values(merged);
}

// Supabase rows → calculateEmployeeStats 形式
function buildStatsFromSupabase(user, sbResults, sbSessions) {
  const results = sbResults.map((r) => ({
    employeeName: user.name,
    isCorrect: r.is_correct,
    date: r.attempted_date || r.created_at,
    expectedAnswer: r.expected_answer || '',
  }));

  const sessions = sbSessions.map((s) => ({
    employeeName: user.name,
    studyMinutes: s.study_minutes || 0,
    date: s.date || s.created_at,
  }));

  return calculateEmployeeStats(user, results, sessions);
}

export function useDashboard(user) {
  const [employeeStats, setEmployeeStats] = useState(null);
  const [supabaseEmployees, setSupabaseEmployees] = useState([]);
  const [supabaseMistakes, setSupabaseMistakes] = useState([]);
  const [supabaseStores, setSupabaseStores] = useState([]);
  // localResults/Sessions only for manager merge + fallback
  const [localResults, setLocalResults] = useState([]);
  const [localSessions, setLocalSessions] = useState([]);
  const supabaseOk = useRef(false); // Supabase 成功したら localに戻さない

  // ── localStorage ポーリング (500ms) — manager merge & fallback 用 ──
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

  // ── Employee: Supabase ファースト ─────────────────────────────
  const loadEmployeeStats = useCallback(async () => {
    if (!user || user.role === 'manager') return;

    // Supabase 接続なし → localStorage fallback
    if (!supabase) {
      const { results, sessions } = readLocal();
      setEmployeeStats(calculateEmployeeStats(user, results, sessions));
      return;
    }

    try {
      // 1. name → employee id
      const { data: empData, error: empErr } = await supabase
        .from('employees')
        .select('id')
        .eq('name', user.name)
        .single();

      if (empErr || !empData) throw new Error('employee not found');

      const empId = empData.id;

      // 2. results + sessions 並列取得
      const [{ data: sbResults, error: rErr }, { data: sbSessions, error: sErr }] = await Promise.all([
        supabase
          .from('results')
          .select('is_correct, expected_answer, attempted_date, created_at')
          .eq('employee_id', empId),
        supabase
          .from('sessions')
          .select('study_minutes, date, created_at')
          .eq('employee_id', empId),
      ]);

      if (rErr || sErr) throw new Error('results/sessions fetch failed');

      supabaseOk.current = true;
      setEmployeeStats(buildStatsFromSupabase(user, sbResults || [], sbSessions || []));
    } catch (e) {
      console.warn('[useDashboard] Supabase employee stats 失敗, localStorage fallback', e.message);
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

  // ── Manager: Supabase ポーリング (30秒) ──────────────────────
  const loadManagerData = useCallback(async () => {
    if (!supabase || user?.role !== 'manager') return;
    try {
      const [{ data: employees }, { data: mistakes }, { data: stores }] = await Promise.all([
        supabase
          .from('employees')
          .select(`id, name, store_name, role, results(is_correct, created_at), sessions(study_minutes, created_at)`)
          .order('name'),
        supabase
          .from('mistakes')
          .select('wrong_word, frequency')
          .order('frequency', { ascending: false }),
        supabase.from('stores').select('name').order('name'),
      ]);
      if (employees) setSupabaseEmployees(employees);
      if (mistakes) setSupabaseMistakes(mistakes);
      if (stores) setSupabaseStores(stores);
    } catch (e) {
      console.warn('[useDashboard] Supabase manager load 失敗', e.message);
    }
  }, [user?.role]);

  useEffect(() => {
    loadManagerData();
    const timer = window.setInterval(loadManagerData, 30000);
    return () => window.clearInterval(timer);
  }, [loadManagerData]);

  // ── Manager stats: Supabase + localStorage 結合 ───────────────
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

  // null の間は localStorage で即時表示
  const finalEmployeeStats = employeeStats
    ?? calculateEmployeeStats(user, localResults, localSessions);

  return { employeeStats: finalEmployeeStats, managerStats };
}
