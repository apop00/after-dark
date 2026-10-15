import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/server/store';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await context.params;
    const result = serverStore.finishGame(gameId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore nella conclusione della partita';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
