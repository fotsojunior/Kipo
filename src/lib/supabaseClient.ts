import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const hasValidEnv = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
);

// Instantiate the Supabase client safely with try/catch to protect against invalid credentials
export const supabase: SupabaseClient | null = (() => {
  if (!hasValidEnv || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn('Erreur lors de l’initialisation de Supabase client:', err);
    return null;
  }
})();

export const isSupabaseConfigured: boolean = Boolean(supabase);
