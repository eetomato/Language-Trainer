import { useEffect, useState, useCallback } from 'react';
import { calculateEmployeeStats, calculateManagerStats } from '../utils/analytics';
import { supabase } from '../utils/supabaseClient';

const RESULTS_KEY = 'nh_menswear_results';

export function useDashboard(user) {
  // Employee stats — from localStorage (fast, offline-capable)
  const [localResults, setLocalResults] = useState([]);

  // Manager stats — from Supabase
  const [managerData, setManagerData] = useState({ employees: [], mistakes: [], stores: [] });

  // ── Load localStorage results (for employee stats) ────────────
  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem(RESULTS_KEY);
      setLocalResults(saved ? JSON.parse(saved) : []);
    };
    load();
    window.addEventListener('storage', load);
    const timer = window.setInterval(load, 500);
    return () => {
      window.removeEventListener('storage', load);
      window.clearInterval(timer);
    };
  }, []);

  // ── Load Supabase data (for manager stats) ────────────────────
  const loadManagerData = useCallback(async () => {
    if (!supabase || user?.role !== 'manager') return;

    const [{ data: employees }, { data: mistakes }, { data: stores }] = await Promise.all([
      supabase
        .from('employees')
        .select('id, name, store_name, role, results(is_correct, attempted_date)')
        .order('name'),
      supabase
        .from('mistakes')
        .select('wrong_word, frequency')
        .order('frequency', { ascending: false }),
      supabase
        .from('stores')
        .select('name')
        .order('name'),
    ]);

    setManagerData({
      employees: employees || [],
      mistakes: mistakes || [],
      stores: stores || [],
    });
  }, [user?.role]);

  useEffect(() => {
    loadManagerData();
    // Refresh every 30 seconds while manager is viewing
    const timer = window.setInterval(loadManagerData, 30000);
    return () => window.clearInterval(timer);
  }, [loadManagerData]);

  return {
    employeeStats: calculateEmployeeStats(user, localResults),
    managerStats: calculateManagerStats(managerData),
  };
}
