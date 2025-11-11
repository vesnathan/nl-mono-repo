import { useEffect, useRef } from "react";
import { GamePhase } from "@/types/gameState";
import { DealerCharacter } from "@/data/dealerCharacters";
import { AudioPriority } from "@/hooks/useAudioQueue";

interface UseDealerVoiceParams {
  phase: GamePhase;
  currentDealer: DealerCharacter | null;
  addSpeechBubble: (
    playerId: string,
    message: string,
    position: number,
    reactionType?:
      | "bust"
      | "hit21"
      | "goodHit"
      | "badStart"
      | "win"
      | "loss"
      | "dealer_blackjack"
      | "distraction",
    priority?: AudioPriority,
    dealerVoiceLine?:
      | "place_bets"
      | "dealer_busts"
      | "dealer_has_17"
      | "dealer_has_18"
      | "dealer_has_19"
      | "dealer_has_20"
      | "dealer_has_21",
  ) => void;
}

/**
 * Hook to handle dealer voice callouts during game phases
 * - "Place your bets" when entering BETTING phase
 */
export function useDealerVoice({
  phase,
  currentDealer,
  addSpeechBubble,
}: UseDealerVoiceParams) {
  const previousPhase = useRef<GamePhase | null>(null);
  const audioQueuedRef = useRef(false); // Track if we've queued audio for this betting phase

  useEffect(() => {
    // Detect when we enter BETTING phase
    if (phase === "BETTING" && previousPhase.current !== "BETTING") {
      previousPhase.current = phase;

      // Show "Place your bets" speech bubble and queue audio (only once)
      if (currentDealer && !audioQueuedRef.current) {
        audioQueuedRef.current = true;
        const message = "Place your bets";

        // Speech bubble handles both visual display AND audio queueing
        // Position -1 for dealer, dealerVoiceLine specifies which audio file to use
        addSpeechBubble(
          "dealer",
          message,
          -1,
          undefined,
          AudioPriority.NORMAL,
          "place_bets",
        );
      }
    } else if (phase !== "BETTING" && previousPhase.current === "BETTING") {
      // Exiting BETTING phase - reset audio flag for next betting round
      audioQueuedRef.current = false;
      previousPhase.current = phase;
    }
  }, [phase]); // Only trigger on phase change - currentDealer and addSpeechBubble are stable
}
