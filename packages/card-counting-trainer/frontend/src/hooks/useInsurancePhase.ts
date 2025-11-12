import { useEffect, useRef } from "react";
import { debugLog } from "@/utils/debug";
import { GamePhase, AIPlayer } from "@/types/gameState";
import { GameSettings } from "@/types/gameSettings";

interface UseInsurancePhaseParams {
  phase: GamePhase;
  gameSettings: GameSettings;
  insuranceOffered: boolean;
  setInsuranceOffered: (offered: boolean) => void;
  aiPlayers: AIPlayer[];
  setAIPlayers: (
    players: AIPlayer[] | ((prev: AIPlayer[]) => AIPlayer[]),
  ) => void;
  playerSeat: number | null;
  playerInsuranceBet: number;
  setPhase: (phase: GamePhase) => void;
  registerTimeout: (callback: () => void, delay: number) => void;
}

/**
 * Hook to handle INSURANCE phase logic
 * - AI players make insurance decisions based on basic strategy
 * - Waits for player decision (or skips if player not seated or already decided)
 * - Transitions to next phase after all decisions made
 */
export function useInsurancePhase({
  phase,
  gameSettings,
  insuranceOffered,
  setInsuranceOffered,
  aiPlayers,
  setAIPlayers,
  playerSeat,
  playerInsuranceBet,
  setPhase,
  registerTimeout,
}: UseInsurancePhaseParams) {
  const hasProcessedAI = useRef(false);

  useEffect(() => {
    if (phase !== "INSURANCE") {
      hasProcessedAI.current = false;
      return;
    }

    if (!insuranceOffered) return;

    // Process AI insurance decisions
    if (!hasProcessedAI.current) {
      debugLog("insurance", "=== INSURANCE PHASE START ===");
      debugLog("insurance", "Processing AI insurance decisions...");
      hasProcessedAI.current = true;

      registerTimeout(() => {
        setAIPlayers((prevPlayers) => {
          return prevPlayers.map((ai, idx) => {
            // AI takes insurance ~10% of the time (bad play in most cases)
            // In reality, should only take insurance with high true count
            const shouldTakeInsurance = Math.random() < 0.1;

            if (shouldTakeInsurance) {
              const insuranceCost = Math.floor(ai.hand.bet / 2);
              if (ai.chips >= insuranceCost) {
                debugLog(
                  "insurance",
                  `AI Player ${idx} (${ai.character.name}) TAKES insurance for $${insuranceCost}`,
                );
                return {
                  ...ai,
                  insuranceBet: insuranceCost,
                  chips: ai.chips - insuranceCost,
                };
              }
              debugLog(
                "insurance",
                `AI Player ${idx} (${ai.character.name}) cannot afford insurance`,
              );
            } else {
              debugLog(
                "insurance",
                `AI Player ${idx} (${ai.character.name}) DECLINES insurance`,
              );
            }

            return ai;
          });
        });
      }, 500);
    }

    // Check if we can proceed (player has decided or is not seated)
    // Player has decided if: not seated, or insurance offer was withdrawn (insuranceOffered became false)
    const playerDecided = playerSeat === null || !insuranceOffered;

    if (playerDecided && hasProcessedAI.current) {
      registerTimeout(() => {
        debugLog("insurance", "All insurance decisions made");
        debugLog("insurance", "=== INSURANCE PHASE END ===");

        // Move to player turn or AI turns depending on whether player is seated
        if (playerSeat === null) {
          debugLog("insurance", "Player not seated, moving to AI_TURNS");
          setPhase("AI_TURNS");
        } else {
          debugLog("insurance", "Moving to PLAYER_TURN");
          setPhase("PLAYER_TURN");
        }
      }, 1500);
    }
  }, [
    phase,
    gameSettings,
    insuranceOffered,
    aiPlayers,
    playerSeat,
    playerInsuranceBet,
    setInsuranceOffered,
    setAIPlayers,
    setPhase,
    registerTimeout,
  ]);
}
