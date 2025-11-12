import { useCallback } from "react";
import { debugLog } from "@/utils/debug";
import { AIPlayer, GamePhase, PlayerHand, SpeechBubble } from "@/types/gameState";
import { DealerCharacter } from "@/data/dealerCharacters";
import { AudioQueueHook, AudioPriority } from "@/hooks/useAudioQueue";
import { getDealerAudioPath } from "@/utils/audioHelpers";

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
  setPlayerHand: (hand: PlayerHand) => void;
  setDealerHand: (hand: PlayerHand) => void;
  setPreviousBet: (bet: number) => void;
  setSpeechBubbles: (bubbles: SpeechBubble[]) => void;
  setAIPlayers: (players: AIPlayer[]) => void;
  dealInitialCards: (playerBetAmount?: number) => void;
  registerTimeout: (callback: () => void, delay: number) => void;
  trueCount: number;
  setBetHistory: (
    history:
      | Array<{ bet: number; trueCount: number }>
      | ((
          prev: Array<{ bet: number; trueCount: number }>,
        ) => Array<{ bet: number; trueCount: number }>),
  ) => void;
  currentDealer: DealerCharacter | null;
  audioQueue: AudioQueueHook;
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
  trueCount,
  setBetHistory,
  currentDealer,
  audioQueue,
}: UseBettingActionsParams) {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  // eslint-disable-next-line sonarjs/no-duplicate-string
  const handleConfirmBet = useCallback(() => {
    debugLog("betting", "=== CONFIRM BET CLICKED ===");
    debugLog("betting", `Current bet: $${currentBet}`);
    debugLog("betting", `Min bet: $${minBet}, Max bet: $${maxBet}`);
    debugLog("betting", `Player chips: $${playerChips}`);
    debugLog("betting", `Phase: ${phase}`);
    debugLog("betting", `Player seat: ${playerSeat}`);

    const canBet =
      currentBet >= minBet &&
      currentBet <= maxBet &&
      currentBet <= playerChips &&
      phase === "BETTING" &&
      playerSeat !== null;
    debugLog("betting", `Can place bet: ${canBet}`);

    if (canBet) {
      debugLog("betting", "✓ BET CONFIRMED - Starting dealing phase");

      // Track bet history for counting detection
      setBetHistory((prev) => {
        const newHistory = [...prev, { bet: currentBet, trueCount }];
        // Keep only last 10 bets
        if (newHistory.length > 10) {
          return newHistory.slice(-10);
        }
        return newHistory;
      });
      debugLog(
        "betting",
        `Bet tracked: $${currentBet} at true count ${trueCount.toFixed(2)}`,
      );

      // Dealer says "No more bets"
      if (currentDealer) {
        const audioPath = getDealerAudioPath(currentDealer.id, "no_more_bets");
        audioQueue.queueAudio({
          id: `dealer-no-more-bets-${Date.now()}`,
          audioPath,
          priority: AudioPriority.NORMAL,
          playerId: "dealer",
          message: "No more bets",
        });
      }

      setPhase("DEALING");
      setDealerRevealed(false);
      setPlayerHand({ cards: [], bet: currentBet });
      setDealerHand({ cards: [], bet: 0 });
      setPlayerChips((prev) => {
        debugLog(
          "betting",
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
      debugLog("betting", "✗ BET NOT CONFIRMED - Requirements not met");
      if (currentBet < minBet)
        debugLog("betting", `  - Bet too low (${currentBet} < ${minBet})`);
      if (currentBet > maxBet)
        debugLog("betting", `  - Bet too high (${currentBet} > ${maxBet})`);
      if (currentBet > playerChips)
        debugLog(
          "betting",
          `  - Insufficient chips (${currentBet} > ${playerChips})`,
        );
      if (phase !== "BETTING")
        debugLog("betting", `  - Wrong phase (${phase})`);
      if (playerSeat === null) debugLog("betting", `  - Player not seated`);
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
    currentDealer,
    audioQueue,
  ]);

  const handleClearBet = useCallback(() => {
    debugLog("betting", "CLEAR BET - Resetting bet to $0");
    setCurrentBet(0);
  }, [setCurrentBet]);

  const handleBetChange = useCallback(
    (newBet: number) => {
      debugLog("betting", `BET CHANGED: $${currentBet} → $${newBet}`);
      setCurrentBet(newBet);
    },
    [currentBet, setCurrentBet],
  );

  return {
    handleConfirmBet,
    handleClearBet,
    handleBetChange,
  };
}
