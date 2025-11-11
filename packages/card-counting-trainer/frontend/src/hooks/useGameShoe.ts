import { useState, useCallback, useRef } from "react";
import { Card } from "@/types/game";
import { createAndShuffleShoe } from "@/lib/deck";
import { dealCard } from "@/lib/gameActions";
import { GameSettings } from "@/types/gameSettings";

/**
 * Custom hook for managing the shoe (deck) state and card dealing
 * Handles shoe creation, shuffling, card dealing, and running count tracking
 *
 * @param gameSettings - Current game settings (number of decks, counting system)
 * @returns Shoe state and card dealing functions
 */
export function useGameShoe(gameSettings: GameSettings) {
  const [shoe, setShoe] = useState<Card[]>(() =>
    createAndShuffleShoe(
      gameSettings.numberOfDecks,
      gameSettings.countingSystem,
    ),
  );
  const [cardsDealt, setCardsDealt] = useState(0);
  const [runningCount, setRunningCount] = useState(0);
  const [shoesDealt, setShoesDealt] = useState(0);

  // Use ref to always have the latest shoe for dealing
  const shoeRef = useRef(shoe);
  shoeRef.current = shoe;

  /**
   * Deal a single card from the shoe
   * Updates shoe state, cards dealt counter, and running count
   * Handles automatic reshuffling when cut card is reached
   *
   * @returns The dealt card
   */
  const dealCardFromShoe = useCallback(() => {
    // Use ref to get the most current shoe, avoiding stale closure issues
    const { card, remainingShoe, reshuffled } = dealCard(
      shoeRef.current,
      gameSettings.numberOfDecks,
      gameSettings.countingSystem,
    );

    if (reshuffled) {
      // Shoe was reshuffled - reset counters
      setShoe(remainingShoe);
      setCardsDealt(1);
      setRunningCount(card.count);
      setShoesDealt((prev) => prev + 1);
    } else {
      // Normal deal - update counters
      setShoe(remainingShoe);
      setCardsDealt((prev) => prev + 1);
      setRunningCount((prev) => prev + card.count);
    }

    return card;
  }, [gameSettings.numberOfDecks, gameSettings.countingSystem]);

  /**
   * Reset the shoe to a fresh shuffled state
   * Useful for starting a new session or resetting game state
   */
  const resetShoe = useCallback(() => {
    setShoe(
      createAndShuffleShoe(
        gameSettings.numberOfDecks,
        gameSettings.countingSystem,
      ),
    );
    setCardsDealt(0);
    setRunningCount(0);
  }, [gameSettings.numberOfDecks, gameSettings.countingSystem]);

  return {
    shoe,
    setShoe,
    cardsDealt,
    setCardsDealt,
    runningCount,
    setRunningCount,
    shoesDealt,
    setShoesDealt,
    dealCardFromShoe,
    resetShoe,
  };
}
