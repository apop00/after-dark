import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/server/store';
import { isServerSupabaseConfigured } from '@/lib/supabase/server';
import { supabaseStore } from '@/lib/server/supabaseStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, type, title, description, multiplier, durationMinutes } =
      body;

    if (!gameId || !type || !title) {
      return NextResponse.json(
        { error: 'Parametri mancanti: gameId, type e title sono richiesti.' },
        { status: 400 }
      );
    }

    const payload = {
      gameId,
      type,
      title,
      description: description || 'Nuovo evento speciale attivo!',
      multiplier: Number(multiplier) || 1.5,
      durationMinutes: Number(durationMinutes) || 5,
    };

    const isProdDb = isServerSupabaseConfigured && process.env.NODE_ENV !== 'test';
    const event = isProdDb
      ? await supabaseStore.triggerEvent(payload)
      : serverStore.triggerEvent(payload);

    return NextResponse.json({ success: true, event });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Errore nel lancio dell'evento";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
