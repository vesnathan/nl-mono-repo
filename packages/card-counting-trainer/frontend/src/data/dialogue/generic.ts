import { AICharacter } from "../aiCharacters";

/**
 * Generic initial hand reactions (when character-specific not available)
 */
export const GENERIC_INITIAL_REACTIONS = {
  twenty: [
    "Twenty! Looking good!",
    "Oh yeah, twenty right here!",
    "Nice! Got a twenty!",
  ],
  badStart: [
    "Ugh, seriously?",
    "Well this is rough...",
    "Not a great start...",
  ],
};

/**
 * Generic hit reactions (when character-specific not available)
 */
export const GENERIC_HIT_REACTIONS = {
  bust: ["BUST! Dammit!", "No! I busted!", "Fuck! Too much!", "Shit! Over 21!"],
  hit21: ["TWENTY-ONE! Perfect!", "Yes! Twenty-one!", "That's it! Twenty-one!"],
  goodHit: (value: number) => [
    `Nice! ${value}!`,
    `Good card! ${value}!`,
    `Perfect! ${value}!`,
  ],
  stuckInDanger: [
    "Come on, not helping...",
    "Still stuck...",
    "Ugh, another bad one...",
  ],
};

/**
 * Personality-specific reactions for specific situations
 * Used for dynamic reactions based on character personality
 */
export const PERSONALITY_REACTIONS: Record<
  AICharacter["personality"],
  Record<"bust" | "hit21" | "goodHit" | "badStart", string>
> = {
  drunk: {
    bust: "*hiccup* BUSTED! Fuck!",
    hit21: "TWENTY-ONE BABY! *slams table*",
    goodHit: "Haha! Not bad!",
    badStart: "Ah shit... *squints at cards*",
  },
  clumsy: {
    bust: "Oh no! I busted! *drops cards*",
    hit21: "Twenty-one?! Really?! *knocks drink*",
    goodHit: "Oh! That's good right?",
    badStart: "Oh dear... this isn't good...",
  },
  chatty: {
    bust: "BUSTED! Just like that deal I lost last month!",
    hit21: "TWENTY-ONE! That's how you DO IT!",
    goodHit: "Nice! Reminds me of this one time...",
    badStart: "Not great, but you know what I always say...",
  },
  superstitious: {
    bust: "BUST! The energy was OFF! I knew it!",
    hit21: "TWENTY-ONE! The universe provides!",
    goodHit: "My crystals were RIGHT!",
    badStart: "Bad energy... I should've cleansed first...",
  },
  cocky: {
    bust: "BUST?! How the FUCK?!",
    hit21: "TWENTY-ONE! Too easy!",
    goodHit: "Of course. I called it.",
    badStart: "Whatever, I've had worse hands...",
  },
  nervous: {
    bust: "BUSTED! Oh god, is that bad?!",
    hit21: "Twenty-one! *nervous sweat* Did I win?!",
    goodHit: "Oh! Is that good? That's good right?!",
    badStart: "*sweating* This feels illegal...",
  },
  lucky: {
    bust: "BUST?! My streak is OVER?!",
    hit21: "TWENTY-ONE! I FELT it coming!",
    goodHit: "Called it! Lucky Larry strikes!",
    badStart: "Hmm, my gut says this'll work out...",
  },
  unlucky: {
    bust: "BUST! Of COURSE! *laughs*",
    hit21: "Twenty-one?! Did that actually happen?!",
    goodHit: "Wait, I got a GOOD card?!",
    badStart: "And here we go... classic me...",
  },
};

/**
 * Helper function to get personality-specific reaction
 */
export function getPersonalityReaction(
  personality: AICharacter["personality"],
  situation: "bust" | "hit21" | "goodHit" | "badStart",
): string {
  return PERSONALITY_REACTIONS[personality][situation];
}

/**
 * Helper function to get generic initial hand reaction
 */
export function getGenericInitialReaction(handValue: number): string | null {
  if (handValue === 20) {
    const reactions = GENERIC_INITIAL_REACTIONS.twenty;
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  if (handValue <= 12) {
    const reactions = GENERIC_INITIAL_REACTIONS.badStart;
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  return null;
}

/**
 * Helper function to get generic hit reaction
 */
export function getGenericHitReaction(
  oldHandValue: number,
  newHandValue: number,
): string | null {
  // Busted
  if (newHandValue > 21) {
    const reactions = GENERIC_HIT_REACTIONS.bust;
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  // Perfect hit
  if (newHandValue === 21) {
    const reactions = GENERIC_HIT_REACTIONS.hit21;
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  // Good card (got to 19-20)
  if (newHandValue >= 19 && oldHandValue < 17) {
    const reactions = GENERIC_HIT_REACTIONS.goodHit(newHandValue);
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  // Bad card but didn't bust (still stuck in danger zone)
  if (newHandValue >= 12 && newHandValue <= 16 && oldHandValue >= 12) {
    // Only 30% chance to complain about mediocre cards
    if (Math.random() < 0.3) {
      const reactions = GENERIC_HIT_REACTIONS.stuckInDanger;
      return reactions[Math.floor(Math.random() * reactions.length)];
    }
  }

  return null;
}
