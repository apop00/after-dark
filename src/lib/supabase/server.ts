import { createClient } from '@supabase/supabase-js';

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const rawKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
).trim();

function cleanSupabaseUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    if (!parsed.protocol.startsWith('http')) return null;
    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) return null;
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

const cleanedUrl = cleanSupabaseUrl(rawUrl);

export const isServerSupabaseConfigured = Boolean(
  cleanedUrl &&
    rawKey &&
    rawKey.length > 20 &&
    !cleanedUrl.includes('placeholder')
);

/**
 * Client Supabase con privilegi amministrativi / service_role
 * da usare ESCLUSIVAMENTE lato server (Server Actions, Route Handlers)
 * per orchestrazione partita, assegnazione missioni e calcolo punteggi atomici.
 */
export function getServiceSupabase() {
  if (!isServerSupabaseConfigured || !cleanedUrl || !rawKey) {
    return null;
  }

  try {
    return createClient(cleanedUrl, rawKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (err) {
    console.warn('[Supabase Server] Failed to initialize:', err);
    return null;
  }
}
