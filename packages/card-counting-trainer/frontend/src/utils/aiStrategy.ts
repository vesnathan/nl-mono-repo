import { Card as GameCard } from "@/types/game";
import { calculateHandValue } from "@/lib/gameActions";

/**
 * Simplified basic strategy decision for AI players
 * Returns true if AI should HIT, false if should STAND
 *
 * This is a simplified version used by AI players with skill level modifiers.
 * For full basic strategy, see lib/basicStrategy.ts
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export function shouldHitBasicStrategy(
  playerCards: GameCard[],
  dealerUpCard: GameCard,
): boolean {
  const playerValue = calculateHandValue(playerCards);
  const dealerValue =
    dealerUpCard.rank === "A"
      ? 11
      : ["J", "Q", "K"].includes(dealerUpCard.rank)
        ? 10
        : parseInt(dealerUpCard.rank, 10);

  // Check if player has soft hand (Ace counted as 11)
  const hasAce = playerCards.some((card) => card.rank === "A");
  const hardValue = playerCards.reduce((sum, card) => {
    if (card.rank === "A") return sum + 1;
    if (["J", "Q", "K"].includes(card.rank)) return sum + 10;
    return sum + parseInt(card.rank, 10);
  }, 0);
  const isSoft = hasAce && hardValue + 10 === playerValue;

  // Soft hand strategy (has Ace counted as 11)
  if (isSoft) {
    if (playerValue >= 19) return false; // Stand on soft 19+
    if (playerValue === 18) {
      // Soft 18: hit vs 9, 10, A; stand vs 2-8
      return dealerValue >= 9;
    }
    return true; // Hit on soft 17 or less
  }

  // Hard hand strategy
  if (playerValue >= 17) return false; // Always stand on 17+
  if (playerValue <= 11) return true; // Always hit on 11 or less

  // 12-16: depends on dealer upcard
  if (playerValue === 12) {
    // Hit vs 2, 3, 7+; stand vs 4-6
    return dealerValue <= 3 || dealerValue >= 7;
  }
  if (playerValue >= 13 && playerValue <= 16) {
    // Stand vs dealer 2-6, hit vs 7+
    return dealerValue >= 7;
  }

  return false;
}
