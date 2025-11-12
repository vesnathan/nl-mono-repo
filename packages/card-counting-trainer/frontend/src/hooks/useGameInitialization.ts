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
    // Fill all 8 seats with AI players
    const numAIPlayers = 8;
    const shuffledCharacters = [...AI_CHARACTERS].sort(
      () => Math.random() - 0.5,
    );

    // If we have fewer than 8 characters, repeat them to fill all seats
    const selectedCharacters = [];
    for (let i = 0; i < numAIPlayers; i += 1) {
      selectedCharacters.push(
        shuffledCharacters[i % shuffledCharacters.length],
      );
    }

    // Assign all table positions (0-7)
    const availablePositions = [0, 1, 2, 3, 4, 5, 6, 7];

    const aiPlayersWithSeats = selectedCharacters.map((char, idx) => ({
      character: char,
      hand: { cards: [], bet: 50 },
      chips: 1000,
      position: availablePositions[idx],
    }));

    setAIPlayers(aiPlayersWithSeats);

    const initialDealer = getRandomDealer();
    setCurrentDealer(initialDealer);
    setInitialized(true);
  }, [setAIPlayers, setCurrentDealer, setInitialized]);
}
