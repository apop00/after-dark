import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/server/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, verificationId, verifierPlayerId, approved, note } = body;

    if (!gameId || !verificationId || !verifierPlayerId || approved === undefined) {
      return NextResponse.json(
        { error: 'Parametri mancanti: gameId, verificationId, verifierPlayerId e approved sono richiesti.' },
        { status: 400 }
      );
    }

    const result = serverStore.resolveVerification({
      gameId,
      verificationId,
      verifierPlayerId,
      approved: Boolean(approved),
      note,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore nella risoluzione della verifica';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
