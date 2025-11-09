import { useEffect } from "react";
import { AIPlayer, GamePhase } from "@/types/gameState";

interface UseAutoStartHandParams {
  initialized: boolean;
  aiPlayersLength: number;
  handNumber: number;
  phase: GamePhase;
  playerSeat: number | null;
  currentBet: number;
  setPhase: (phase: GamePhase) => void;
  setDealerRevealed: (revealed: boolean) => void;
  setPlayerHand: (hand: any) => void;
  setDealerHand: (hand: any) => void;
  setPlayerChips: (chips: number | ((prev: number) => number)) => void;
  setSpeechBubbles: (bubbles: any[]) => void;
  setAIPlayers: (players: AIPlayer[]) => void;
  aiPlayers: AIPlayer[];
  dealInitialCards: () => void;
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
  setPhase,
  setDealerRevealed,
  setPlayerHand,
  setDealerHand,
  setPlayerChips,
  setSpeechBubbles,
  setAIPlayers,
  aiPlayers,
  dealInitialCards,
}: UseAutoStartHandParams) {
  // Auto-start first hand after initialization
  useEffect(() => {
    if (
      initialized &&
      aiPlayersLength > 0 &&
      handNumber === 0 &&
      phase === "BETTING"
    ) {
      const timer = setTimeout(() => {
        setPhase("DEALING");
        setDealerRevealed(false);

        const playerBet =
          playerSeat !== null && currentBet > 0 ? currentBet : 0;
        setPlayerHand({ cards: [], bet: playerBet });
        setDealerHand({ cards: [], bet: 0 });

        if (playerBet > 0) {
          setPlayerChips((prev) => prev - playerBet);
        }

        setSpeechBubbles([]);

        const updatedAI = aiPlayers.map((ai) => ({
          ...ai,
          hand: { cards: [], bet: Math.floor(Math.random() * 50) + 25 },
        }));
        setAIPlayers(updatedAI);

        setTimeout(() => dealInitialCards(), 500);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    initialized,
    aiPlayersLength,
    handNumber,
    phase,
    playerSeat,
    currentBet,
    setPhase,
    setDealerRevealed,
    setPlayerHand,
    setDealerHand,
    setPlayerChips,
    setSpeechBubbles,
    setAIPlayers,
    aiPlayers,
    dealInitialCards,
  ]);

  // Auto-start subsequent hands (handNumber > 0)
  useEffect(() => {
    if (
      initialized &&
      aiPlayersLength > 0 &&
      handNumber > 0 &&
      phase === "BETTING"
    ) {
      const timer = setTimeout(() => {
        setPhase("DEALING");
        setDealerRevealed(false);

        const playerBet =
          playerSeat !== null && currentBet > 0 ? currentBet : 0;
        setPlayerHand({ cards: [], bet: playerBet });
        setDealerHand({ cards: [], bet: 0 });

        if (playerBet > 0) {
          setPlayerChips((prev) => prev - playerBet);
        }

        setSpeechBubbles([]);

        const updatedAI = aiPlayers.map((ai) => ({
          ...ai,
          hand: { cards: [], bet: Math.floor(Math.random() * 50) + 25 },
        }));
        setAIPlayers(updatedAI);

        setTimeout(() => dealInitialCards(), 500);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    initialized,
    aiPlayersLength,
    handNumber,
    phase,
    playerSeat,
    currentBet,
    setPhase,
    setDealerRevealed,
    setPlayerHand,
    setDealerHand,
    setPlayerChips,
    setSpeechBubbles,
    setAIPlayers,
    aiPlayers,
    dealInitialCards,
  ]);
}
