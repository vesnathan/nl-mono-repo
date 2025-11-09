import { Card, HandResult } from "./game";
import { AICharacter } from "@/data/aiCharacters";

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
}

/**
 * Speech bubble shown above a player/dealer
 */
export interface SpeechBubble {
  playerId: string; // "dealer" or AI player index as string
  message: string;
  position: { left: string; top: string };
  id: string;
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
  | "PLAYER_TURN" // Human player's turn (if seated)
  | "AI_TURNS" // AI players taking their turns
  | "DEALER_TURN" // Dealer playing their hand
  | "RESOLVING" // Calculating payouts and showing results
  | "ROUND_END"; // Hand complete, ready for next hand
