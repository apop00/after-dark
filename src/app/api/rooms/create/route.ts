import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/server/store';
import { isServerSupabaseConfigured } from '@/lib/supabase/server';
import { supabaseStore } from '@/lib/server/supabaseStore';

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
      requireWitness,
      enableGenderMissions,
      includeJeffreyPack,
      hostPlayerId,
      hostNickname,
      hostAvatar,
      hostGender,
      missionsPerPlayer,
      isPublic,
      hideTasks,
      progressionMode,
      scoringMode,
      missionDistribution,
      maxSkipsPerPlayer,
      skipDifficultyRule,
      penaltyProbability,
    } = body;

    if (!mode || !hostPlayerId) {
      return NextResponse.json(
        { error: 'Parametri obbligatori mancanti (mode, hostPlayerId).' },
        { status: 400 }
      );
    }

    const payload = {
      groupName,
      mode,
      minPlayers: Number(minPlayers) || 3,
      maxPlayers: Number(maxPlayers) || 16,
      durationMinutes: typeof durationMinutes !== 'undefined' ? Number(durationMinutes) : 45,
      missionsPerPlayer: Number(missionsPerPlayer) || 3,
      allowedDifficulties,
      allowCoop: Boolean(allowCoop),
      requireWitness: Boolean(requireWitness),
      enableGenderMissions: Boolean(enableGenderMissions),
      includeJeffreyPack: mode === 'jeffrey_island' || Boolean(includeJeffreyPack),
      isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
      hideTasks: hideTasks !== undefined ? Boolean(hideTasks) : true,
      progressionMode: progressionMode || 'free',
      scoringMode: scoringMode || 'points',
      missionDistribution: missionDistribution || 'fair',
      maxSkipsPerPlayer: maxSkipsPerPlayer !== undefined ? Number(maxSkipsPerPlayer) : 1,
      skipDifficultyRule: skipDifficultyRule || 'same',
      penaltyProbability: penaltyProbability !== undefined ? Number(penaltyProbability) : 0,
      hostPlayerId,
      hostNickname: hostNickname || 'Host',
      hostAvatar: hostAvatar || 'shadow',
      hostGender: hostGender || 'neutro',
    };

    const isProdDb = isServerSupabaseConfigured && process.env.NODE_ENV !== 'test';
    const { room, member } = isProdDb
      ? await supabaseStore.createRoom(payload)
      : serverStore.createRoom(payload);

    return NextResponse.json({ success: true, room, member });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore sconosciuto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
