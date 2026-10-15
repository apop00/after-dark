import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseServiceKey &&
    !supabaseUrl.includes('placeholder') &&
    supabaseUrl.startsWith('https://')
);

/**
 * Client Supabase con privilegi amministrativi / service_role
 * da usare ESCLUSIVAMENTE lato server (Server Actions, Route Handlers)
 * per orchestrazione partita, assegnazione missioni e calcolo punteggi atomici.
 */
export function getServiceSupabase() {
  if (!isServerSupabaseConfigured) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
