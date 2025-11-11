/**
 * Game Settings Types
 * Based on GAME-SETTINGS.md documentation
 */

export enum DealerPeekRule {
  AMERICAN_PEEK = "AMERICAN_PEEK",
  EUROPEAN_NO_PEEK = "EUROPEAN_NO_PEEK",
  EUROPEAN_NO_HOLE_CARD = "EUROPEAN_NO_HOLE_CARD",
}

export enum BlackjackPayout {
  THREE_TO_TWO = "THREE_TO_TWO", // Standard 3:2 (1.5x multiplier)
  SIX_TO_FIVE = "SIX_TO_FIVE", // Terrible 6:5 (1.2x multiplier)
  TWO_TO_ONE = "TWO_TO_ONE", // Rare promotional (2x multiplier)
  EVEN_MONEY = "EVEN_MONEY", // 1:1 (1x multiplier)
}

export enum DoubleDownRule {
  ANY_TWO_CARDS = "ANY_TWO_CARDS",
  NINE_TEN_ELEVEN = "NINE_TEN_ELEVEN",
  TEN_ELEVEN = "TEN_ELEVEN",
  NOT_ALLOWED = "NOT_ALLOWED",
}

export enum CountingSystem {
  HI_LO = "HI_LO",
  KO = "KO",
  HI_OPT_I = "HI_OPT_I",
  HI_OPT_II = "HI_OPT_II",
  OMEGA_II = "OMEGA_II",
}

export interface GameSettings {
  // Deck Configuration
  numberOfDecks: number; // 1, 2, 4, 6, 8
  deckPenetration: number; // 40-90 (percentage)

  // Dealer Rules
  dealerHitsSoft17: boolean;
  dealerPeekRule: DealerPeekRule;

  // Payout Rules
  blackjackPayout: BlackjackPayout;
  insuranceAvailable: boolean;

  // Player Action Rules
  doubleDownRule: DoubleDownRule;
  doubleAfterSplit: boolean;
  maxResplits: number; // 0-3 (0 = no split, 3 = up to 4 hands)
  resplitAces: boolean;
  hitSplitAces: boolean;

  // Surrender Options
  lateSurrenderAllowed: boolean;
  earlySurrenderAllowed: boolean;

  // Counting System
  countingSystem: CountingSystem;
  sideCountAces: boolean;
}

/**
 * Default game settings (Most common casino rules)
 */
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  // Deck Configuration
  numberOfDecks: 6,
  deckPenetration: 75,

  // Dealer Rules
  dealerHitsSoft17: true, // H17 (most common)
  dealerPeekRule: DealerPeekRule.AMERICAN_PEEK,

  // Payout Rules
  blackjackPayout: BlackjackPayout.THREE_TO_TWO,
  insuranceAvailable: true,

  // Player Action Rules
  doubleDownRule: DoubleDownRule.ANY_TWO_CARDS,
  doubleAfterSplit: true,
  maxResplits: 3, // Up to 4 hands
  resplitAces: false, // Most common
  hitSplitAces: false, // Most common

  // Surrender Options
  lateSurrenderAllowed: false,
  earlySurrenderAllowed: false,

  // Counting System
  countingSystem: CountingSystem.HI_LO,
  sideCountAces: false,
};

/**
 * Convert blackjack payout enum to multiplier
 */
export function getBlackjackPayoutMultiplier(payout: BlackjackPayout): number {
  switch (payout) {
    case BlackjackPayout.THREE_TO_TWO:
      return 1.5; // $10 bet wins $15
    case BlackjackPayout.SIX_TO_FIVE:
      return 1.2; // $10 bet wins $12
    case BlackjackPayout.TWO_TO_ONE:
      return 2.0; // $10 bet wins $20
    case BlackjackPayout.EVEN_MONEY:
      return 1.0; // $10 bet wins $10
    default:
      return 1.5;
  }
}

/**
 * Preset configurations for common casino scenarios
 */

export const PRESET_LAS_VEGAS_STRIP: GameSettings = {
  ...DEFAULT_GAME_SETTINGS,
  numberOfDecks: 6,
  dealerHitsSoft17: true,
  blackjackPayout: BlackjackPayout.THREE_TO_TWO,
  doubleAfterSplit: true,
  maxResplits: 3,
  resplitAces: false,
  lateSurrenderAllowed: false,
  deckPenetration: 75,
  dealerPeekRule: DealerPeekRule.AMERICAN_PEEK,
};

export const PRESET_SINGLE_DECK: GameSettings = {
  ...DEFAULT_GAME_SETTINGS,
  numberOfDecks: 1,
  dealerHitsSoft17: false, // S17
  blackjackPayout: BlackjackPayout.THREE_TO_TWO,
  doubleAfterSplit: false, // Restricted in single deck
  maxResplits: 0, // No resplit
  deckPenetration: 60,
  dealerPeekRule: DealerPeekRule.AMERICAN_PEEK,
};

export const PRESET_DOUBLE_DECK: GameSettings = {
  ...DEFAULT_GAME_SETTINGS,
  numberOfDecks: 2,
  dealerHitsSoft17: false, // S17
  blackjackPayout: BlackjackPayout.THREE_TO_TWO,
  doubleAfterSplit: true,
  maxResplits: 3,
  deckPenetration: 65,
  dealerPeekRule: DealerPeekRule.AMERICAN_PEEK,
};

export const PRESET_EUROPEAN: GameSettings = {
  ...DEFAULT_GAME_SETTINGS,
  numberOfDecks: 6,
  dealerHitsSoft17: false, // S17
  blackjackPayout: BlackjackPayout.THREE_TO_TWO,
  doubleAfterSplit: true,
  maxResplits: 3,
  deckPenetration: 75,
  dealerPeekRule: DealerPeekRule.EUROPEAN_NO_HOLE_CARD,
};

export const PRESET_BAD_RULES: GameSettings = {
  ...DEFAULT_GAME_SETTINGS,
  numberOfDecks: 6,
  dealerHitsSoft17: true, // H17
  blackjackPayout: BlackjackPayout.SIX_TO_FIVE, // Terrible payout
  doubleAfterSplit: false,
  maxResplits: 0,
  deckPenetration: 50, // Poor penetration
  dealerPeekRule: DealerPeekRule.AMERICAN_PEEK,
};

/**
 * Check if player can double down with given rules
 */
export function canDoubleDown(
  handValue: number,
  rule: DoubleDownRule,
): boolean {
  switch (rule) {
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
 * Calculate cut card position (number of cards before shuffle)
 */
export function calculateCutCardPosition(
  numberOfDecks: number,
  penetrationPercent: number,
): number {
  const totalCards = numberOfDecks * 52;
  const penetrationDecimal = penetrationPercent / 100;
  const cardsDealtBeforeReshuffle = Math.floor(totalCards * penetrationDecimal);
  return totalCards - cardsDealtBeforeReshuffle;
}
