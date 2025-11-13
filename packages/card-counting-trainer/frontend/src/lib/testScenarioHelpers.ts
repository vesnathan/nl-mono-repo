import { Card, Rank, Suit } from "@/types/game";
import { getCardValue, getCountValue } from "@/lib/deck";
import { CountingSystem } from "@/types/gameSettings";

/**
 * Create a Card object from a test scenario card specification
 * @param rank The card rank
 * @param suit The card suit
 * @param countingSystem The counting system to use for count values
 * @returns A complete Card object with value and count
 */
export function createCardFromScenario(
  rank: Rank,
  suit: Suit,
  countingSystem: CountingSystem,
): Card {
  return {
    rank,
    suit,
    value: getCardValue(rank),
    count: getCountValue(rank, countingSystem),
  };
}
