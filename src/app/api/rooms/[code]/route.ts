import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/server/store';
import { isServerSupabaseConfigured } from '@/lib/supabase/server';
import { supabaseStore } from '@/lib/server/supabaseStore';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const isProdDb = isServerSupabaseConfigured && process.env.NODE_ENV !== 'test';

    const { room, members, isExpired } = isProdDb
      ? await supabaseStore.getRoomByCode(code)
      : serverStore.getRoomByCode(code);

    if (!room) {
      return NextResponse.json({ error: 'Stanza non trovata' }, { status: 404 });
    }

    const game = isProdDb
      ? await supabaseStore.getGameByRoomId(room.id)
      : serverStore.getGameByRoomId(room.id);

    return NextResponse.json({
      success: true,
      room,
      members,
      isExpired: Boolean(isExpired),
      gameId: (game && (game.status === 'active' || room.status === 'playing')) ? game.id : null,
      gameStatus: (game && (game.status === 'active' || room.status === 'playing')) ? game.status : null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore nel recupero della stanza';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const body = await req.json();
    const {
      hostPlayerId,
      missionsPerPlayer,
      hideTasks,
      progressionMode,
      scoringMode,
      missionDistribution,
      maxSkipsPerPlayer,
      skipDifficultyRule,
    } = body;

    if (!hostPlayerId) {
      return NextResponse.json({ error: 'hostPlayerId obbligatorio' }, { status: 400 });
    }

    const isProdDb = isServerSupabaseConfigured && process.env.NODE_ENV !== 'test';
    const params = {
      code,
      hostPlayerId,
      missionsPerPlayer: missionsPerPlayer !== undefined ? Number(missionsPerPlayer) : undefined,
      hideTasks: hideTasks !== undefined ? Boolean(hideTasks) : undefined,
      progressionMode,
      scoringMode,
      missionDistribution,
      maxSkipsPerPlayer: maxSkipsPerPlayer !== undefined ? Number(maxSkipsPerPlayer) : undefined,
      skipDifficultyRule,
    };

    const updatedRoom = isProdDb
      ? await supabaseStore.updateRoomSettings(params)
      : serverStore.updateRoomSettings(params);

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore nell\'aggiornamento';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
