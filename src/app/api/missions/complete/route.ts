import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/server/store';
import { isServerSupabaseConfigured } from '@/lib/supabase/server';
import { supabaseStore } from '@/lib/server/supabaseStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, playerMissionId, requesterPlayerId, verifierPlayerId, isDoublePoints } =
      body;

    if (!gameId || !playerMissionId || !requesterPlayerId) {
      return NextResponse.json(
        {
          error:
            'Parametri mancanti: gameId, playerMissionId e requesterPlayerId sono richiesti.',
        },
        { status: 400 }
      );
    }

    const payload = {
      gameId,
      playerMissionId,
      requesterPlayerId,
      verifierPlayerId,
      isDoublePoints: Boolean(isDoublePoints),
    };

    const isProdDb = isServerSupabaseConfigured && process.env.NODE_ENV !== 'test';
    const result = isProdDb
      ? await supabaseStore.submitMissionCompletion(payload)
      : serverStore.submitMissionCompletion(payload);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Errore nella richiesta di completamento';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
