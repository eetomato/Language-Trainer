import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = url && anonKey && !url.includes('your-project-id');

// Log config status in dev to help diagnose issues
if (import.meta.env.DEV) {
  console.log('[Supabase]', isConfigured ? `Connected: ${url}` : 'Not configured — using localStorage fallback');
}

export const supabase = isConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        // 10 second fetch timeout
        fetch: (input, init) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 10000);
          return fetch(input, { ...init, signal: controller.signal })
            .finally(() => clearTimeout(timer));
        },
      },
    })
  : null;
