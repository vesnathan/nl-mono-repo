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
  dealInitialCards: (playerBetAmount?: number) => void;
  registerTimeout: (callback: () => void, delay: number) => void;
  addDebugLog: (message: string) => void;
  trueCount: number;
  setBetHistory: (history: Array<{bet: number, trueCount: number}> | ((prev: Array<{bet: number, trueCount: number}>) => Array<{bet: number, trueCount: number}>)) => void;
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
  registerTimeout,
  addDebugLog,
  trueCount,
  setBetHistory,
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

      // Track bet history for counting detection
      setBetHistory((prev) => {
        const newHistory = [...prev, { bet: currentBet, trueCount }];
        // Keep only last 10 bets
        if (newHistory.length > 10) {
          return newHistory.slice(-10);
        }
        return newHistory;
      });
      addDebugLog(`Bet tracked: $${currentBet} at true count ${trueCount.toFixed(2)}`);

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

      // Reset AI hands (bet amount irrelevant for counting training)
      const updatedAI = aiPlayers.map((ai) => ({
        ...ai,
        hand: { cards: [], bet: 0 },
      }));
      setAIPlayers(updatedAI);

      // Deal initial cards, passing the bet amount directly to avoid stale closure
      registerTimeout(() => dealInitialCards(currentBet), 0);
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
    trueCount,
    setPhase,
    setDealerRevealed,
    setPlayerHand,
    setDealerHand,
    setPlayerChips,
    setPreviousBet,
    setSpeechBubbles,
    setAIPlayers,
    setBetHistory,
    dealInitialCards,
    registerTimeout,
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
