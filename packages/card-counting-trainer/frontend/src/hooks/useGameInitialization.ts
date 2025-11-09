import { useEffect } from "react";
import { AI_CHARACTERS } from "@/data/aiCharacters";
import { getRandomDealer, DealerCharacter } from "@/data/dealerCharacters";
import { AIPlayer } from "@/types/gameState";

/**
 * Hook to handle game initialization on mount
 * - Randomly selects and seats 3-4 AI players
 * - Assigns random dealer
 * - Sets initialized flag
 */
export function useGameInitialization(
  setAIPlayers: (players: AIPlayer[]) => void,
  setCurrentDealer: (dealer: DealerCharacter) => void,
  setInitialized: (initialized: boolean) => void,
) {
  useEffect(() => {
    // TESTING: Just 1 AI player for easier debugging
    const numAIPlayers = 1; // Was: Math.floor(Math.random() * 2) + 3; // 3 or 4 AI players
    const shuffledCharacters = [...AI_CHARACTERS].sort(
      () => Math.random() - 0.5,
    );
    const selectedCharacters = shuffledCharacters.slice(0, numAIPlayers);

    // Fisher-Yates shuffle for truly random seat assignment
    const availableSeats = [0, 1, 2, 3, 4, 5, 6, 7];
    for (let i = availableSeats.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableSeats[i], availableSeats[j]] = [
        availableSeats[j],
        availableSeats[i],
      ];
    }

    const aiPlayersWithSeats = selectedCharacters.map((char, idx) => ({
      character: char,
      hand: { cards: [], bet: 50 },
      chips: 1000,
      position: availableSeats[idx],
    }));

    setAIPlayers(aiPlayersWithSeats);

    const initialDealer = getRandomDealer();
    setCurrentDealer(initialDealer);
    setInitialized(true);
  }, [setAIPlayers, setCurrentDealer, setInitialized]);
}
