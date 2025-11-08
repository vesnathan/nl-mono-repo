import { Card, StrategyAction } from "@/types/game";
import { calculateHandValue, isSoftHand, canSplit } from "./gameActions";

/**
 * Basic Strategy Tables
 * Based on standard blackjack basic strategy for:
 * - 6 decks
 * - Dealer hits soft 17
 * - Double after split allowed
 * - Surrender allowed
 *
 * Actions:
 * H = Hit
 * S = Stand
 * D = Double (if not allowed, Hit)
 * SP = Split
 * SU = Surrender (if not allowed, Hit)
 */

/**
 * Hard Totals Strategy
 * Rows: Player hand total (5-20)
 * Cols: Dealer up card (2-11, where 11 = Ace)
 */
const HARD_TOTALS: Record<number, StrategyAction[]> = {
  // Player 5-8: Always Hit
  5: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"], // vs 2-A
  6: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
  7: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
  8: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],

  // Player 9: Double vs 3-6, else Hit
  9: ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"], // vs 2-A

  // Player 10: Double vs 2-9, else Hit
  10: ["D", "D", "D", "D", "D", "D", "D", "D", "H", "H"], // vs 2-A

  // Player 11: Double vs 2-10, else Hit
  11: ["D", "D", "D", "D", "D", "D", "D", "D", "D", "D"], // vs 2-A

  // Player 12: Stand vs 4-6, else Hit
  12: ["H", "H", "S", "S", "S", "H", "H", "H", "H", "H"], // vs 2-A

  // Player 13-16: Stand vs 2-6, else Hit/Surrender
  13: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"], // vs 2-A
  14: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
  15: ["S", "S", "S", "S", "S", "H", "H", "H", "SU", "H"], // Surrender vs 10
  16: ["S", "S", "S", "S", "S", "H", "H", "SU", "SU", "SU"], // Surrender vs 9-A

  // Player 17+: Always Stand
  17: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"], // vs 2-A
  18: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  19: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  20: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
};

/**
 * Soft Totals Strategy (hands with Ace counted as 11)
 * Rows: Player hand total (13-21, where 13 = A+2, 21 = A+10)
 * Cols: Dealer up card (2-11)
 */
const SOFT_TOTALS: Record<number, StrategyAction[]> = {
  // A+2, A+3: Double vs 5-6, else Hit
  13: ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"], // A+2 vs 2-A
  14: ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"], // A+3 vs 2-A

  // A+4, A+5: Double vs 4-6, else Hit
  15: ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"], // A+4 vs 2-A
  16: ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"], // A+5 vs 2-A

  // A+6: Double vs 3-6, else Hit
  17: ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"], // A+6 vs 2-A

  // A+7: Stand vs 2, 7-8. Double vs 3-6. Hit vs 9-A
  18: ["S", "D", "D", "D", "D", "S", "S", "H", "H", "H"], // A+7 vs 2-A

  // A+8+: Always Stand
  19: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"], // A+8 vs 2-A
  20: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"], // A+9 vs 2-A
  21: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"], // A+10 vs 2-A (Blackjack)
};

/**
 * Pair Splitting Strategy
 * Rows: Pair rank (A, 2-10)
 * Cols: Dealer up card (2-11)
 */
const PAIR_SPLITS: Record<string, StrategyAction[]> = {
  // A-A: Always Split
  A: ["SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP"], // vs 2-A

  // 2-2, 3-3: Split vs 2-7, else Hit
  "2": ["SP", "SP", "SP", "SP", "SP", "SP", "H", "H", "H", "H"], // vs 2-A
  "3": ["SP", "SP", "SP", "SP", "SP", "SP", "H", "H", "H", "H"],

  // 4-4: Split vs 5-6, else Hit
  "4": ["H", "H", "H", "SP", "SP", "H", "H", "H", "H", "H"], // vs 2-A

  // 5-5: Never Split (treat as 10)
  "5": ["D", "D", "D", "D", "D", "D", "D", "D", "H", "H"], // vs 2-A

  // 6-6: Split vs 2-6, else Hit
  "6": ["SP", "SP", "SP", "SP", "SP", "H", "H", "H", "H", "H"], // vs 2-A

  // 7-7: Split vs 2-7, else Hit
  "7": ["SP", "SP", "SP", "SP", "SP", "SP", "H", "H", "H", "H"], // vs 2-A

  // 8-8: Always Split
  "8": ["SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP"], // vs 2-A

  // 9-9: Split vs 2-9 except 7, else Stand
  "9": ["SP", "SP", "SP", "SP", "SP", "S", "SP", "SP", "S", "S"], // vs 2-A

  // 10-10: Never Split
  "10": ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"], // vs 2-A
  J: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"], // vs 2-A
  Q: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"], // vs 2-A
  K: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"], // vs 2-A
};

