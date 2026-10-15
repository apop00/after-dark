import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/server/store';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await context.params;
    const url = new URL(req.url);
    const playerId = req.headers.get('x-player-id') || url.searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json(
        { error: 'Header x-player-id o parametro playerId mancante per l\'autenticazione di sessione.' },
        { status: 401 }
      );
    }

    const gameState = serverStore.getGameState(gameId, playerId);

    return NextResponse.json({
      success: true,
      ...gameState,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore nel recupero dello stato di gioco';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
