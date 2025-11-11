import { useEffect, useRef } from "react";
import { GamePhase, AIPlayer, PlayerHand } from "@/types/gameState";
import { isBlackjack } from "@/lib/gameActions";
import { debugLog } from "@/utils/debug";

interface UseDealingPhaseParams {
  phase: GamePhase;
  aiPlayers: AIPlayer[];
  dealerHand: PlayerHand;
  setPlayersFinished: (
    finished: Set<number> | ((prev: Set<number>) => Set<number>),
  ) => void;
  setPlayerActions: (
    actions:
      | Map<number, "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "BUST" | "BLACKJACK">
      | ((
          prev: Map<
            number,
            "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "BUST" | "BLACKJACK"
          >,
        ) => Map<
          number,
          "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "BUST" | "BLACKJACK"
        >),
  ) => void;
  registerTimeout: (callback: () => void, delay: number) => void;
}

/**
 * Hook to handle DEALING phase logic
 * - Marks AI players with blackjack as finished
 * - Only runs once per dealing phase
 * Note: Reactions are now shown during dealing in useGameActions
 */
export function useDealingPhase({
  phase,
  aiPlayers,
  dealerHand,
  setPlayersFinished,
  setPlayerActions,
  registerTimeout,
}: UseDealingPhaseParams) {
  const hasTriggeredReactions = useRef(false);

  useEffect(() => {
    if (phase !== "DEALING") {
      // Reset flag when leaving DEALING phase
      hasTriggeredReactions.current = false;
      return;
    }

    // Wait until all cards are dealt (everyone has 2 cards, dealer has 2 cards)
    const allAIPlayersHaveCards = aiPlayers.every(
      (ai) => ai.hand.cards.length === 2,
    );
    const dealerHasCards = dealerHand.cards.length === 2;

    if (
      allAIPlayersHaveCards &&
      dealerHasCards &&
      !hasTriggeredReactions.current
    ) {
      debugLog("dealCards", "All cards dealt, marking blackjack hands");
      hasTriggeredReactions.current = true;

      // Mark AI players with blackjack as finished and show BLACKJACK indicator
      // (Reactions are now shown during dealing, not after)
      aiPlayers.forEach((ai, idx) => {
        if (isBlackjack(ai.hand.cards)) {
          debugLog(
            "dealCards",
            `AI Player ${idx} (${ai.character.name}) has BLACKJACK - marking as finished`,
          );
          setPlayersFinished((prev) => new Set(prev).add(idx));
          setPlayerActions((prev) => new Map(prev).set(idx, "BLACKJACK"));

          // Clear the BLACKJACK indicator after 2 seconds
          registerTimeout(() => {
            setPlayerActions((prev) => {
              const newMap = new Map(prev);
              newMap.delete(idx);
              return newMap;
            });
          }, 2000);
        }
      });
    }
  }, [
    phase,
    aiPlayers,
    dealerHand.cards.length,
    setPlayersFinished,
    setPlayerActions,
    registerTimeout,
  ]);
}
