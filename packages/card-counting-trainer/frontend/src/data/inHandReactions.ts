/**
 * In-hand reactions for AI characters
 *
 * Note: All reaction content and functions have been moved to dialogue
 * This file now re-exports for backwards compatibility
 */

export {
  getInitialHandReaction,
  getHitReaction,
  getPersonalityReactionForCharacter as getPersonalityReaction,
  getGenericInitialReaction,
  getGenericHitReaction,
  getPersonalityReaction as getPersonalityReactionByPersonality,
} from "./dialogue";
