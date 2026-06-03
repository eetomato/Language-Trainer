import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

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
    // No session persistence → always start as logged out, instantly
    setLoading(false);

    if (!supabase) return;

    // Listen for auth state changes (login / logout)
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
          } catch (_) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Login ─────────────────────────────────────────────────────
  const login = async ({ name, password }) => {
    // Dev fallback (no Supabase)
    if (!supabase) {
      const normalized = name.trim().toUpperCase();
      setUser({
        name: normalized,
        storeName: 'GINZA',
        role: normalized === 'MANAGER' ? 'manager' : 'staff',
      });
      return { error: null, firstLogin: false };
    }

    const normalized = name.trim().toUpperCase();

    try {
      // Look up employee record
      const { data: employee, error: lookupError } = await supabase
        .from('employees')
        .select('id, name, store_name, role, auth_id, email')
        .eq('name', normalized)
        .maybeSingle();

      if (lookupError) return { error: 'db_error' };
      if (!employee) return { error: 'not_registered' };
      if (!employee.auth_id) return { error: null, firstLogin: true, employee };

      console.log('[login] signInWithPassword 호출 전', { email: employee.email });
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: employee.email,
        password,
      });
      console.log('[login] signInWithPassword 응답', { data: signInData, error: signInError });

      if (signInError) return { error: 'wrong_password' };

      const authUserId = signInData?.user?.id ?? employee.auth_id;
      console.log('[login] loadProfile 호출 전', { authUserId });
      const profile = await loadProfile(authUserId);
      console.log('[login] loadProfile 응답', { profile });

      if (profile) {
        console.log('[login] setUser 호출 전', { profile });
        setUser({
          id: profile.id,
          name: profile.name,
          storeName: profile.store_name,
          role: profile.role || 'staff',
        });
      }

      return { error: null, firstLogin: false };

    } catch (_) {
      return { error: 'network_error' };
    }
  };

  // ── First login: set password ─────────────────────────────────
  const setupPassword = async ({ employee, password }) => {
    if (!supabase) return { error: 'Supabase not configured' };
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: employee.email,
        password,
      });
      if (signUpError) return { error: signUpError.message };

      const { error: updateError } = await supabase
        .from('employees')
        .update({ auth_id: authData.user.id })
        .eq('id', employee.id);

      if (updateError) return { error: updateError.message };
      return { error: null };
    } catch (e) {
      return { error: e.message };
    }
  };

  // ── Logout ────────────────────────────────────────────────────
  const logout = async () => {
    if (supabase) await supabase.auth.signOut().catch(() => {});
    setUser(null);
  };

  return { user, loading, login, setupPassword, logout };
}
