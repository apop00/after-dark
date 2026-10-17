import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/server/store';
import { isServerSupabaseConfigured } from '@/lib/supabase/server';
import { supabaseStore } from '@/lib/server/supabaseStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, playerMissionId, playerId } = body;

    if (!gameId || !playerMissionId || !playerId) {
      return NextResponse.json(
        {
          error:
            'Parametri mancanti: gameId, playerMissionId e playerId sono richiesti.',
        },
        { status: 400 }
      );
    }

    const payload = {
      gameId,
      playerMissionId,
      playerId,
    };

    const isProdDb = isServerSupabaseConfigured && process.env.NODE_ENV !== 'test';
    const result = isProdDb
      ? await supabaseStore.failMission(payload)
      : serverStore.failMission(payload);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Errore nella dichiarazione di missione fallita';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
