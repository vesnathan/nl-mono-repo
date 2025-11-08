import { GameState, Hand, HandResult } from "@/types/game";
import { calculateHandValue, isBlackjack, isBusted, dealCard, isSoftHand } from "./gameActions";

/**
 * Dealer Rules Configuration
 */
export interface DealerRules {
  hitSoft17: boolean; // True = H17, False = S17
  peekForBlackjack: boolean; // True = American, False = European
}

export const DEFAULT_DEALER_RULES: DealerRules = {
  hitSoft17: true, // Most common casino rule
  peekForBlackjack: true, // American style
};

/**
 * Determine if dealer should hit
 * @param dealerHand Dealer's current hand
 * @param rules Dealer rules configuration
 * @returns True if dealer should hit
 */
export function shouldDealerHit(dealerHand: Hand, rules: DealerRules = DEFAULT_DEALER_RULES): boolean {
  const handValue = calculateHandValue(dealerHand.cards);

  // Always hit on 16 or less
  if (handValue < 17) return true;

  // Always stand on 18 or more
  if (handValue >= 18) return false;

  // On 17: depends on soft 17 rule
  if (handValue === 17) {
    if (rules.hitSoft17 && isSoftHand(dealerHand.cards)) {
      return true; // Hit soft 17
    }
    return false; // Stand on hard 17 or stand on all 17s
  }

  return false;
}

/**
 * Play dealer hand according to house rules
 * @param gameState Current game state
 * @param rules Dealer rules configuration
 * @returns Updated game state after dealer plays
 */
export function playDealerHand(
  gameState: GameState,
  rules: DealerRules = DEFAULT_DEALER_RULES
): GameState {
  let updatedState = { ...gameState };
  const dealerIndex = 0; // Dealer is always at position 0
  const dealer = updatedState.players[dealerIndex];

  if (!dealer.hands[0]) {
    throw new Error("Dealer has no hand");
  }

  // Reveal dealer's hole card
  updatedState.dealerRevealed = true;

  // Check for dealer blackjack
  if (isBlackjack(dealer.hands[0].cards)) {
    return updatedState; // Dealer blackjack, no need to hit
  }

  // Play dealer hand
  while (shouldDealerHit(dealer.hands[0], rules)) {
    const { card, remainingShoe, reshuffled } = dealCard(updatedState.shoe, updatedState.numDecks);

    // Add card to dealer's hand
    const updatedPlayers = [...updatedState.players];
    updatedPlayers[dealerIndex].hands[0].cards.push(card);

    // Update game state
    updatedState = {
      ...updatedState,
      shoe: remainingShoe,
      cardsDealt: reshuffled ? 1 : updatedState.cardsDealt + 1,
      runningCount: reshuffled ? card.count : updatedState.runningCount + card.count,
      players: updatedPlayers,
    };

    // Stop if dealer busts
    if (isBusted(updatedPlayers[dealerIndex].hands[0].cards)) {
      break;
    }
  }

  return updatedState;
}

/**
 * Determine hand result by comparing player and dealer hands
 * @param playerHand Player's hand
 * @param dealerHand Dealer's hand
 * @returns Hand result
 */
export function determineHandResult(playerHand: Hand, dealerHand: Hand): HandResult {
  const playerValue = calculateHandValue(playerHand.cards);
  const dealerValue = calculateHandValue(dealerHand.cards);
  const playerBJ = isBlackjack(playerHand.cards);
  const dealerBJ = isBlackjack(dealerHand.cards);

  // Player busted
  if (isBusted(playerHand.cards)) {
    return "BUST";
  }

  // Player blackjack
  if (playerBJ) {
    if (dealerBJ) {
      return "PUSH"; // Both blackjack = push
    }
    return "BLACKJACK"; // Player blackjack wins
  }

  // Dealer blackjack (player doesn't have blackjack)
  if (dealerBJ) {
    return "LOSE";
  }

  // Dealer busted (player didn't bust)
  if (isBusted(dealerHand.cards)) {
    return "WIN";
  }

  // Compare values
  if (playerValue > dealerValue) {
    return "WIN";
  } else if (playerValue < dealerValue) {
    return "LOSE";
  } else {
    return "PUSH";
  }
}

