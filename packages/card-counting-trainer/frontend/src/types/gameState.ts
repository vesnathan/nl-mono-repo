import { AICharacter } from "@/data/aiCharacters";
import { Card, HandResult } from "./game";

/**
 * Represents a hand of cards for a player, AI, or dealer
 */
export interface PlayerHand {
  cards: Card[];
  bet: number;
  result?: HandResult;
}

/**
 * Represents an AI player at the table
 */
export interface AIPlayer {
  character: AICharacter;
  hand: PlayerHand;
  chips: number;
  position: number; // Seat position (0-7)
  insuranceBet?: number; // Insurance bet amount (if taken)
}

/**
 * Speech bubble shown above a player/dealer
 * Each player has one persistent bubble that shows/hides
 */
export interface SpeechBubble {
  playerId: string; // "dealer" or AI player character ID
  message: string;
  position: { left: string; top: string };
  visible: boolean; // Whether the bubble is currently visible
  hideTimeoutId?: number; // Timeout ID for hiding the bubble
  isDealer?: boolean; // True if this is a dealer speech bubble (changes pointer direction)
}

/**
 * Win/loss indicator bubble shown after hand resolution
 */
export interface WinLossBubbleData {
  id: string;
  result: "win" | "lose" | "push" | "blackjack";
  position: { left: string; top: string };
}

/**
 * Active conversation prompt requiring player response
 */
export interface ActiveConversation {
  id: string;
  speakerId: string; // AI character id or "dealer"
  speakerName: string;
  question: string;
  choices: Array<{
    text: string;
    suspicionChange: number;
  }>;
  position: { left: string; top: string };
}

/**
 * Flying card animation data
 */
export interface FlyingCardData {
  id: string;
  card: Card;
  fromPosition: { left: string; top: string };
  toPosition: { left: string; top: string };
}

/**
 * Game phase enum - represents the current state of the game
 */
export type GamePhase =
  | "BETTING" // Players placing bets
  | "DEALING" // Initial cards being dealt
  | "INSURANCE" // Offering insurance when dealer shows Ace
  | "PLAYER_TURN" // Human player's turn (if seated)
  | "AI_TURNS" // AI players taking their turns
  | "DEALER_TURN" // Dealer playing their hand
  | "RESOLVING" // Calculating payouts and showing results
  | "ROUND_END"; // Hand complete, ready for next hand
