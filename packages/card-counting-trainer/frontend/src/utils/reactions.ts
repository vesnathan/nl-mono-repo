import { AIPlayer, PlayerHand } from "@/types/gameState";
import { calculateHandValue, isBlackjack } from "@/lib/gameActions";
import { getInitialHandReaction } from "@/data/inHandReactions";
import { determineHandResult, calculatePayout } from "@/lib/dealer";
import { getBlackjackPayoutMultiplier } from "@/types/gameSettings";
import { BlackjackPayout } from "@/types/gameSettings";

export interface Reaction {
  playerId: string;
  message: string;
  outcome: string;
  position: number;
}

/**
 * Priority order for displaying reactions
 * More interesting reactions are shown first
 */
const REACTION_PRIORITY_ORDER = [
  "bigWin",
  "bigLoss",
  "smallWin",
  "smallLoss",
  "push",
];

/**
 * Generate initial hand reactions for AI players
 * Called after initial cards are dealt
 *
 * @param aiPlayers - Array of AI players
 * @returns Array of reactions to display
 */
export function generateInitialReactions(
  aiPlayers: AIPlayer[],
): Array<{ playerId: string; message: string; outcome: string }> {
  const reactions: Array<{
    playerId: string;
    message: string;
    outcome: string;
  }> = [];

  aiPlayers.forEach((ai) => {
    const handValue = calculateHandValue(ai.hand.cards);
    const hasBlackjack = isBlackjack(ai.hand.cards);
    const reaction = getInitialHandReaction(
      ai.character,
      handValue,
      hasBlackjack,
    );

    if (reaction) {
      const outcomeType = hasBlackjack
        ? "bigWin"
        : handValue <= 12
          ? "bigLoss"
          : "smallWin";
      reactions.push({
        playerId: ai.character.id,
        message: reaction,
        outcome: outcomeType,
      });
    }
  });

  // Limit to 1-2 bubbles with priority
  const sortedReactions = reactions.sort((a, b) => {
    return (
      REACTION_PRIORITY_ORDER.indexOf(a.outcome) -
      REACTION_PRIORITY_ORDER.indexOf(b.outcome)
    );
  });
  const numBubbles = Math.random() < 0.6 ? 1 : 2;
  return sortedReactions.slice(0, numBubbles);
}

/**
 * Generate end-of-hand reactions for AI players
 * Called after dealer turn completes and results are determined
 *
 * @param aiPlayers - Array of AI players
 * @param dealerHand - Dealer's hand
 * @param blackjackPayout - Blackjack payout setting
 * @returns Array of reactions to display
 */
export function generateEndOfHandReactions(
  aiPlayers: AIPlayer[],
  dealerHand: PlayerHand,
  blackjackPayout: BlackjackPayout,
): Reaction[] {
  const reactions: Reaction[] = [];

  const bjPayoutMultiplier = getBlackjackPayoutMultiplier(blackjackPayout);

  aiPlayers.forEach((ai) => {
    const result = determineHandResult(ai.hand, dealerHand);
    const payout = calculatePayout(ai.hand, result, bjPayoutMultiplier);
    const netGain = payout - ai.hand.bet;
    const handValue = calculateHandValue(ai.hand.cards);
    const dealerValue = calculateHandValue(dealerHand.cards);

    // Determine the specific context
    const isBusted = handValue > 21;
    const isDealerBlackjack =
      dealerValue === 21 && dealerHand.cards.length === 2;
    const isDealerWin = !isBusted && result === "LOSE";

    let currentContext: "bust" | "dealerBlackjack" | "dealerWin" | "any" =
      "any";
    if (isBusted) {
      currentContext = "bust";
    } else if (isDealerBlackjack && result === "LOSE") {
      currentContext = "dealerBlackjack";
    } else if (isDealerWin) {
      currentContext = "dealerWin";
    }

    let outcomeType = "push";
    let reactions_pool: Array<{ text: string; contexts: Array<string> }> = [];
    let reactionChance = 0;

    if (result === "BLACKJACK") {
      outcomeType = "bigWin";
      reactions_pool = ai.character.reactions.bigWin;
      reactionChance = 0.8; // Very likely to react to blackjack
    } else if (netGain > ai.hand.bet * 0.5) {
      outcomeType = "bigWin";
      reactions_pool = ai.character.reactions.bigWin;
      reactionChance = 0.7; // Likely to react to big win
    } else if (netGain > 0) {
      outcomeType = "smallWin";
      reactions_pool = ai.character.reactions.smallWin;
      reactionChance = 0.3; // Sometimes react to small win
    } else if (netGain === 0) {
      outcomeType = "push";
      reactions_pool = ai.character.reactions.push;
      reactionChance = 0.1; // Rarely react to push
    } else if (result === "BUST" || netGain < -ai.hand.bet * 0.5) {
      outcomeType = "bigLoss";
      reactions_pool = ai.character.reactions.bigLoss;
      reactionChance = 0.7; // Likely to react to big loss
    } else {
      outcomeType = "smallLoss";
      reactions_pool = ai.character.reactions.smallLoss;
      reactionChance = 0.3; // Sometimes react to small loss
    }

    // Filter reactions by context - only show reactions appropriate for the situation
    const validReactions = reactions_pool.filter(
      (reaction) =>
        reaction.contexts.includes(currentContext) ||
        reaction.contexts.includes("any"),
    );

    // Only add reaction if player decides to react and there are valid messages
    if (validReactions.length > 0 && Math.random() < reactionChance) {
      const selectedReaction =
        validReactions[Math.floor(Math.random() * validReactions.length)];
      reactions.push({
        playerId: ai.character.id,
        message: selectedReaction.text,
        outcome: outcomeType,
        position: ai.position,
      });
    }
  });

  // Limit to 0-2 bubbles with priority (most interesting reactions)
  const sortedReactions = reactions.sort((a, b) => {
    return (
      REACTION_PRIORITY_ORDER.indexOf(a.outcome) -
      REACTION_PRIORITY_ORDER.indexOf(b.outcome)
    );
  });

  // Show 0-2 reactions max
  const maxBubbles = Math.random() < 0.7 ? 1 : 2;
  return sortedReactions.slice(0, maxBubbles);
}
