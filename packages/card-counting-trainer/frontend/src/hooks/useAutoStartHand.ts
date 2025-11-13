/* eslint-disable sonarjs/cognitive-complexity */
import { useEffect, useRef } from "react";
import {
  AIPlayer,
  GamePhase,
  PlayerHand,
  SpeechBubble,
} from "@/types/gameState";
import { debugLog } from "@/utils/debug";

interface UseAutoStartHandParams {
  initialized: boolean;
  aiPlayersLength: number;
  handNumber: number;
  phase: GamePhase;
  playerSeat: number | null;
  currentBet: number;
  devTestingMode?: boolean;
  showTestScenarioSelector?: boolean;
  setPhase: (phase: GamePhase) => void;
  setDealerRevealed: (revealed: boolean) => void;
  setPlayerHand: (hand: PlayerHand) => void;
  setDealerHand: (hand: PlayerHand) => void;
  setPlayerChips: (chips: number | ((prev: number) => number)) => void;
  setSpeechBubbles: (bubbles: SpeechBubble[]) => void;
  setAIPlayers: (players: AIPlayer[]) => void;
  aiPlayers: AIPlayer[];
  dealInitialCards: (playerBetAmount?: number) => void;
  addSpeechBubble: (
    playerId: string,
    message: string,
    position: number,
  ) => void;
  registerTimeout: (callback: () => void, delay: number) => void;
}

/**
 * Hook to handle auto-starting the first hand and subsequent hands
 */
