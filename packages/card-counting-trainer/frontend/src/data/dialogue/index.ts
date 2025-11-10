/**
 * Main dialogue export file
 * Aggregates all character dialogue and helper functions
 */

// Export types
export * from "./types";

// Import all character dialogues
import { drunkDanny } from "./characters/drunk-danny";
import { clumsyClaire } from "./characters/clumsy-claire";
import { chattyCarlos } from "./characters/chatty-carlos";
import { superstitiousSusan } from "./characters/superstitious-susan";
import { cockyKyle } from "./characters/cocky-kyle";
import { nervousNancy } from "./characters/nervous-nancy";
import { luckyLarry } from "./characters/lucky-larry";
import { unluckyUrsula } from "./characters/unlucky-ursula";

// Export character dialogues individually
export {
  drunkDanny,
  clumsyClaire,
  chattyCarlos,
  superstitiousSusan,
  cockyKyle,
  nervousNancy,
  luckyLarry,
  unluckyUrsula,
};

// Build CHARACTER_DIALOGUE object from individual character files
import { CharacterDialogue } from "./types";

export const CHARACTER_DIALOGUE: Record<string, CharacterDialogue> = {
  "drunk-danny": drunkDanny,
  "clumsy-claire": clumsyClaire,
  "chatty-carlos": chattyCarlos,
  "superstitious-susan": superstitiousSusan,
  "cocky-kyle": cockyKyle,
  "nervous-nancy": nervousNancy,
  "lucky-larry": luckyLarry,
  "unlucky-ursula": unluckyUrsula,
};

// Export conversations
export {
  AI_TO_AI_CONVERSATIONS,
  getRandomAIConversation,
} from "./conversations";

// Export generic reactions
export {
  GENERIC_INITIAL_REACTIONS,
  GENERIC_HIT_REACTIONS,
  PERSONALITY_REACTIONS,
  getPersonalityReaction,
  getGenericInitialReaction,
  getGenericHitReaction,
} from "./generic";

// Export hand-based sayings
export {
  SAYINGS_BY_TOTAL,
  SOFT_TOTAL_SAYINGS,
  VS_DEALER_UPCARD,
} from "./sayings";

// Import types and data for helper functions
import { pick } from "./types";
import {
  SAYINGS_BY_TOTAL,
  SOFT_TOTAL_SAYINGS,
  VS_DEALER_UPCARD,
} from "./sayings";

/**
 * Helper function to get a random saying for a specific total
 */
export function getRandomSayingForTotal(
  characterId: string,
  total: number,
): string | null {
  const sayings = SAYINGS_BY_TOTAL[total];
  if (!sayings) return null;

  const characterSayings = sayings.filter((s) => s.characterId === characterId);
  if (characterSayings.length === 0) return null;

  return characterSayings[Math.floor(Math.random() * characterSayings.length)]
    .text;
}

/**
 * Helper function to get a random soft hand saying
 */
export function getRandomSoftHandSaying(
  characterId: string,
  aceCardRank: string,
): string | null {
  const key = `A,${aceCardRank}`;
  const sayings = SOFT_TOTAL_SAYINGS[key];
  if (!sayings) return null;

  const characterSayings = sayings.filter((s) => s.characterId === characterId);
  if (characterSayings.length === 0) return null;

  return characterSayings[Math.floor(Math.random() * characterSayings.length)]
    .text;
}

/**
 * Helper function to get a random dealer up-card saying
 */
export function getRandomDealerUpCardSaying(
  characterId: string,
  dealerUpCardRank: string,
): string | null {
  const sayings =
    VS_DEALER_UPCARD[dealerUpCardRank as keyof typeof VS_DEALER_UPCARD];
  if (!sayings) return null;

  const characterSayings = sayings.filter((s) => s.characterId === characterId);
  if (characterSayings.length === 0) return null;

  return characterSayings[Math.floor(Math.random() * characterSayings.length)]
    .text;
}

/**
 * Helper function to get a random distraction for a character
 */
export function getRandomDistraction(characterId: string): string | null {
  const characterDialogue = CHARACTER_DIALOGUE[characterId];
  if (!characterDialogue || characterDialogue.distractions.length === 0)
    return null;

  return characterDialogue.distractions[
    Math.floor(Math.random() * characterDialogue.distractions.length)
  ];
}

/**
 * Questions/comments directed at the player that require a response
 * Dynamically generated from CHARACTER_DIALOGUE for consistency
 */
export const PLAYER_ENGAGEMENT_PROMPTS: { [characterId: string]: string[] } =
  Object.fromEntries(
    Object.entries(CHARACTER_DIALOGUE).map(([id, dialogue]) => [
      id,
      dialogue.playerEngagements,
    ]),
  );

/**
 * Helper to get random player engagement for a character
 */
export function getPlayerEngagement(characterId: string): string | null {
  const prompts = PLAYER_ENGAGEMENT_PROMPTS[characterId];
  if (!prompts || prompts.length === 0) return null;

  return prompts[Math.floor(Math.random() * prompts.length)];
}

// Re-export pick utility
export { pick };

// ============================================================================
// IN-HAND REACTION HELPERS
// ============================================================================

import { AICharacter } from "../aiCharacters";
import {
  getGenericInitialReaction,
  getGenericHitReaction,
  getPersonalityReaction as getPersonalityReactionFromGeneric,
} from "./generic";

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
    const validReactions = character.reactions.bigWin.filter((reaction) =>
      reaction.contexts.includes("any"),
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
 * @deprecated Use getPersonalityReaction from ./generic directly
 */
export function getPersonalityReactionForCharacter(
  character: AICharacter,
  situation: "bust" | "hit21" | "goodHit" | "badStart",
): string {
  return getPersonalityReactionFromGeneric(character.personality, situation);
}
