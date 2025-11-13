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
 * - Checks each player individually as soon as they receive their second card
 * - Shows BLACKJACK bubble immediately when detected
 */
export function useDealingPhase({
  phase,
  aiPlayers,
  dealerHand,
  setPlayersFinished,
  setPlayerActions,
  registerTimeout,
}: UseDealingPhaseParams) {
  // Track which players we've already checked for blackjack
  const checkedPlayers = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (phase !== "DEALING") {
      // Reset checked players when leaving DEALING phase
      checkedPlayers.current = new Set();
      return;
    }

    // Check each AI player individually as soon as they have 2 cards
    aiPlayers.forEach((ai, idx) => {
      // Skip if we've already checked this player
      if (checkedPlayers.current.has(idx)) {
        return;
      }

      // Check for blackjack as soon as player has 2 cards
      if (ai.hand.cards.length === 2) {
        checkedPlayers.current.add(idx);

        if (isBlackjack(ai.hand.cards)) {
          debugLog(
            "dealCards",
            `AI Player ${idx} (${ai.character.name}) has BLACKJACK - marking immediately`,
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
      }
    });
  }, [phase, aiPlayers, setPlayersFinished, setPlayerActions, registerTimeout]);
}
