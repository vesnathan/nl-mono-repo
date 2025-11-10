/**
 * AI Conversation Management
 * Handles conversation triggers, response options, and suspicion thresholds
 *
 * Note: All dialogue content (conversations, prompts, distractions) has been
 * moved to tableSayings.ts for consolidation. This file now focuses on the
 * conversation system mechanics.
 */

// Re-export conversation content from tableSayings for backwards compatibility
export {
  AI_TO_AI_CONVERSATIONS,
  PLAYER_ENGAGEMENT_PROMPTS,
  getRandomAIConversation,
  getPlayerEngagement,
} from "./tableSayings";

export interface Conversation {
  speaker: string; // character ID or "player"
  message: string;
  requiresPlayerResponse?: boolean; // If true, player must acknowledge
  targetPlayer?: boolean; // If true, directed at the player
}

// Player response options (these will be buttons)
export interface ResponseOption {
  text: string;
  suspicionIncrease: number; // How much ignoring adds to suspicion (0-10)
  type: "friendly" | "neutral" | "ignore";
}

export const RESPONSE_OPTIONS: { [type: string]: ResponseOption[] } = {
  standard: [
    { text: "Yeah, absolutely!", suspicionIncrease: 0, type: "friendly" },
    { text: "Uh-huh", suspicionIncrease: 2, type: "neutral" },
    { text: "Not now", suspicionIncrease: 5, type: "neutral" },
    { text: "*Ignore*", suspicionIncrease: 8, type: "ignore" },
  ],

  question: [
    { text: "Tell me more", suspicionIncrease: 0, type: "friendly" },
    { text: "Maybe", suspicionIncrease: 2, type: "neutral" },
    { text: "I don't think so", suspicionIncrease: 3, type: "neutral" },
    { text: "*Ignore*", suspicionIncrease: 8, type: "ignore" },
  ],

  personal: [
    { text: "I'm in tech", suspicionIncrease: 0, type: "friendly" },
    { text: "Just here for fun", suspicionIncrease: 1, type: "friendly" },
    { text: "I'd rather not say", suspicionIncrease: 4, type: "neutral" },
    { text: "*Ignore*", suspicionIncrease: 8, type: "ignore" },
  ],
};

/**
 * Pit boss attention thresholds
 */
export const SUSPICION_THRESHOLDS = {
  LOW: 0, // 0-20: No attention
  MEDIUM: 20, // 20-40: Dealer starts watching more carefully
  HIGH: 40, // 40-60: Pit boss notices you
  CRITICAL: 60, // 60+: Pit boss approaches, may ask you to leave
};

/**
 * Helper to determine if conversation should happen this hand
 * More conversations when suspicion is high (trying to distract the counter)
 */
export function shouldTriggerConversation(
  handNumber: number,
  suspicionLevel: number,
): boolean {
  const baseChance = 0.3; // 30% chance per hand
  const suspicionBonus = suspicionLevel / 200; // Up to +0.5 at max suspicion
  const totalChance = Math.min(baseChance + suspicionBonus, 0.8);

  return Math.random() < totalChance;
}

/**
 * Helper to determine if conversation should be player-directed
 * Higher suspicion = more likely to be targeted
 */
export function shouldTargetPlayer(suspicionLevel: number): boolean {
  const baseChance = 0.4; // 40% of conversations target player
  const suspicionBonus = suspicionLevel / 100; // Up to +1.0 at max suspicion
  const totalChance = Math.min(baseChance + suspicionBonus, 0.9);

  return Math.random() < totalChance;
}
