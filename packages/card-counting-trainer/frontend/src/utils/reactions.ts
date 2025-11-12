import { AIPlayer, PlayerHand } from "@/types/gameState";
import { calculateHandValue, isBlackjack } from "@/lib/gameActions";
import {
  getInitialHandReaction,
  getRandomDealerUpCardSaying,
  getPersonalityReaction,
  getEndOfHandReaction,
} from "@/data/dialogue";
import { determineHandResult, calculatePayout } from "@/lib/dealer";
import {
  getBlackjackPayoutMultiplier,
  BlackjackPayout,
} from "@/types/gameSettings";

export interface Reaction {
  playerId: string;
  message: string;
  outcome: string;
  position: number;
  audioType?: "bust" | "win" | "loss" | "dealer_blackjack" | "distraction";
  audioPriority?: number; // AudioPriority enum value
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
 * @param dealerUpCard - Optional dealer's up card for context-aware reactions
 * @returns Array of reactions to display
 */
export function generateInitialReactions(
  aiPlayers: AIPlayer[],
  dealerUpCard?: { rank: string; suit: string },
): Array<{
  playerId: string;
  message: string;
  outcome: string;
  audioType?: "badStart" | "goodHit";
  audioPriority?: number;
}> {
  const reactions: Array<{
    playerId: string;
    message: string;
    outcome: string;
    audioType?: "badStart" | "goodHit";
    audioPriority?: number;
  }> = [];

  aiPlayers.forEach((ai) => {
    const handValue = calculateHandValue(ai.hand.cards);
    const hasBlackjack = isBlackjack(ai.hand.cards);

    // Determine reaction chance based on hand quality
    let reactionChance = 0.02; // Default: only 2% chance to react
    if (hasBlackjack) {
      reactionChance = 0.2; // 20% chance to react to blackjack
    } else if (handValue >= 20) {
      reactionChance = 0.08; // 8% chance to react to 20-21
    } else if (handValue <= 12) {
      reactionChance = 0.05; // 5% chance to react to bad hand
    }

    // Skip most reactions
    if (Math.random() > reactionChance) {
      return;
    }

    // Try dealer upcard reaction first (15% chance when dealer card is provided)
    let reaction: string | null = null;
    if (dealerUpCard && Math.random() < 0.15) {
      reaction = getRandomDealerUpCardSaying(
        ai.character.id,
        dealerUpCard.rank,
      );
    }

    // Fallback to hand reaction
    if (!reaction) {
      reaction = getInitialHandReaction(
        ai.character,
        handValue,
        hasBlackjack,
        dealerUpCard,
      );
    }

    if (reaction) {
      const outcomeType = hasBlackjack
        ? "bigWin"
        : handValue <= 12
          ? "bigLoss"
          : "smallWin";

      // Determine audio type based on hand value
      let audioType: "badStart" | "goodHit" | undefined;
      if (handValue <= 12) {
        audioType = "badStart";
      } else if (handValue >= 19) {
        audioType = "goodHit";
      }

      reactions.push({
        playerId: ai.character.id,
        message: reaction,
        outcome: outcomeType,
        audioType,
        audioPriority: 0, // LOW priority for initial reactions
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
 * Generate immediate bust reaction for a player who just busted
 * @param ai - AI player who busted
 * @returns Reaction or null
 */
export function generateBustReaction(ai: AIPlayer): Reaction | null {
  // Use personality-specific bust reaction from dialogue system
  // 70% chance to react to bust
  if (Math.random() < 0.7) {
    const bustMessage = getPersonalityReaction(
      ai.character.personality,
      "bust",
    );
    return {
      playerId: ai.character.id,
      message: bustMessage,
      outcome: "bigLoss",
      position: ai.position,
    };
  }
  return null;
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

    // Skip bust reactions - they were already shown when the player busted
    if (isBusted) {
      return;
    }
    const isPlayerBlackjack = result === "BLACKJACK";
    const isDealerBlackjack =
      dealerValue === 21 && dealerHand.cards.length === 2;
    const isDealerWin = !isBusted && result === "LOSE";

    let currentContext:
      | "bust"
      | "blackjack"
      | "dealerBlackjack"
      | "dealerWin"
      | "any" = "any";
    if (isBusted) {
      currentContext = "bust";
    } else if (isPlayerBlackjack) {
      currentContext = "blackjack";
    } else if (isDealerBlackjack && result === "LOSE") {
      currentContext = "dealerBlackjack";
    } else if (isDealerWin) {
      currentContext = "dealerWin";
    }

    // Determine outcome type and reaction chance
    let outcomeType: "bigWin" | "smallWin" | "push" | "smallLoss" | "bigLoss" =
      "push";
    let reactionChance = 0;

    if (result === "BLACKJACK") {
      outcomeType = "bigWin";
      reactionChance = 0.8; // Very likely to react to blackjack
    } else if (netGain > ai.hand.bet * 0.5) {
      outcomeType = "bigWin";
      reactionChance = 0.7; // Likely to react to big win
    } else if (netGain > 0) {
      outcomeType = "smallWin";
      reactionChance = 0.3; // Sometimes react to small win
    } else if (netGain === 0) {
      outcomeType = "push";
      reactionChance = 0.1; // Rarely react to push
    } else if (result === "BUST" || netGain < -ai.hand.bet * 0.5) {
      outcomeType = "bigLoss";
      reactionChance = 0.7; // Likely to react to big loss
    } else {
      outcomeType = "smallLoss";
      reactionChance = 0.3; // Sometimes react to small loss
    }

    // Get reaction from dialogue system
    if (Math.random() < reactionChance) {
      const reactionMessage = getEndOfHandReaction(
        ai.character,
        outcomeType,
        currentContext,
      );

      if (reactionMessage) {
        // Determine audio type and priority based on outcome and context
        let audioType: "win" | "loss" | "dealer_blackjack" = "loss";
        let audioPriority = 1; // NORMAL

        if (currentContext === "dealerBlackjack") {
          audioType = "dealer_blackjack";
          audioPriority = 2; // HIGH
        } else if (outcomeType === "bigWin" || outcomeType === "smallWin") {
          audioType = "win";
          audioPriority = 1; // NORMAL
        } else {
          audioType = "loss";
          audioPriority = 1; // NORMAL
        }

        reactions.push({
          playerId: ai.character.id,
          message: reactionMessage,
          outcome: outcomeType,
          position: ai.position,
          audioType,
          audioPriority,
        });
      }
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
