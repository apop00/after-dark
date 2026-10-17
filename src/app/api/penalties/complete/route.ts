import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/server/store';
import { isServerSupabaseConfigured } from '@/lib/supabase/server';
import { supabaseStore } from '@/lib/server/supabaseStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, playerId } = body;

    if (!gameId || !playerId) {
      return NextResponse.json(
        { error: 'Parametri mancanti: gameId e playerId sono obbligatori.' },
        { status: 400 }
      );
    }

    const isProdDb = isServerSupabaseConfigured && process.env.NODE_ENV !== 'test';
    const result = isProdDb
      ? await supabaseStore.completePenalty({ gameId, playerId })
      : serverStore.completePenalty({ gameId, playerId });

    return NextResponse.json({ success: true, penalty: result.penalty });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Impossibile completare la penitenza';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
