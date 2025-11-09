import { Card, StrategyAction } from "@/types/game";
import { calculateHandValue, isSoftHand, canSplit } from "./gameActions";
import { GameSettings, DoubleDownRule } from "@/types/gameSettings";

/**
 * Basic Strategy Tables
 * These are the base strategy tables for:
 * - 6 decks
 * - Dealer hits soft 17 (H17)
 * - Double after split allowed (DAS)
 * - Surrender allowed
 *
 * Strategy is dynamically adjusted based on actual game settings
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
 * Check if double down is allowed based on hand value and game rules
 */
function canDoubleByRules(handValue: number, settings: GameSettings): boolean {
  switch (settings.doubleDownRule) {
    case DoubleDownRule.ANY_TWO_CARDS:
      return true;
    case DoubleDownRule.NINE_TEN_ELEVEN:
      return handValue === 9 || handValue === 10 || handValue === 11;
    case DoubleDownRule.TEN_ELEVEN:
      return handValue === 10 || handValue === 11;
    case DoubleDownRule.NOT_ALLOWED:
      return false;
    default:
      return true;
  }
}

/**
 * Get the basic strategy action for a given hand
 * Dynamically adjusts based on game settings
 * @param playerCards Player's cards
 * @param dealerUpCard Dealer's face-up card
 * @param settings Game settings (dealer rules, double rules, etc.)
 * @param canSplitHand Whether the hand can be split (has chips for it)
 * @param canDoubleHand Whether the hand can be doubled (first two cards + has chips)
 * @returns Recommended strategy action
 */
export function getBasicStrategyAction(
  playerCards: Card[],
  dealerUpCard: Card,
  settings: GameSettings,
  canSplitHand: boolean = false,
  canDoubleHand: boolean = false
): StrategyAction {
  const dealerIndex = getDealerIndex(dealerUpCard);
  const handValue = calculateHandValue(playerCards);
  const isSoft = isSoftHand(playerCards);

  // Check for pair splitting first
  if (canSplitHand && canSplit(playerCards)) {
    const pairRank = playerCards[0].rank;
    let action = PAIR_SPLITS[pairRank]?.[dealerIndex];

    // Adjust split strategy based on settings
    if (action === "SP") {
      // If no double after split, be more conservative with 2-2, 3-3, 6-6
      if (!settings.doubleAfterSplit) {
        if ((pairRank === "2" || pairRank === "3") && dealerIndex >= 5) {
          // Don't split 2s/3s vs 7+ if no DAS
          action = "H";
        } else if (pairRank === "6" && dealerIndex >= 4) {
          // Don't split 6s vs 6+ if no DAS
          action = "H";
        }
      }
      if (action === "SP") return action;
    }
  }

  // Check for soft hands (Ace counted as 11)
  if (isSoft) {
    let softAction = SOFT_TOTALS[handValue]?.[dealerIndex];
    if (softAction) {
      // Adjust soft strategy based on dealer hitting soft 17
      if (handValue === 18 && dealerIndex === 0 && !settings.dealerHitsSoft17) {
        // A-7 vs 2: Stand if dealer stands on soft 17 (S17)
        softAction = "S";
      } else if (handValue === 19 && dealerIndex === 4 && settings.dealerHitsSoft17) {
        // A-8 vs 6: Double if dealer hits soft 17 (H17)
        if (canDoubleHand && canDoubleByRules(handValue, settings)) {
          softAction = "D";
        }
      }

      // If strategy says double but can't (by rules or chips), hit instead
      if (softAction === "D") {
        if (!canDoubleHand || !canDoubleByRules(handValue, settings)) {
          return "H";
        }
      }
      return softAction;
    }
  }

  // Hard hands
  let hardAction = HARD_TOTALS[handValue]?.[dealerIndex];
  if (hardAction) {
    // Adjust hard strategy based on dealer hitting soft 17
    if (handValue === 9 && dealerIndex === 0 && settings.dealerHitsSoft17) {
      // 9 vs 2: Double if dealer hits soft 17 (H17)
      if (canDoubleHand && canDoubleByRules(handValue, settings)) {
        hardAction = "D";
      }
    } else if (handValue === 15 && dealerIndex === 8 && !settings.dealerHitsSoft17) {
      // 15 vs 10: Don't surrender if dealer stands on soft 17 (S17)
      if (hardAction === "SU") {
        hardAction = "H";
      }
    }

    // If strategy says double but can't (by rules or chips), hit instead
    if (hardAction === "D") {
      if (!canDoubleHand || !canDoubleByRules(handValue, settings)) {
        return "H";
      }
    }

    // If strategy says surrender but not allowed or available
    if (hardAction === "SU") {
      if (!settings.lateSurrenderAllowed) {
        return "H";
      }
      // Note: Surrender is not implemented in the game yet, so default to hit
      return "H";
    }

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
 * Get a human-readable explanation of the strategy decision
 */
export function getStrategyExplanation(
  action: StrategyAction,
  playerCards: Card[],
  dealerUpCard: Card,
  settings: GameSettings
): string {
  const handValue = calculateHandValue(playerCards);
  const dealerValue = dealerUpCard.rank === "A" ? 11 : dealerUpCard.value;
  const isSoft = isSoftHand(playerCards);
  const isPair = playerCards.length === 2 && playerCards[0].rank === playerCards[1].rank;

  // Pair splits
  if (action === "SP" && isPair) {
    const rank = playerCards[0].rank;
    if (rank === "A") {
      return "Always split Aces - gives you two chances at blackjack!";
    }
    if (rank === "8") {
      return "Always split 8s - a pair of 8s (16) is terrible, but 8 is a strong start.";
    }
    return `Split ${rank}s against dealer ${dealerUpCard.rank} - optimal by basic strategy.`;
  }

  // Surrender
  if (action === "SU") {
    return `Surrender ${handValue} vs ${dealerUpCard.rank} - you'll lose less money over time.`;
  }

  // Soft hands
  if (isSoft) {
    if (action === "D") {
      return `Double soft ${handValue} vs ${dealerUpCard.rank} - dealer is weak, maximize your advantage!`;
    }
    if (action === "H") {
      return `Hit soft ${handValue} - you can't bust with a soft hand, keep improving.`;
    }
    return `Stand on soft ${handValue} vs ${dealerUpCard.rank} - strong hand against dealer.`;
  }

  // Hard hands
  if (action === "D") {
    return `Double ${handValue} vs ${dealerUpCard.rank} - you have the advantage, bet more!`;
  }

  if (action === "S") {
    if (handValue >= 17) {
      return `Stand on ${handValue} - too risky to hit with this total.`;
    }
    if (dealerValue >= 2 && dealerValue <= 6) {
      return `Stand on ${handValue} vs ${dealerUpCard.rank} - dealer is likely to bust.`;
    }
    return `Stand on ${handValue} vs ${dealerUpCard.rank} - optimal play.`;
  }

  if (action === "H") {
    if (handValue <= 11) {
      return `Hit ${handValue} - you can't bust, always take another card.`;
    }
    if (dealerValue >= 7) {
      return `Hit ${handValue} vs ${dealerUpCard.rank} - dealer has a strong upcard.`;
    }
    return `Hit ${handValue} - need to improve against dealer ${dealerUpCard.rank}.`;
  }

  return "Follow basic strategy for optimal play.";
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
