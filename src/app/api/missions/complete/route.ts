import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/server/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, playerMissionId, requesterPlayerId, verifierPlayerId } = body;

    if (!gameId || !playerMissionId || !requesterPlayerId) {
      return NextResponse.json(
        { error: 'Parametri mancanti: gameId, playerMissionId e requesterPlayerId sono richiesti.' },
        { status: 400 }
      );
    }

    const result = serverStore.submitMissionCompletion({
      gameId,
      playerMissionId,
      requesterPlayerId,
      verifierPlayerId,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore nella richiesta di completamento';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
