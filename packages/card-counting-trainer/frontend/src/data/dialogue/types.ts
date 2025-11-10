/**
 * Type definitions for character dialogue system
 */

import type { AICharacter } from "../aiCharacters";

export interface TableSaying {
  characterId: AICharacter["id"];
  text: string;
}

/**
 * Character dialogue organized by character ID
 * Each character has the same structure for consistency
 */
export interface CharacterDialogue {
  characterId: string;
  distractions: string[];
  playerEngagements: string[];
  hardHandSayings: Record<number, string[]>; // 12-21
  softHandSayings: Record<string, string[]>; // "A,2" through "A,10"
  dealerUpCardSayings: Record<string, string[]>; // "2" through "A"

  // Extended dialogue categories (from ai-dialogue-addons)
  preGame?: string[]; // when sitting / buying in
  midGame?: string[]; // while deciding (hit/stand/double/split)
  afterDealerFlip?: string[]; // after dealer reveals hole card / draws out
  banterWithPlayer?: { text: string; isPatreon: boolean }[]; // directed at other players
  banterWithDealer?: string[]; // directed at dealer only
  quirkyActions?: string[]; // short stage directions for UI flavor

  // Strategy-aware decision commentary (shows thinking before action)
  decisionCommentary?: {
    shouldHit?: string[]; // "Should I hit this?"
    shouldStand?: string[]; // "Better stand here"
    confident?: string[]; // "Easy decision"
    uncertain?: string[]; // "Not sure about this..."
  };
}

/**
 * Conversation turn structure - tracks which character is speaking
 */
export interface ConversationTurn {
  characterId: string; // Which character is speaking
  text: string; // What they're saying
}

/**
 * Utility to safely pick a random item
 */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
