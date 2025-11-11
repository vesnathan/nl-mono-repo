/**
 * Dealer suspicion dialogue based on personality types
 * Dealers notice suspicious play and may comment or call pit boss
 */

import { DealerCharacter } from "../dealerCharacters";

/**
 * Dealer suspicion levels and their dialogue
 */
export interface DealerSuspicionDialogue {
  /** Low suspicion (10-30%) - subtle observations */
  lowSuspicion: string[];
  /** Medium suspicion (30-60%) - more direct comments */
  mediumSuspicion: string[];
  /** High suspicion (60-80%) - warning the player */
  highSuspicion: string[];
  /** Very high suspicion (80%+) - calling pit boss */
  callingPitBoss: string[];
}

/**
 * Suspicion dialogue organized by dealer personality
 */
export const DEALER_SUSPICION_DIALOGUE: Record<
  DealerCharacter["personality"],
  DealerSuspicionDialogue
> = {
  // Former counter - knows the signs, protects the player
  counter: {
    lowSuspicion: [
      "Nice play. Very... textbook.",
      "You've been studying, haven't you?",
      "Interesting bet sizing tonight.",
    ],
    mediumSuspicion: [
      "*whispers* Careful with the spread, boss.",
      "Pit boss is making rounds. Just so you know.",
      "Maybe dial it back a notch? Trust me on this.",
    ],
    highSuspicion: [
      "*quietly* You're good, but you're getting obvious.",
      "Harold's watching from the pit. Blend in a bit.",
      "Counting boss? Don't worry, I got you!",
    ],
    callingPitBoss: [
      // Maria never calls pit boss - she's on your side
      "*nods subtly* You're golden. Keep playing.",
      "*deals slower* Take your time with this one.",
    ],
  },

  // Rookie dealer - completely oblivious
  rookie: {
    lowSuspicion: [
      "Wow, you're really good at this!",
      "How do you know when to bet more? Lucky feeling?",
      "You win a lot! That's so cool!",
    ],
    mediumSuspicion: [
      "You must have a system! Can you teach me?",
      "Do you always bet different amounts? Interesting strategy!",
      "My supervisor said something about 'spreads' but I don't get it.",
    ],
    highSuspicion: [
      "You're winning so much! Beginner's luck?",
      "Should I be noticing something? The pit boss keeps looking over.",
      "Is this normal? You seem really good!",
    ],
    callingPitBoss: [
      // Jenny wouldn't even know when to call - she's clueless
      "I should probably ask my supervisor something... but I forget what!",
      "Um, should I be doing something? The handbook mentioned... um...",
    ],
  },

  // Strict dealer - eagle eye, quick to report
  strict: {
    lowSuspicion: [
      "Bet spread noted.",
      "Watching you closely tonight.",
      "Interesting decision there.",
    ],
    mediumSuspicion: [
      "That's quite a jump in bet size.",
      "I've seen this pattern before.",
      "You're playing awfully... precise.",
    ],
    highSuspicion: [
      "I'm going to need you to keep bets more consistent.",
      "This spread is raising some flags.",
      "Pit boss! Can I get eyes on this table?",
    ],
    callingPitBoss: [
      "Pit boss, got a minute? We need to discuss this player.",
      "Harold, we have a situation here.",
      "I'm calling it. Pit boss en route.",
    ],
  },

  // Friendly dealer - notices but doesn't care much
  friendly: {
    lowSuspicion: [
      "Hey, nice play! You know your stuff.",
      "Someone's been doing their homework!",
      "That's how you do it! Smart betting.",
    ],
    mediumSuspicion: [
      "Haha, you're making the house sweat a little!",
      "If you're smart enough to beat them, more power to ya!",
      "Pit boss might notice the spread, but hey, play your game.",
    ],
    highSuspicion: [
      "*smiles* You're good. Real good. Maybe too good for management's liking.",
      "Between you and me? Cool it on the big jumps when Harold's around.",
      "You do you, but the pit's getting antsy. Fair warning!",
    ],
    callingPitBoss: [
      // Marcus reluctantly calls only under pressure
      "*sighs* Boss, you wanted me to tell you if... yeah.",
      "Management wants a word. Sorry buddy, not my call.",
    ],
  },

  // Oblivious dealer - checked out, barely notices
  oblivious: {
    lowSuspicion: [
      "Hmm? Oh, nice hand.",
      "You say something? Sorry, mind wandered.",
      "Bet's in the circle? Good, good.",
    ],
    mediumSuspicion: [
      "Lotta chips moving around... or is that just me?",
      "What was I thinking about? Oh right, fishing. Your turn.",
      "Pit boss said something earlier... can't remember what.",
    ],
    highSuspicion: [
      "Did someone say something about... what was it?",
      "Oh, you're still here? Time flies when you're... wherever I was.",
      "Is it break time yet? Feels like break time.",
    ],
    callingPitBoss: [
      // Frank wouldn't call even if he should
      "Pit boss wanted something... was it about you? Eh, probably nothing.",
      "*yawns* If it's important, they'll come over themselves.",
    ],
  },

  // Veteran dealer - experienced, knows when it matters
  veteran: {
    lowSuspicion: [
      "You know the game well.",
      "Been playing long?",
      "Solid basic strategy.",
    ],
    mediumSuspicion: [
      "That's a notable spread you're running.",
      "You're tracking something, aren't you?",
      "The math adds up... maybe too well.",
    ],
    highSuspicion: [
      "I've dealt to hundreds of counters. You're good, but not invisible.",
      "Keep it subtle or I'll have to make a call.",
      "You're over the line. Dial it back or we have a problem.",
    ],
    callingPitBoss: [
      "Pit boss, can you evaluate this player's action?",
      "We need a second opinion on this table.",
      "Making the call. This one's too obvious.",
    ],
  },
};

