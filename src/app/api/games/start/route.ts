import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/server/store';
import { isServerSupabaseConfigured } from '@/lib/supabase/server';
import { supabaseStore } from '@/lib/server/supabaseStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomCode, hostPlayerId } = body;

    if (!roomCode || !hostPlayerId) {
      return NextResponse.json(
        { error: 'Parametri mancanti: roomCode e hostPlayerId sono richiesti.' },
        { status: 400 }
      );
    }

    const payload = { roomCode, hostPlayerId };
    const isProdDb = isServerSupabaseConfigured && process.env.NODE_ENV !== 'test';
    const { game, missionsAssignedCount } = isProdDb
      ? await supabaseStore.startGame(payload)
      : serverStore.startGame(payload);

    return NextResponse.json({
      success: true,
      game,
      missionsAssignedCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Impossibile avviare la partita';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
