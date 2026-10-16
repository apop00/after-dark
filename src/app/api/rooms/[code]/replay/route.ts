import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/server/store';
import { isServerSupabaseConfigured } from '@/lib/supabase/server';
import { supabaseStore } from '@/lib/server/supabaseStore';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const body = await req.json().catch(() => ({}));
    const hostPlayerId =
      body.hostPlayerId || req.headers.get('x-player-id');

    if (!hostPlayerId) {
      return NextResponse.json(
        { error: 'Parametro hostPlayerId mancante per riavviare la lobby.' },
        { status: 400 }
      );
    }

    const isProdDb = isServerSupabaseConfigured && process.env.NODE_ENV !== 'test';
    const { room } = isProdDb
      ? await supabaseStore.resetRoomToLobby(code, hostPlayerId)
      : serverStore.resetRoomToLobby(code, hostPlayerId);

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore nel ripristino della lobby';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
