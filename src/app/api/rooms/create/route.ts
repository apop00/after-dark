import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/server/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      groupName,
      mode,
      minPlayers,
      maxPlayers,
      durationMinutes,
      allowedDifficulties,
      allowCoop,
      hostPlayerId,
      hostNickname,
      hostAvatar,
    } = body;

    if (!mode || !hostPlayerId) {
      return NextResponse.json(
        { error: 'Parametri obbligatori mancanti (mode, hostPlayerId).' },
        { status: 400 }
      );
    }

    const { room, member } = serverStore.createRoom({
      groupName,
      mode,
      minPlayers: Number(minPlayers) || 3,
      maxPlayers: Number(maxPlayers) || 16,
      durationMinutes: Number(durationMinutes) || 45,
      allowedDifficulties,
      allowCoop: Boolean(allowCoop),
      hostPlayerId,
      hostNickname: hostNickname || 'Host',
      hostAvatar: hostAvatar || 'shadow',
    });

    return NextResponse.json({ success: true, room, member });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore sconosciuto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
