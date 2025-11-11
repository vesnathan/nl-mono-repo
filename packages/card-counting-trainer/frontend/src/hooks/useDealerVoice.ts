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
  const audioQueuedRef = useRef(false); // Track if we've queued audio for this betting phase

  useEffect(() => {
    // Detect when we enter BETTING phase
    if (phase === "BETTING" && previousPhase.current !== "BETTING") {
      // Reset audio flag when entering BETTING phase
      audioQueuedRef.current = false;
      previousPhase.current = phase;

      // Play "Place your bets" audio (only once)
      if (currentDealer && !audioQueuedRef.current) {
        audioQueuedRef.current = true;
        const audioPath = getDealerAudioPath(currentDealer.id, "place_bets");
        audioQueue.queueAudio({
          id: `dealer-place-bets-${Date.now()}`,
          audioPath,
          priority: AudioPriority.NORMAL,
          playerId: "dealer",
          message: "Place your bets",
        });
      }
    } else if (phase !== "BETTING" && previousPhase.current === "BETTING") {
      // Exiting BETTING phase
      previousPhase.current = phase;
    }
  }, [phase, currentDealer]); // Removed audioQueue from deps - only trigger on phase/dealer change
}
