import { NextResponse } from 'next/server';
import { serverStore } from '@/lib/server/store';
import { isServerSupabaseConfigured } from '@/lib/supabase/server';
import { supabaseStore } from '@/lib/server/supabaseStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isProdDb = isServerSupabaseConfigured && process.env.NODE_ENV !== 'test';
    const rooms = isProdDb
      ? await supabaseStore.getPublicRooms()
      : serverStore.getPublicRooms();

    return NextResponse.json({
      success: true,
      rooms,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore nel recupero delle lobby pubbliche';
    return NextResponse.json({ error: message, rooms: [] }, { status: 500 });
  }
}
