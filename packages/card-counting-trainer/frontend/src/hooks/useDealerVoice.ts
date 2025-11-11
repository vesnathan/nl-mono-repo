import { useEffect, useRef } from "react";
import { GamePhase } from "@/types/gameState";
import { DealerCharacter } from "@/data/dealerCharacters";
import { AudioQueueHook, AudioPriority } from "@/hooks/useAudioQueue";
import { getDealerAudioPath } from "@/utils/audioHelpers";

interface UseDealerVoiceParams {
  phase: GamePhase;
  currentDealer: DealerCharacter | null;
  audioQueue: AudioQueueHook;
}

/**
 * Hook to handle dealer voice callouts during game phases
 * - "Place your bets" when entering BETTING phase
 */
export function useDealerVoice({
  phase,
  currentDealer,
  audioQueue,
}: UseDealerVoiceParams) {
  const previousPhase = useRef<GamePhase | null>(null);

  useEffect(() => {
    // Detect when we enter BETTING phase
    if (phase === "BETTING" && previousPhase.current !== "BETTING") {
      // Play "Place your bets" audio
      if (currentDealer) {
        const audioPath = getDealerAudioPath(currentDealer.id, "place_bets");
        audioQueue.queueAudio({
          id: `dealer-place-bets-${Date.now()}`,
          audioPath,
          priority: AudioPriority.NORMAL,
          playerId: "dealer",
          message: "Place your bets",
        });
      }
    }

    // Update previous phase
    previousPhase.current = phase;
  }, [phase, currentDealer, audioQueue]);
}
