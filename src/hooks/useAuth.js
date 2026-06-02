import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const LOCAL_KEY = 'nh_menswear_user';

// Wraps any promise with a timeout
function withTimeout(promise, ms = 7000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ]);
}

async function loadProfile(authId) {
  const { data } = await withTimeout(
    supabase
      .from('employees')
      .select('id, name, store_name, role')
      .eq('auth_id', authId)
      .maybeSingle()
  );
  return data;
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety net: loading never freezes beyond 5 seconds
    const safetyTimer = setTimeout(() => setLoading(false), 5000);

    // Dev fallback: no Supabase configured
    if (!supabase) {
      const saved = localStorage.getItem(LOCAL_KEY);
      if (saved) setUser(JSON.parse(saved));
      setLoading(false);
      clearTimeout(safetyTimer);
      return () => clearTimeout(safetyTimer);
    }

    // Check existing session
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          try {
            const profile = await loadProfile(session.user.id);
            if (profile) {
              setUser({
                id: profile.id,
                name: profile.name,
                storeName: profile.store_name,
                role: profile.role || 'staff',
              });
            }
          } catch (_) { /* profile load failed */ }
        }
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(safetyTimer);
        setLoading(false);
      });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          try {
            const profile = await loadProfile(session.user.id);
            if (profile) {
              setUser({
                id: profile.id,
                name: profile.name,
                storeName: profile.store_name,
                role: profile.role || 'staff',
              });
            }
          } catch (_) {}
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const devLogin = (name) => {
    const profile = {
      name: name.toUpperCase(),
      storeName: 'GINZA',
      role: name.toUpperCase() === 'MANAGER' ? 'manager' : 'staff',
    };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(profile));
    setUser(profile);
  };

  // ── Login ─────────────────────────────────────────────────────────
  const login = async ({ name, password }) => {
    if (!supabase) {
      devLogin(name);
      return { error: null, firstLogin: false };
    }

    const normalized = name.trim().toUpperCase();

    try {
      // Look up employee (timeout 7s)
      const { data: employee, error: lookupError } = await withTimeout(
        supabase
          .from('employees')
          .select('id, name, store_name, role, auth_id, email')
          .eq('name', normalized)
          .maybeSingle()
      );

      if (lookupError || employee === undefined) return { error: 'db_error' };
      if (!employee) return { error: 'not_registered' };
      if (!employee.auth_id) return { error: null, firstLogin: true, employee };

      const { error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({ email: employee.email, password })
      );

      if (signInError) return { error: 'wrong_password' };
      return { error: null, firstLogin: false };

    } catch (e) {
      // Timeout or network error → fall back to dev login
      if (e.message === 'timeout') return { error: 'timeout' };
      return { error: 'network_error' };
    }
  };

  // ── First login: set password ─────────────────────────────────────
  const setupPassword = async ({ employee, password }) => {
    if (!supabase) return { error: 'Supabase not configured' };

    try {
      const { data: authData, error: signUpError } = await withTimeout(
        supabase.auth.signUp({ email: employee.email, password })
      );
      if (signUpError) return { error: signUpError.message };

      const { error: updateError } = await withTimeout(
        supabase
          .from('employees')
          .update({ auth_id: authData.user.id })
          .eq('id', employee.id)
      );
      if (updateError) return { error: updateError.message };
      return { error: null };

    } catch (e) {
      return { error: e.message === 'timeout' ? 'Connection timeout. Try again.' : e.message };
    }
  };

  // ── Logout ────────────────────────────────────────────────────────
  const logout = async () => {
    if (supabase) await supabase.auth.signOut().catch(() => {});
    localStorage.removeItem(LOCAL_KEY);
    setUser(null);
  };

  return { user, loading, login, setupPassword, logout };
}
