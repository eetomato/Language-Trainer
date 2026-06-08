import { useEffect, useState, useCallback } from 'react';
import { calculateEmployeeStats, calculateManagerStats } from '../utils/analytics';
import { supabase } from '../utils/supabaseClient';

const RESULTS_KEY = 'nh_menswear_results';
const SESSIONS_KEY = 'nh_menswear_sessions';

// localStorage 데이터를 calculateManagerStats 형식으로 변환
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

// Supabase + localStorage 직원 데이터 병합
// localStorage 우선 (더 빠름), Supabase에 없는 직원도 포함
function mergeEmployees(supabaseEmps, localEmps) {
  const merged = {};

  // Supabase 데이터 기준으로 먼저 채움
  supabaseEmps.forEach((emp) => {
    merged[emp.name] = { ...emp };
  });

  // localStorage 데이터로 덮어쓰기/추가 (더 최신)
  localEmps.forEach((emp) => {
    if (merged[emp.name]) {
      // 기존 Supabase 데이터에 localStorage 데이터 합산
      merged[emp.name] = {
        ...merged[emp.name],
        results: emp.results,   // localStorage가 더 최신
        sessions: emp.sessions,
        store_name: merged[emp.name].store_name || emp.store_name,
      };
    } else {
      merged[emp.name] = emp;
    }
  });

  return Object.values(merged);
}

export function useDashboard(user) {
  const [localResults, setLocalResults] = useState([]);
  const [localSessions, setLocalSessions] = useState([]);
  const [supabaseEmployees, setSupabaseEmployees] = useState([]);
  const [supabaseMistakes, setSupabaseMistakes] = useState([]);
  const [supabaseStores, setSupabaseStores] = useState([]);

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

  // ── Supabase 폴링 (30초) ──────────────────────────────────
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
      console.warn('[useDashboard] Supabase 로드 실패', e.message);
    }
  }, [user?.role]);

  useEffect(() => {
    loadManagerData();
    const timer = window.setInterval(loadManagerData, 30000);
    return () => window.clearInterval(timer);
  }, [loadManagerData]);

  // ── 매니저 통계: localStorage + Supabase 병합 ─────────────
  // Supabase에서 매니저 role인 이름 목록 수집
  const managerNames = new Set(
    supabaseEmployees
      .filter((e) => e.role === 'manager')
      .map((e) => e.name)
  );
  // 현재 로그인한 사용자 + Supabase 매니저 제외
  const localEmps = buildLocalEmployees(localResults, localSessions)
    .filter((emp) => emp.name !== user?.name && !managerNames.has(emp.name));
  const mergedEmployees = mergeEmployees(supabaseEmployees, localEmps);

  const managerStats = calculateManagerStats({
    employees: mergedEmployees,
    mistakes: supabaseMistakes,
    stores: supabaseStores,
  });

  return {
    employeeStats: calculateEmployeeStats(user, localResults, localSessions),
    managerStats,
  };
}
