import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

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

export const isSupabaseConfigured = Boolean(
  cleanedUrl &&
    rawKey &&
    rawKey.length > 20 &&
    !cleanedUrl.includes('placeholder')
);

// Safe initialization
function initSupabase() {
  if (!isSupabaseConfigured || !cleanedUrl || !rawKey) {
    return null;
  }
  try {
    return createSupabaseClient(cleanedUrl, rawKey, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (err) {
    console.warn('[Supabase Client] Failed to initialize:', err);
    return null;
  }
}

// Crea il client Supabase singleton per il browser in modo sicuro
export const supabase = initSupabase();
