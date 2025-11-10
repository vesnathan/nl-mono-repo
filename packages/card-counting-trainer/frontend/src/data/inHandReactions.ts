/**
 * In-hand reactions for AI characters
 *
 * Note: All reaction content has been moved to dialogue
 * This file now re-exports functions for backwards compatibility
 */

import { AICharacter } from "./aiCharacters";
import {
  getGenericInitialReaction,
  getGenericHitReaction,
  getPersonalityReaction as getPersonalityReactionFromSayings,
} from "./dialogue";

/**
 * Get character reaction when dealt initial hand
 * Uses character-specific bigWin reactions for blackjack, generic for others
 */
export function getInitialHandReaction(
  character: AICharacter,
  handValue: number,
  hasBlackjack: boolean,
): string | null {
  // Blackjack - use character-specific bigWin reactions
  if (hasBlackjack) {
    const validReactions = character.reactions.bigWin.filter(
      (reaction) => reaction.contexts.includes("any"),
    );
    if (validReactions.length > 0) {
      const selectedReaction =
        validReactions[Math.floor(Math.random() * validReactions.length)];
      return selectedReaction.text;
    }
  }

  // For other hands, use generic reactions from dialogue
  return getGenericInitialReaction(handValue);
}

/**
 * Get character reaction when hitting and receiving a card
 */
export function getHitReaction(
  character: AICharacter,
  newCard: string,
  oldHandValue: number,
  newHandValue: number,
): string | null {
  return getGenericHitReaction(oldHandValue, newHandValue);
}

/**
 * Get character-specific personality reactions
 */
export function getPersonalityReaction(
  character: AICharacter,
  situation: "bust" | "hit21" | "goodHit" | "badStart",
): string {
  return getPersonalityReactionFromSayings(character.personality, situation);
}
