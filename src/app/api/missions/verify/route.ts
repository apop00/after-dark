import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/server/store';
import { isServerSupabaseConfigured } from '@/lib/supabase/server';
import { supabaseStore } from '@/lib/server/supabaseStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, verificationId, verifierPlayerId, approved, note } = body;

    if (
      !gameId ||
      !verificationId ||
      !verifierPlayerId ||
      approved === undefined
    ) {
      return NextResponse.json(
        {
          error:
            'Parametri mancanti: gameId, verificationId, verifierPlayerId e approved sono richiesti.',
        },
        { status: 400 }
      );
    }

    const payload = {
      gameId,
      verificationId,
      verifierPlayerId,
      approved: Boolean(approved),
      note,
    };

    const isProdDb = isServerSupabaseConfigured && process.env.NODE_ENV !== 'test';
    const result = isProdDb
      ? await supabaseStore.resolveVerification(payload)
      : serverStore.resolveVerification(payload);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Errore nella risoluzione della verifica';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
