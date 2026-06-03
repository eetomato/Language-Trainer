import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isConfigured = url && anonKey && !url.includes('your-project-id');

export const supabase = isConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: false,   // ← always show login on app start
        autoRefreshToken: false, // ← no background token refresh calls
      },
      global: {
        fetch: (input, init) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 10000);
          return fetch(input, { ...init, signal: controller.signal })
            .finally(() => clearTimeout(timer));
        },
      },
    })
  : null;
