/**
 * Audio path helpers
 * Maps reactions and dialogue to audio file paths
 */

/**
 * Get audio path for an AI player reaction
 *
 * @param characterId - Character ID (e.g., "drunk-danny")
 * @param reactionType - Type of reaction (bust, hit21, goodHit, badStart, win, loss, dealer_blackjack, distraction)
 * @param variant - Optional variant number (1-7 for distractions, 1-5 for wins/losses)
 * @returns Path to audio file
 */
export function getPlayerAudioPath(
  characterId: string,
  reactionType:
    | "bust"
    | "hit21"
    | "goodHit"
    | "badStart"
    | "win"
    | "loss"
    | "dealer_blackjack"
    | "distraction",
  variant?: number
): string {
  // For single reactions (bust, hit21, goodHit, badStart), always use _01
  if (
    ["bust", "hit21", "goodHit", "badStart"].includes(reactionType) &&
    !variant
  ) {
    return `/audio/players/${characterId}/${reactionType}_01.mp3`;
  }

  // For multi-variant reactions (win, loss, dealer_blackjack, distraction)
  if (!variant) {
    // Random variant
    let maxVariant = 5; // Default for win/loss/dealer_blackjack
    if (reactionType === "distraction") {
      maxVariant = 7;
    }
    variant = Math.floor(Math.random() * maxVariant) + 1;
  }

  const paddedVariant = variant.toString().padStart(2, "0");
  return `/audio/players/${characterId}/${reactionType}_${paddedVariant}.mp3`;
}

/**
 * Get audio path for dealer voice line
 *
 * @param dealerId - Dealer ID (e.g., "maria-counter")
 * @param voiceLine - Type of voice line
 * @returns Path to audio file
 */
export function getDealerAudioPath(
  dealerId: string,
  voiceLine:
    | "place_bets"
    | "no_more_bets"
    | "dealer_has_17"
    | "dealer_has_18"
    | "dealer_has_19"
    | "dealer_has_20"
    | "dealer_has_21"
    | "dealer_busts"
    | "blackjack"
    | "insurance"
    | "greet_welcome"
    | "greet_good_luck"
    | "farewell_thanks"
    | "session_complete"
    | "react_nice_hand"
    | "react_tough_break"
    | "react_well_played"
    | "react_better_luck"
    | "react_house_wins"
): string {
  return `/audio/dealers/${dealerId}/${voiceLine}_01.mp3`;
}

/**
 * Map reaction outcome type to audio reaction type
 *
 * @param outcomeType - Outcome from reactions.ts (bigWin, smallWin, push, smallLoss, bigLoss)
 * @param context - Optional context (bust, blackjack, dealerBlackjack, dealerWin)
 * @returns Audio reaction type
 */
export function mapOutcomeToAudioType(
  outcomeType: "bigWin" | "smallWin" | "push" | "smallLoss" | "bigLoss",
  context?: "bust" | "blackjack" | "dealerBlackjack" | "dealerWin" | "any"
): "bust" | "win" | "loss" | "dealer_blackjack" {
  // Context-specific mappings
  if (context === "bust") return "bust";
  if (context === "dealerBlackjack") return "dealer_blackjack";

  // Outcome-based mappings
  if (outcomeType === "bigWin" || outcomeType === "smallWin") return "win";
  if (outcomeType === "bigLoss" || outcomeType === "smallLoss") return "loss";

  // Default fallback
  return "loss";
}

/**
 * Get random distraction audio for a character
 *
 * @param characterId - Character ID
 * @returns Path to random distraction audio
 */
export function getRandomDistractionAudio(characterId: string): string {
  return getPlayerAudioPath(characterId, "distraction");
}