/**
 * Calculate payout for a hand
 * @param hand Player's hand
 * @param result Hand result
 * @param blackjackPayout Blackjack payout ratio (1.5 for 3:2, 1.2 for 6:5)
 * @returns Payout amount (includes original bet)
 */
export function calculatePayout(
  hand: Hand,
  result: HandResult,
  blackjackPayout: number = 1.5 // 3:2 payout
): number {
  const bet = hand.bet;

  switch (result) {
    case "BLACKJACK":
      return bet + Math.floor(bet * blackjackPayout); // Original bet + 1.5x win

    case "WIN":
      return bet * 2; // Original bet + 1x win

    case "PUSH":
      return bet; // Return original bet

    case "LOSE":
    case "BUST":
      return 0; // Lose bet

    default:
      return 0;
  }
}

/**
 * Resolve all hands and calculate payouts
 * @param gameState Current game state
 * @param blackjackPayout Blackjack payout ratio
 * @returns Updated game state with results and chip changes
 */
export function resolveHands(
  gameState: GameState,
  blackjackPayout: number = 1.5
): GameState {
  const dealerHand = gameState.players[0].hands[0];
  const updatedPlayers = [...gameState.players];
  let totalPayout = 0;

  // Resolve each player's hands
  for (let i = 1; i < updatedPlayers.length; i++) {
    const player = updatedPlayers[i];

    for (let j = 0; j < player.hands.length; j++) {
      const hand = player.hands[j];
      const result = determineHandResult(hand, dealerHand);
      const payout = calculatePayout(hand, result, blackjackPayout);

      // Update hand result
      updatedPlayers[i].hands[j].result = result;

      // Update player chips
      updatedPlayers[i].chips += payout;

      // Track total payout for user
      if (player.isUser) {
        totalPayout += payout;
      }
    }
  }

  return {
    ...gameState,
    players: updatedPlayers,
    chips: gameState.chips + totalPayout,
    phase: "RESOLVING",
  };
}

/**
 * Check if dealer should peek for blackjack
 * Called after initial deal if dealer shows Ace or 10
 * @param dealerUpCard Dealer's face-up card
 * @returns True if dealer should peek
 */
export function shouldPeekForBlackjack(dealerUpCard: string): boolean {
  return ["A", "10", "J", "Q", "K"].includes(dealerUpCard);
}

/**
 * Get dealer hand description for UI
 * @param hand Dealer's hand
 * @param revealed Whether hole card is revealed
 * @returns Description string
 */
export function getDealerHandDescription(hand: Hand, revealed: boolean): string {
  if (!revealed && hand.cards.length >= 2) {
    // Show only first card
    const upCard = hand.cards[0];
    return `${upCard.rank} + ?`;
  }

  const value = calculateHandValue(hand.cards);
  const isSoft = isSoftHand(hand.cards);
  const blackjack = isBlackjack(hand.cards);
  const busted = isBusted(hand.cards);

  if (blackjack) return "Blackjack!";
  if (busted) return `Bust (${value})`;
  if (isSoft) return `Soft ${value}`;
  return `${value}`;
}

/**
 * Get hand result description for UI
 * @param result Hand result
 * @returns Description string
 */
export function getHandResultDescription(result: HandResult): string {
  switch (result) {
    case "BLACKJACK":
      return "Blackjack!";
    case "WIN":
      return "Win";
    case "LOSE":
      return "Lose";
    case "PUSH":
      return "Push";
    case "BUST":
      return "Bust";
    default:
      return "";
  }
}

/**
 * Get hand result color for UI
 * @param result Hand result
 * @returns Tailwind color class
 */
export function getHandResultColor(result: HandResult): string {
  switch (result) {
    case "BLACKJACK":
    case "WIN":
      return "text-green-500";
    case "LOSE":
    case "BUST":
      return "text-red-500";
    case "PUSH":
      return "text-yellow-500";
    default:
      return "text-white";
  }
}
