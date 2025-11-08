// Card types
export type Suit = "H" | "D" | "C" | "S"; // Hearts, Diamonds, Clubs, Spades
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // Blackjack value (1-11)
  count: number; // Hi-Lo count value (-1, 0, +1)
}

// Hand types
export interface Hand {
  cards: Card[];
  bet: number;
  result?: HandResult;
}

export type HandResult = "WIN" | "LOSE" | "PUSH" | "BLACKJACK" | "BUST";

// Player types
export interface Player {
  position: number; // 0 = dealer, 1-8 = players
  hands: Hand[];
  chips: number;
  isUser: boolean;
  isDealer: boolean;
}

// Game state types
export type GamePhase = "BETTING" | "DEALING" | "PLAYER_TURN" | "DEALER_TURN" | "RESOLVING" | "GAME_OVER";

export interface GameState {
  // Deck management
  shoe: Card[];
  cardsDealt: number;
  dealerCutCard: number;
  numDecks: number;

  // Counting
  runningCount: number;
  trueCount: number;

  // Players
  players: Player[];
  currentPlayerIndex: number; // Which player's turn (0 = dealer)
  currentHandIndex: number; // Which hand if player split

  // Game flow
  phase: GamePhase;
  dealerRevealed: boolean;

  // Scoring
  score: number;
  streak: number;
  longestStreak: number;
  scoreMultiplier: number; // 1.0 - 2.0, resets on count peek
  chips: number;
}

// Action types
export type PlayerAction = "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "SURRENDER";

// Basic strategy recommendation
export type StrategyAction = "H" | "S" | "D" | "SP" | "SU";
