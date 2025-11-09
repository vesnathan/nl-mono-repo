import { useCallback } from "react";
import { AIPlayer, GamePhase } from "@/types/gameState";

interface UseBettingActionsParams {
  currentBet: number;
  setCurrentBet: (bet: number) => void;
  minBet: number;
  maxBet: number;
  playerChips: number;
  setPlayerChips: (chips: number | ((prev: number) => number)) => void;
  phase: GamePhase;
  playerSeat: number | null;
  aiPlayers: AIPlayer[];
  setPhase: (phase: GamePhase) => void;
  setDealerRevealed: (revealed: boolean) => void;
  setPlayerHand: (hand: any) => void;
  setDealerHand: (hand: any) => void;
  setPreviousBet: (bet: number) => void;
  setSpeechBubbles: (bubbles: any[]) => void;
  setAIPlayers: (players: AIPlayer[]) => void;
  dealInitialCards: () => void;
  addDebugLog: (message: string) => void;
}

export function useBettingActions({
  currentBet,
  setCurrentBet,
  minBet,
  maxBet,
  playerChips,
  setPlayerChips,
  phase,
  playerSeat,
  aiPlayers,
  setPhase,
  setDealerRevealed,
  setPlayerHand,
  setDealerHand,
  setPreviousBet,
  setSpeechBubbles,
  setAIPlayers,
  dealInitialCards,
  addDebugLog,
}: UseBettingActionsParams) {
  const handleConfirmBet = useCallback(() => {
    addDebugLog("=== CONFIRM BET CLICKED ===");
    addDebugLog(`Current bet: $${currentBet}`);
    addDebugLog(`Min bet: $${minBet}, Max bet: $${maxBet}`);
    addDebugLog(`Player chips: $${playerChips}`);
    addDebugLog(`Phase: ${phase}`);
    addDebugLog(`Player seat: ${playerSeat}`);

    const canBet =
      currentBet >= minBet &&
      currentBet <= maxBet &&
      currentBet <= playerChips &&
      phase === "BETTING" &&
      playerSeat !== null;
    addDebugLog(`Can place bet: ${canBet}`);

    if (canBet) {
      addDebugLog("✓ BET CONFIRMED - Starting dealing phase");
      setPhase("DEALING");
      setDealerRevealed(false);
      setPlayerHand({ cards: [], bet: currentBet });
      setDealerHand({ cards: [], bet: 0 });
      setPlayerChips((prev) => {
        addDebugLog(
          `Deducting bet: $${prev} - $${currentBet} = $${prev - currentBet}`,
        );
        return prev - currentBet;
      });
      setPreviousBet(currentBet);
      setSpeechBubbles([]); // Clear any lingering speech bubbles

      // Reset AI hands with random bets
      const updatedAI = aiPlayers.map((ai) => ({
        ...ai,
        hand: { cards: [], bet: Math.floor(Math.random() * 50) + 25 },
      }));
      setAIPlayers(updatedAI);

      // Deal initial cards
      setTimeout(() => dealInitialCards(), 500);
    } else {
      addDebugLog("✗ BET NOT CONFIRMED - Requirements not met");
      if (currentBet < minBet)
        addDebugLog(`  - Bet too low (${currentBet} < ${minBet})`);
      if (currentBet > maxBet)
        addDebugLog(`  - Bet too high (${currentBet} > ${maxBet})`);
      if (currentBet > playerChips)
        addDebugLog(`  - Insufficient chips (${currentBet} > ${playerChips})`);
      if (phase !== "BETTING") addDebugLog(`  - Wrong phase (${phase})`);
      if (playerSeat === null) addDebugLog(`  - Player not seated`);
    }
  }, [
    currentBet,
    minBet,
    maxBet,
    playerChips,
    phase,
    playerSeat,
    aiPlayers,
    setPhase,
    setDealerRevealed,
    setPlayerHand,
    setDealerHand,
    setPlayerChips,
    setPreviousBet,
    setSpeechBubbles,
    setAIPlayers,
    dealInitialCards,
    addDebugLog,
  ]);

  const handleClearBet = useCallback(() => {
    addDebugLog("CLEAR BET - Resetting bet to $0");
    setCurrentBet(0);
  }, [addDebugLog, setCurrentBet]);

  const handleBetChange = useCallback(
    (newBet: number) => {
      addDebugLog(`BET CHANGED: $${currentBet} → $${newBet}`);
      setCurrentBet(newBet);
    },
    [currentBet, addDebugLog, setCurrentBet],
  );

  return {
    handleConfirmBet,
    handleClearBet,
    handleBetChange,
  };
}
