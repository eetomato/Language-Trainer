import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const LOCAL_KEY = 'nh_menswear_user';

async function loadProfile(authId) {
  const { data } = await supabase
    .from('employees')
    .select('id, name, store_name, role')
    .eq('auth_id', authId)
    .maybeSingle();
  return data;
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dev fallback: no Supabase configured
    if (!supabase) {
      const saved = localStorage.getItem(LOCAL_KEY);
      if (saved) setUser(JSON.parse(saved));
      setLoading(false);
      return;
    }

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id);
        if (profile) {
          setUser({
            id: profile.id,
            name: profile.name,
            storeName: profile.store_name,
            role: profile.role || 'staff',
          });
        }
      }
      setLoading(false);
    });

    // Listen for auth state changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await loadProfile(session.user.id);
          if (profile) {
            setUser({
              id: profile.id,
              name: profile.name,
              storeName: profile.store_name,
              role: profile.role || 'staff',
            });
          }
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Dev fallback login (no Supabase) ──────────────────────────────
  const devLogin = (name) => {
    const profile = {
      name: name.toUpperCase(),
      storeName: 'GINZA',
      role: name.toUpperCase() === 'MANAGER' ? 'manager' : 'staff',
    };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(profile));
    setUser(profile);
  };

  // ── Step 1: login with name + password ────────────────────────────
  // Returns: { error: null|string, firstLogin: bool, employee: obj|null }
  const login = async ({ name, password }) => {
    if (!supabase) {
      devLogin(name);
      return { error: null, firstLogin: false };
    }

    const normalized = name.trim().toUpperCase();

    // Look up employee record (unauthenticated read allowed by RLS)
    const { data: employee } = await supabase
      .from('employees')
      .select('id, name, store_name, role, auth_id, email')
      .eq('name', normalized)
      .maybeSingle();

    if (!employee) return { error: 'not_registered' };

    // First login: no auth account linked yet
    if (!employee.auth_id) {
      return { error: null, firstLogin: true, employee };
    }

    // Normal login
    const email = employee.email;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: 'wrong_password' };
    return { error: null, firstLogin: false };
  };

  // ── Step 2 (first login only): set password & create auth account ─
  const setupPassword = async ({ employee, password }) => {
    if (!supabase) return { error: 'Supabase not configured' };

    const email = employee.email;

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) return { error: signUpError.message };

    // Link auth.uid to employee record
    const { error: updateError } = await supabase
      .from('employees')
      .update({ auth_id: authData.user.id })
      .eq('id', employee.id);

    if (updateError) return { error: updateError.message };
    return { error: null };
  };

  // ── Logout ────────────────────────────────────────────────────────
  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem(LOCAL_KEY);
    setUser(null);
  };

  return { user, loading, login, setupPassword, logout };
}