/**
 * Get suspicion threshold for when dealer notices (0-100)
 * Lower number = dealer notices sooner
 */
export function getDealerSuspicionThreshold(dealer: DealerCharacter): number {
  const thresholds: Record<DealerCharacter["personality"], number> = {
    counter: 100, // Maria never reports, threshold doesn't matter
    rookie: 90, // Jenny barely notices
    oblivious: 85, // Frank is checked out
    friendly: 70, // Marcus notices but gives slack
    veteran: 40, // Lisa is experienced
    strict: 25, // Harold is paranoid
  };

  return thresholds[dealer.personality];
}

/**
 * Get suspicion threshold for when dealer calls pit boss (0-100)
 */
export function getDealerReportingThreshold(dealer: DealerCharacter): number {
  const thresholds: Record<DealerCharacter["personality"], number> = {
    counter: 999, // Maria NEVER reports
    rookie: 999, // Jenny doesn't know when to report
    oblivious: 999, // Frank won't bother
    friendly: 90, // Marcus only under extreme pressure
    veteran: 75, // Lisa calls when she's certain
    strict: 60, // Harold calls quickly
  };

  return thresholds[dealer.personality];
}

/**
 * Get appropriate dealer comment based on current suspicion level
 */
export function getDealerSuspicionComment(
  dealer: DealerCharacter,
  dealerSuspicion: number,
): string | null {
  const dialogue = DEALER_SUSPICION_DIALOGUE[dealer.personality];

  // Determine which tier of comments to use
  let pool: string[];
  if (dealerSuspicion >= 80) {
    pool = dialogue.callingPitBoss;
  } else if (dealerSuspicion >= 60) {
    pool = dialogue.highSuspicion;
  } else if (dealerSuspicion >= 30) {
    pool = dialogue.mediumSuspicion;
  } else if (dealerSuspicion >= 10) {
    pool = dialogue.lowSuspicion;
  } else {
    return null; // Not suspicious enough for comment
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
