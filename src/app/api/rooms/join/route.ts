import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/server/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, playerId, nickname, avatarSeed } = body;

    if (!code || !playerId || !nickname) {
      return NextResponse.json(
        { error: 'Codice stanza, ID giocatore e nickname sono obbligatori.' },
        { status: 400 }
      );
    }

    const { room, member } = serverStore.joinRoom({
      code,
      playerId,
      nickname,
      avatarSeed: avatarSeed || 'ghost',
    });

    return NextResponse.json({ success: true, room, member });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Impossibile entrare nella stanza';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
