import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const AUTH_KEY = 'nh_menswear_user';

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const login = async (profile) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(profile));
    setUser(profile);

    if (supabase && profile.role === 'staff') {
      await supabase.from('employees').upsert(
        {
          name: profile.name,
          store_name: profile.storeName,
        },
        { onConflict: 'name' }
      );
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  return { user, login, logout };
}
