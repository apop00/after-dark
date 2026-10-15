import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/server/store';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const { room, members } = serverStore.getRoomByCode(code);

    if (!room) {
      return NextResponse.json({ error: 'Stanza non trovata' }, { status: 404 });
    }

    const game = serverStore.getGameByRoomId(room.id);

    return NextResponse.json({
      success: true,
      room,
      members,
      gameId: game ? game.id : null,
      gameStatus: game ? game.status : null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore nel recupero della stanza';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
