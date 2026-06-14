import { useEffect, useState, useCallback } from 'react';
import { calculateEmployeeStats, calculateManagerStats } from '../utils/analytics';
import { supabase } from '../utils/supabaseClient';

const RESULTS_KEY = 'nh_menswear_results';
const SESSIONS_KEY = 'nh_menswear_sessions';

function buildLocalEmployees(localResults, localSessions) {
  const empMap = {};

  localResults.forEach((r) => {
    if (!empMap[r.employeeName]) {
      empMap[r.employeeName] = {
        name: r.employeeName,
        store_name: r.storeName || '',
        role: 'staff',
        results: [],
        sessions: [],
      };
    }
    empMap[r.employeeName].results.push({ is_correct: r.isCorrect });
  });

  localSessions.forEach((s) => {
    if (!empMap[s.employeeName]) {
      empMap[s.employeeName] = {
        name: s.employeeName,
        store_name: '',
        role: 'staff',
        results: [],
        sessions: [],
      };
    }
    empMap[s.employeeName].sessions.push({ study_minutes: s.studyMinutes });
  });

  return Object.values(empMap);
}

function mergeEmployees(supabaseEmps, localEmps) {
  const merged = {};

  supabaseEmps.forEach((emp) => {
    merged[emp.name] = { ...emp };
  });

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

// Supabase results/sessions → calculateEmployeeStats 형식으로 변환
function buildEmployeeStatsFromSupabase(user, sbResults, sbSessions) {
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
  const [localResults, setLocalResults] = useState([]);
  const [localSessions, setLocalSessions] = useState([]);
  const [supabaseEmployees, setSupabaseEmployees] = useState([]);
  const [supabaseMistakes, setSupabaseMistakes] = useState([]);
  const [supabaseStores, setSupabaseStores] = useState([]);
  const [employeeStats, setEmployeeStats] = useState(null);

  // ── localStorage 실시간 폴링 (500ms) ──────────────────────
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

  // ── Employee: Supabase 기반 통계 로드 ─────────────────────
  const loadEmployeeStats = useCallback(async () => {
    if (!supabase || !user || user.role === 'manager') return;

    try {
      // 1. name → employee id 조회
      const { data: empData, error: empErr } = await supabase
        .from('employees')
        .select('id')
        .eq('name', user.name)
        .single();

      if (empErr || !empData) throw new Error('employee not found');

      const empId = empData.id;

      // 2. results + sessions 병렬 조회
      const [{ data: sbResults }, { data: sbSessions }] = await Promise.all([
        supabase
          .from('results')
          .select('is_correct, expected_answer, attempted_date, created_at')
          .eq('employee_id', empId),
        supabase
          .from('sessions')
          .select('study_minutes, date, created_at')
          .eq('employee_id', empId),
      ]);

      setEmployeeStats(
        buildEmployeeStatsFromSupabase(user, sbResults || [], sbSessions || [])
      );
    } catch (e) {
      console.warn('[useDashboard] Supabase employee stats 실패, localStorage fallback', e.message);
      // fallback: localStorage
      setEmployeeStats(calculateEmployeeStats(user, localResults, localSessions));
    }
  }, [user?.name, user?.role]);

  useEffect(() => {
    loadEmployeeStats();
    const timer = window.setInterval(loadEmployeeStats, 30000);
    return () => window.clearInterval(timer);
  }, [loadEmployeeStats]);

  // localStorage 변경 시 employee stats 재계산 (Supabase 실패 대비)
  useEffect(() => {
    if (employeeStats === null && user && user.role !== 'manager') {
      setEmployeeStats(calculateEmployeeStats(user, localResults, localSessions));
    }
  }, [localResults, localSessions]);

  // ── Manager: Supabase 폴링 (30초) ─────────────────────────
  const loadManagerData = useCallback(async () => {
    if (!supabase || user?.role !== 'manager') return;
    try {
      const [{ data: employees }, { data: mistakes }, { data: stores }] = await Promise.all([
        supabase
          .from('employees')
          .select(`
            id, name, store_name, role,
            results(is_correct, created_at),
            sessions(study_minutes, created_at)
          `)
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
      console.warn('[useDashboard] Supabase 매니저 로드 실패', e.message);
    }
  }, [user?.role]);

  useEffect(() => {
    loadManagerData();
    const timer = window.setInterval(loadManagerData, 30000);
    return () => window.clearInterval(timer);
  }, [loadManagerData]);

  // ── 매니저 통계: localStorage + Supabase 병합 ─────────────
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

  // employeeStats가 아직 null이면 localStorage로 즉시 계산해서 반환
  const finalEmployeeStats = employeeStats
    ?? calculateEmployeeStats(user, localResults, localSessions);

  return {
    employeeStats: finalEmployeeStats,
    managerStats,
  };
}