/**
 * Get dealer upcard index (0-9) for strategy tables
 * 2-9 = 0-7, 10 = 8, A = 9
 */
function getDealerIndex(dealerCard: Card): number {
  if (dealerCard.rank === "A") return 9;
  if (["10", "J", "Q", "K"].includes(dealerCard.rank)) return 8;
  return parseInt(dealerCard.rank, 10) - 2;
}

/**
 * Get the basic strategy action for a given hand
 * @param playerCards Player's cards
 * @param dealerUpCard Dealer's face-up card
 * @param canSplitHand Whether the hand can be split
 * @param canDoubleHand Whether the hand can be doubled
 * @returns Recommended strategy action
 */
export function getBasicStrategyAction(
  playerCards: Card[],
  dealerUpCard: Card,
  canSplitHand: boolean = false,
  canDoubleHand: boolean = false
): StrategyAction {
  const dealerIndex = getDealerIndex(dealerUpCard);
  const handValue = calculateHandValue(playerCards);

  // Check for pair splitting first
  if (canSplitHand && canSplit(playerCards)) {
    const pairRank = playerCards[0].rank;
    const action = PAIR_SPLITS[pairRank]?.[dealerIndex];
    if (action === "SP") return action;
  }

  // Check for soft hands (Ace counted as 11)
  if (isSoftHand(playerCards)) {
    const softAction = SOFT_TOTALS[handValue]?.[dealerIndex];
    if (softAction) {
      // If strategy says double but can't, hit instead
      if (softAction === "D" && !canDoubleHand) return "H";
      return softAction;
    }
  }

  // Hard hands
  const hardAction = HARD_TOTALS[handValue]?.[dealerIndex];
  if (hardAction) {
    // If strategy says double but can't, hit instead
    if (hardAction === "D" && !canDoubleHand) return "H";
    // If strategy says surrender but can't, hit instead
    if (hardAction === "SU") return "H"; // Simplified: surrender not implemented yet
    return hardAction;
  }

  // Default: Stand on 17+, Hit on 16 or less
  return handValue >= 17 ? "S" : "H";
}

/**
 * Convert strategy action to readable text
 */
export function strategyActionToText(action: StrategyAction): string {
  switch (action) {
    case "H":
      return "Hit";
    case "S":
      return "Stand";
    case "D":
      return "Double";
    case "SP":
      return "Split";
    case "SU":
      return "Surrender";
    default:
      return "Unknown";
  }
}

/**
 * Get suggested bet amount based on true count
 * Kelly Criterion-inspired betting (conservative)
 * @param trueCount Current true count
 * @param minBet Minimum bet
 * @param maxBet Maximum bet
 * @param bankroll Current chip balance
 * @returns Suggested bet amount
 */
export function getSuggestedBet(
  trueCount: number,
  minBet: number,
  maxBet: number,
  bankroll: number
): number {
  // Basic betting spread based on true count
  // TC <= 0: Min bet
  // TC = 1: 2x min bet
  // TC = 2: 4x min bet
  // TC = 3: 6x min bet
  // TC >= 4: 8x min bet (or max bet)

  let betUnits = 1;

  if (trueCount <= 0) {
    betUnits = 1;
  } else if (trueCount === 1) {
    betUnits = 2;
  } else if (trueCount === 2) {
    betUnits = 4;
  } else if (trueCount === 3) {
    betUnits = 6;
  } else {
    betUnits = 8;
  }

  const suggestedBet = minBet * betUnits;

  // Ensure bet is within limits
  const clampedBet = Math.min(Math.max(suggestedBet, minBet), maxBet);

  // Ensure we don't bet more than we have
  return Math.min(clampedBet, bankroll);
}