export function useAutoStartHand({
  initialized,
  aiPlayersLength,
  handNumber,
  phase,
  playerSeat,
  currentBet,
  devTestingMode,
  showTestScenarioSelector,
  setPhase,
  setDealerRevealed,
  setPlayerHand,
  setDealerHand,
  setPlayerChips,
  setSpeechBubbles,
  setAIPlayers,
  aiPlayers,
  dealInitialCards,
  addSpeechBubble,
  registerTimeout,
}: UseAutoStartHandParams) {
  // Use refs to track current values inside timeouts
  const phaseRef = useRef(phase);
  const showTestScenarioSelectorRef = useRef(showTestScenarioSelector);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    showTestScenarioSelectorRef.current = showTestScenarioSelector;
  }, [showTestScenarioSelector]);

  // Auto-start first hand after initialization
  // AI players always play automatically
  // User can watch without being seated, or join by sitting and placing a bet
  // eslint-disable-next-line sonarjs/no-duplicate-string
  useEffect(() => {
    // Don't auto-start if dev testing mode is on and test scenario selector is open
    if (devTestingMode && showTestScenarioSelector) {
      debugLog(
        "gamePhases",
        "[useAutoStartHand] Pausing auto-start - test scenario selector is open",
      );
      return;
    }

    if (
      initialized &&
      aiPlayersLength > 0 &&
      handNumber === 0 &&
      phase === "BETTING"
    ) {
      // If player is seated, give them 10 seconds to bet. Otherwise start immediately.
      const delay = playerSeat !== null ? 10000 : 500;
      debugLog(
        "gamePhases",
        `[useAutoStartHand] Setting timer for first hand: ${delay}ms`,
      );

      registerTimeout(() => {
        // Check if phase is still BETTING (user didn't manually confirm)
        if (phaseRef.current !== "BETTING") {
          debugLog(
            "gamePhases",
            "[useAutoStartHand] Phase already changed, skipping auto-start",
          );
          return;
        }

        // Check if test scenario selector is open in dev mode
        if (devTestingMode && showTestScenarioSelectorRef.current) {
          debugLog(
            "gamePhases",
            "[useAutoStartHand] Test scenario selector is open, skipping auto-start",
          );
          return;
        }

        debugLog(
          "gamePhases",
          "[useAutoStartHand] Timer fired - starting dealing phase",
        );
        setPhase("DEALING");
        setDealerRevealed(false);

        // User participates only if seated AND has placed a bet
        const playerBet =
          playerSeat !== null && currentBet > 0 ? currentBet : 0;
        setPlayerHand({ cards: [], bet: playerBet });
        setDealerHand({ cards: [], bet: 0 });

        if (playerBet > 0) {
          setPlayerChips((prev) => prev - playerBet);
        }

        setSpeechBubbles([]);

        // Announce "Bets Closed" after clearing bubbles (only if player is seated)
        if (playerSeat !== null) {
          addSpeechBubble("dealer-bets-closed", "Bets closed!", -1);
        }

        // AI players always play (bet amount irrelevant for counting training)
        const updatedAI = aiPlayers.map((ai) => ({
          ...ai,
          hand: { cards: [], bet: 0 },
        }));
        setAIPlayers(updatedAI);

        // Call dealInitialCards on next tick, passing bet amount to avoid stale closure
        registerTimeout(() => dealInitialCards(playerBet), 0);
      }, delay);
    }
    // Only depend on values that determine WHEN to start the timer, not values used inside
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialized,
    aiPlayersLength,
    handNumber,
    phase,
    playerSeat,
    devTestingMode,
    showTestScenarioSelector,
  ]);

  // Auto-start subsequent hands (handNumber > 0)
  // AI players always play automatically
  // eslint-disable-next-line sonarjs/no-duplicate-string
  // User can watch without being seated, or join by sitting and placing a bet
  useEffect(() => {
    // Don't auto-start if dev testing mode is on and test scenario selector is open
    if (devTestingMode && showTestScenarioSelector) {
      debugLog(
        "gamePhases",
        "[useAutoStartHand] Pausing auto-start - test scenario selector is open",
      );
      return;
    }

    if (
      initialized &&
      aiPlayersLength > 0 &&
      handNumber > 0 &&
      phase === "BETTING"
    ) {
      // If player is seated, give them 10 seconds to bet. Otherwise start immediately.
      const delay = playerSeat !== null ? 10000 : 500;
      debugLog(
        "gamePhases",
        `[useAutoStartHand] Setting timer for hand ${handNumber}: ${delay}ms`,
      );

      registerTimeout(() => {
        // Check if phase is still BETTING (user didn't manually confirm)
        if (phaseRef.current !== "BETTING") {
          debugLog(
            "gamePhases",
            `[useAutoStartHand] Phase already changed for hand ${handNumber}, skipping auto-start`,
          );
          return;
        }

        // Check if test scenario selector is open in dev mode
        if (devTestingMode && showTestScenarioSelectorRef.current) {
          debugLog(
            "gamePhases",
            `[useAutoStartHand] Test scenario selector is open for hand ${handNumber}, skipping auto-start`,
          );
          return;
        }

        debugLog(
          "gamePhases",
          `[useAutoStartHand] Timer fired for hand ${handNumber} - starting dealing phase`,
        );
        setPhase("DEALING");
        setDealerRevealed(false);

        // User participates only if seated AND has placed a bet
        const playerBet =
          playerSeat !== null && currentBet > 0 ? currentBet : 0;
        setPlayerHand({ cards: [], bet: playerBet });
        setDealerHand({ cards: [], bet: 0 });

        if (playerBet > 0) {
          setPlayerChips((prev) => prev - playerBet);
        }

        setSpeechBubbles([]);

        // Announce "Bets Closed" after clearing bubbles (only if player is seated)
        if (playerSeat !== null) {
          addSpeechBubble("dealer-bets-closed", "Bets closed!", -1);
        }

        // AI players always play (bet amount irrelevant for counting training)
        const updatedAI = aiPlayers.map((ai) => ({
          ...ai,
          hand: { cards: [], bet: 0 },
        }));
        setAIPlayers(updatedAI);

        // Call dealInitialCards on next tick, passing bet amount to avoid stale closure
        registerTimeout(() => dealInitialCards(playerBet), 0);
      }, delay);
    }
    // Only depend on values that determine WHEN to start the timer, not values used inside
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialized,
    aiPlayersLength,
    handNumber,
    phase,
    playerSeat,
    devTestingMode,
    showTestScenarioSelector,
  ]);
}
