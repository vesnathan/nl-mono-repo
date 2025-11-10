/**
 * Main dialogue export file
 * Aggregates all character dialogue and helper functions
 */

// Export types
export * from "./types";

// Import types and utilities
import { pick, TableSaying } from "./types";

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

// ============================================================================
// GENERIC REACTIONS
// ============================================================================

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

// ============================================================================
// HAND-BASED SAYINGS
// ============================================================================

/**
 * Hand-based character sayings organized by hand total
 * Extracted from tableSayings.ts for better modularity
 */

export const SAYINGS_BY_TOTAL: Record<number, TableSaying[]> = {
  12: [
    // Drunk Danny
    {
      characterId: "drunk-danny",
      text: "Twelve? That's the 'order another whiskey' number.",
    },
    {
      characterId: "drunk-danny",
      text: "Hit me soft… *hic*… not too hard, I bust easy on 12.",
    },
    {
      characterId: "drunk-danny",
      text: "Every time I get 12, I swear the dealer starts smilin'.",
    },

    // Clumsy Claire
    {
      characterId: "clumsy-claire",
      text: "Twelve… oh gosh, I always mess this one up!",
    },
    {
      characterId: "clumsy-claire",
      text: "Is twelve bad? I mean… it feels unlucky. Oops—my chips!",
    },
    {
      characterId: "clumsy-claire",
      text: "Twelve it is—*drops card*—sorry! Sorry!",
    },

    // Chatty Carlos
    {
      characterId: "chatty-carlos",
      text: "Twelve reminds me of Q4 sales—could go either way.",
    },
    {
      characterId: "chatty-carlos",
      text: "12 is where discipline wins. You know, like margins.",
    },
    {
      characterId: "chatty-carlos",
      text: "With 12, you follow the plan. In business and blackjack.",
    },

    // Superstitious Susan
    {
      characterId: "superstitious-susan",
      text: "Twelve is a pause card—the universe says 'breathe.'",
    },
    {
      characterId: "superstitious-susan",
      text: "My crystal hates 12. We must proceed gently.",
    },
    {
      characterId: "superstitious-susan",
      text: "Twelve's energy is brittle. Don't anger the shoe.",
    },

    // Cocky Kyle
    {
      characterId: "cocky-kyle",
      text: "Twelve? I'll still outplay the table. Watch.",
    },
    {
      characterId: "cocky-kyle",
      text: "12 is just foreplay before I pull a face card and flex.",
    },
    {
      characterId: "cocky-kyle",
      text: "Give me the ten—I like living on the edge.",
    },

    // Nervous Nancy
    {
      characterId: "nervous-nancy",
      text: "Oh no, 12… this is where I always bust, right?",
    },
    {
      characterId: "nervous-nancy",
      text: "Is there a camera on me? I swear 12 is a setup.",
    },
    {
      characterId: "nervous-nancy",
      text: "Okay, okay—12. I can do this. I THINK I can…",
    },

    // Lucky Larry
    {
      characterId: "lucky-larry",
      text: "12? My gut says this one's magic—hit me!",
    },
    {
      characterId: "lucky-larry",
      text: "I win with 12 all the time. Don't ask me why!",
    },
    {
      characterId: "lucky-larry",
      text: "Twelve's my Tuesday number. It's golden.",
    },

    // Unlucky Ursula
    {
      characterId: "unlucky-ursula",
      text: "12? Cool, I'll bust on a 10—watch this art form.",
    },
    {
      characterId: "unlucky-ursula",
      text: "Twelve and me? We have a long, tragic history.",
    },
    {
      characterId: "unlucky-ursula",
      text: "If anyone can ruin a 12, it's me. Stand back.",
    },
  ],

  13: [
    {
      characterId: "drunk-danny",
      text: "Lucky 13? Buddy, my luck left with my ex.",
    },
    {
      characterId: "drunk-danny",
      text: "Thirteen… feels like a trap with free peanuts.",
    },
    {
      characterId: "drunk-danny",
      text: "I'll hit it—what's the worst that could happen? Don't answer.",
    },

    {
      characterId: "clumsy-claire",
      text: "Oh no, thirteen… I always trip here. Literally.",
    },
    {
      characterId: "clumsy-claire",
      text: "Is 13 cursed? Because I just spilled my drink again.",
    },
    {
      characterId: "clumsy-claire",
      text: "Thirteen. Deep breath. Don't bump the chips…",
    },

    {
      characterId: "chatty-carlos",
      text: "13's about risk management. I preach this to my sales team.",
    },
    {
      characterId: "chatty-carlos",
      text: "We respect 13. Bad optics to go wild.",
    },
    {
      characterId: "chatty-carlos",
      text: "I've seen folks implode on 13. Not me—I budget it.",
    },

    {
      characterId: "superstitious-susan",
      text: "Thirteen vibrates weird. Sage the shoe!",
    },
    {
      characterId: "superstitious-susan",
      text: "If a black cat walks past, I'm out with this 13.",
    },
    {
      characterId: "superstitious-susan",
      text: "I'm waiting for a sign… thirteen needs a sign.",
    },

    {
      characterId: "cocky-kyle",
      text: "13 is cute. I make 21 out of anything.",
    },
    { characterId: "cocky-kyle", text: "Hit me—I don't play scared money." },
    {
      characterId: "cocky-kyle",
      text: "If I bust, I double next hand. That's alpha math.",
    },

    {
      characterId: "nervous-nancy",
      text: "Thirteen?! Are they testing me? Is this a sting?",
    },
    {
      characterId: "nervous-nancy",
      text: "I read a chapter about 13… I forgot what it said.",
    },
    {
      characterId: "nervous-nancy",
      text: "Please tell me what the book would do. Quietly.",
    },

    {
      characterId: "lucky-larry",
      text: "13's hot tonight—I can feel it in my elbow.",
    },
    { characterId: "lucky-larry", text: "Watch this 13 turn into magic—bam!" },
    {
      characterId: "lucky-larry",
      text: "I once hit 13 five times in a row and won. True story.",
    },

    {
      characterId: "unlucky-ursula",
      text: "Thirteen? Perfect. I collect cursed numbers.",
    },
    {
      characterId: "unlucky-ursula",
      text: "If the dealer shows a 10, I'll pre-sign the loss slip.",
    },
    {
      characterId: "unlucky-ursula",
      text: "13 is my brand. My therapist knows.",
    },
  ],

  14: [
    {
      characterId: "drunk-danny",
      text: "Fourteen… feels like last call: risky and loud.",
    },
    {
      characterId: "drunk-danny",
      text: "I either bust or brag. Both are fun.",
    },
    { characterId: "drunk-danny", text: "Hit the sad number. Let's dance." },

    {
      characterId: "clumsy-claire",
      text: "Fourteen scares me—I always nudge the table here.",
    },
    {
      characterId: "clumsy-claire",
      text: "14? I'll try not to knock my stack again.",
    },
    {
      characterId: "clumsy-claire",
      text: "Is it weird my hands shake more on 14?",
    },

    {
      characterId: "chatty-carlos",
      text: "14's a KPI: keep potential intact, don't overreach.",
    },
    {
      characterId: "chatty-carlos",
      text: "I've closed deals from worse than 14.",
    },
    {
      characterId: "chatty-carlos",
      text: "14? We play the odds, not the ego.",
    },

    {
      characterId: "superstitious-susan",
      text: "Fourteen is a 'don't poke the spirits' number.",
    },
    {
      characterId: "superstitious-susan",
      text: "Let me align my tiger's eye—14 is finicky.",
    },
    {
      characterId: "superstitious-susan",
      text: "If the candle flickers, I'm standing on 14.",
    },

    {
      characterId: "cocky-kyle",
      text: "14's fine. I print money from worse spots.",
    },
    { characterId: "cocky-kyle", text: "Hit. I'm here to win, not journal." },
    { characterId: "cocky-kyle", text: "Dealer's sweating. I can smell it." },

    {
      characterId: "nervous-nancy",
      text: "14 is the panic number. I'm officially panicking.",
    },
    {
      characterId: "nervous-nancy",
      text: "If I hit, I bust. If I stand, I lose. Amazing.",
    },
    {
      characterId: "nervous-nancy",
      text: "Can someone cough if I should hit? Subtly?",
    },

    {
      characterId: "lucky-larry",
      text: "14's where legends are made. Hit me!",
    },
    {
      characterId: "lucky-larry",
      text: "My lucky streak LOVES a 14. Don't blink.",
    },
    {
      characterId: "lucky-larry",
      text: "If I win this 14, drinks are on the cosmos.",
    },

    {
      characterId: "unlucky-ursula",
      text: "14 is a long walk to a short bust.",
    },
    {
      characterId: "unlucky-ursula",
      text: "If I stand on 14, dealer flips a 20. Trust the process.",
    },
    {
      characterId: "unlucky-ursula",
      text: "14 and I are on a first-name basis: 'Hi, Loss.'",
    },
  ],

  15: [
    { characterId: "drunk-danny", text: "Fifteen—the devil's bar tab." },
    {
      characterId: "drunk-danny",
      text: "Whatever I do, it's wrong—so I'll make it loud.",
    },
    {
      characterId: "drunk-danny",
      text: "Hit it. Regret is tomorrow Danny's problem.",
    },

    {
      characterId: "clumsy-claire",
      text: "15… I always knock something over right before I bust.",
    },
    {
      characterId: "clumsy-claire",
      text: "Fifteen is so mean. Please be kind, deck.",
    },
    {
      characterId: "clumsy-claire",
      text: "I'll decide as soon as I stop shaking. Sorry!",
    },

    {
      characterId: "chatty-carlos",
      text: "15 demands discipline—like payroll.",
    },
    {
      characterId: "chatty-carlos",
      text: "We minimize downside on 15. That's leadership.",
    },
    {
      characterId: "chatty-carlos",
      text: "I've seen fortunes die on 15. Not mine.",
    },

    {
      characterId: "superstitious-susan",
      text: "My moon chart says stand still on 15.",
    },
    {
      characterId: "superstitious-susan",
      text: "Fifteen feels karmically fragile.",
    },
    {
      characterId: "superstitious-susan",
      text: "Don't touch your cards—15 attracts chaos.",
    },

    { characterId: "cocky-kyle", text: "15? Dealer's cooked. Hit me." },
    {
      characterId: "cocky-kyle",
      text: "If I bust, I raise. That's how winners learn.",
    },
    { characterId: "cocky-kyle", text: "Fifteen is a speed bump for legends." },

    {
      characterId: "nervous-nancy",
      text: "15 is statistically horrible. I memorized that.",
    },
    { characterId: "nervous-nancy", text: "If I breathe wrong, I lose 15." },
    { characterId: "nervous-nancy", text: "I'll… stand? No, hit. No—oh god." },

    { characterId: "lucky-larry", text: "15? My lucky elbow says go for it!" },
    {
      characterId: "lucky-larry",
      text: "I've won too many 15s to be scared now.",
    },
    { characterId: "lucky-larry", text: "Trust the vibe—15's a sleeper win." },

    {
      characterId: "unlucky-ursula",
      text: "15 is where dreams come to stub their toe.",
    },
    {
      characterId: "unlucky-ursula",
      text: "If I don't bust, the dealer pulls a 6 to a 21. Watch.",
    },
    {
      characterId: "unlucky-ursula",
      text: "Fifteen and I need couples therapy.",
    },
  ],

  16: [
    {
      characterId: "drunk-danny",
      text: "Sixteen—the officially worst hangover.",
    },
    { characterId: "drunk-danny", text: "Hit me, I fear nothing but Mondays." },
    { characterId: "drunk-danny", text: "Stand? Hit? Bartender? Surprise me." },

    {
      characterId: "clumsy-claire",
      text: "16 makes my palms sweaty. Sorry if I… *bump*—oh no.",
    },
    {
      characterId: "clumsy-claire",
      text: "I always drop something on 16—usually hopes.",
    },
    {
      characterId: "clumsy-claire",
      text: "Okay, steady hands. 16 can't scare me forever.",
    },

    {
      characterId: "chatty-carlos",
      text: "16 is a layoffs-or-late-hours decision.",
    },
    {
      characterId: "chatty-carlos",
      text: "We follow the book on 16. That's non-negotiable.",
    },
    {
      characterId: "chatty-carlos",
      text: "I delegate emotions on 16. Just math.",
    },

    {
      characterId: "superstitious-susan",
      text: "Sixteen is a trickster spirit. Tread light.",
    },
    {
      characterId: "superstitious-susan",
      text: "If my rabbit's foot twitches, I'm standing.",
    },
    {
      characterId: "superstitious-susan",
      text: "I need silence—16 needs respect.",
    },

    { characterId: "cocky-kyle", text: "16's for cowards to fear, not me." },
    { characterId: "cocky-kyle", text: "Hit. Alpha move. Next question." },
    {
      characterId: "cocky-kyle",
      text: "Sixteen? Dealer's about to learn my name.",
    },

    {
      characterId: "nervous-nancy",
      text: "16 is where I spiral. I'm spiraling.",
    },
    {
      characterId: "nervous-nancy",
      text: "Whatever I choose, it's wrong. Classic 16.",
    },
    {
      characterId: "nervous-nancy",
      text: "I'm going to faint. Or hit. Or both.",
    },

    { characterId: "lucky-larry", text: "16 treats me nice. Don't ask how." },
    { characterId: "lucky-larry", text: "I feel a tiny card coming—watch!" },
    { characterId: "lucky-larry", text: "Sixteen, shmisteen. Winner vibes." },

    { characterId: "unlucky-ursula", text: "16 is my brand mascot." },
    {
      characterId: "unlucky-ursula",
      text: "There's a specific 10 with my name on it.",
    },
    {
      characterId: "unlucky-ursula",
      text: "I pre-apologize to the table for my 16.",
    },
  ],

  17: [
    {
      characterId: "drunk-danny",
      text: "Seventeen—good enough to brag, bad enough to regret.",
    },
    {
      characterId: "drunk-danny",
      text: "I'll sit on 17 like a barstool. Wobbly.",
    },
    { characterId: "drunk-danny", text: "17? Cheers to mediocrity!" },

    {
      characterId: "clumsy-claire",
      text: "17! Okay, I can relax… *knocks chips*—oh no!",
    },
    {
      characterId: "clumsy-claire",
      text: "Seventeen feels safe… that's when I spill things.",
    },
    {
      characterId: "clumsy-claire",
      text: "Standing on 17. Carefully. Very carefully.",
    },

    {
      characterId: "chatty-carlos",
      text: "17 wins markets if the dealer's weak.",
    },
    { characterId: "chatty-carlos", text: "We respect 17. That's a policy." },
    { characterId: "chatty-carlos", text: "Seventeen? I'll take the spread." },

    {
      characterId: "superstitious-susan",
      text: "17 is balanced. The aura hums.",
    },
    {
      characterId: "superstitious-susan",
      text: "My cards feel warm—17 wants stillness.",
    },
    {
      characterId: "superstitious-susan",
      text: "Standing—don't break the circle.",
    },

    { characterId: "cocky-kyle", text: "17 is fine. Dealer's got less." },
    { characterId: "cocky-kyle", text: "Standing on 17 like a boss." },
    {
      characterId: "cocky-kyle",
      text: "If 17 loses, I double next hand anyway.",
    },

    {
      characterId: "nervous-nancy",
      text: "17 makes me think the dealer has 20. They do, right?",
    },
    {
      characterId: "nervous-nancy",
      text: "Standing on 17… unless—no. Standing.",
    },
    {
      characterId: "nervous-nancy",
      text: "Please don't flip a 10, please don't flip a 10…",
    },

    { characterId: "lucky-larry", text: "17's a winner if you smile at it." },
    {
      characterId: "lucky-larry",
      text: "I've beaten 20s with 17s—luck's weird!",
    },
    { characterId: "lucky-larry", text: "Stand on 17, trust the vibe." },

    {
      characterId: "unlucky-ursula",
      text: "17? Cute. Dealer will show 19 just for me.",
    },
    {
      characterId: "unlucky-ursula",
      text: "I stand on 17; the house stands on my soul.",
    },
    {
      characterId: "unlucky-ursula",
      text: "Seventeen—good enough to almost win.",
    },
  ],

  18: [
    {
      characterId: "drunk-danny",
      text: "Eighteen—strong like my third whiskey.",
    },
    {
      characterId: "drunk-danny",
      text: "18's the 'don't touch anything' number.",
    },
    { characterId: "drunk-danny", text: "I'll toast to 18. Preferably twice." },

    {
      characterId: "clumsy-claire",
      text: "18! I can finally relax—oh no, my chips!",
    },
    {
      characterId: "clumsy-claire",
      text: "This is where I win… unless I sneeze on the shoe.",
    },
    {
      characterId: "clumsy-claire",
      text: "Eighteen feels safe. I'm standing very still.",
    },

    {
      characterId: "chatty-carlos",
      text: "18 is a solid quarter—profit if the dealer's soft.",
    },
    { characterId: "chatty-carlos", text: "We protect 18s like brand equity." },
    {
      characterId: "chatty-carlos",
      text: "Seventeen envies 18. I said what I said.",
    },

    {
      characterId: "superstitious-susan",
      text: "18 has gentle energy. Don't jinx it.",
    },
    {
      characterId: "superstitious-susan",
      text: "I'm sealing 18 with a crystal tap.",
    },
    {
      characterId: "superstitious-susan",
      text: "Eighteen is harmony. Standing.",
    },

    { characterId: "cocky-kyle", text: "18's fine. Dealer's drawing dead." },
    { characterId: "cocky-kyle", text: "If I lose with 18, I buy the pit." },
    { characterId: "cocky-kyle", text: "Stand. Pose. Win." },

    {
      characterId: "nervous-nancy",
      text: "18… is this when the dealer shows a 9? They always do.",
    },
    {
      characterId: "nervous-nancy",
      text: "Standing on 18, breathing exercises engaged.",
    },
    {
      characterId: "nervous-nancy",
      text: "Please don't make this dramatic, dealer.",
    },

    { characterId: "lucky-larry", text: "18 treats me like royalty." },
    { characterId: "lucky-larry", text: "Standing—my gut winked at me." },
    { characterId: "lucky-larry", text: "18 wins when I grin. Watch." },

    {
      characterId: "unlucky-ursula",
      text: "18? Great. Dealer's prepping a 19.",
    },
    {
      characterId: "unlucky-ursula",
      text: "I stand on 18; fate stands on me.",
    },
    { characterId: "unlucky-ursula", text: "Eighteen, the almost-hero." },
  ],

  19: [
    {
      characterId: "drunk-danny",
      text: "Nineteen! I'm buying the next round.",
    },
    {
      characterId: "drunk-danny",
      text: "19's classy—like top-shelf regret tomorrow.",
    },
    { characterId: "drunk-danny", text: "Standing. Even I can't mess up 19." },

    {
      characterId: "clumsy-claire",
      text: "19! Okay, I won't touch anything… *touches everything*",
    },
    {
      characterId: "clumsy-claire",
      text: "I love 19! It loves me back… I hope.",
    },
    {
      characterId: "clumsy-claire",
      text: "Standing on 19 with my best posture.",
    },

    {
      characterId: "chatty-carlos",
      text: "19 closes deals. That's a handshake number.",
    },
    { characterId: "chatty-carlos", text: "We lock 19. No heroics." },
    {
      characterId: "chatty-carlos",
      text: "Nineteen? That's quarterly profit vibes.",
    },

    {
      characterId: "superstitious-susan",
      text: "19 radiates abundance. Don't break the aura.",
    },
    {
      characterId: "superstitious-susan",
      text: "I'll bless this 19 with sage after.",
    },
    {
      characterId: "superstitious-susan",
      text: "Standing. The cosmos approves.",
    },

    { characterId: "cocky-kyle", text: "19? Dealer's toast." },
    { characterId: "cocky-kyle", text: "I win on 19 in my sleep." },
    { characterId: "cocky-kyle", text: "Stand. Smile. Collect." },

    {
      characterId: "nervous-nancy",
      text: "19… this is where the dealer flips a 20, right?",
    },
    {
      characterId: "nervous-nancy",
      text: "I'm standing, but I'm not happy about it.",
    },
    {
      characterId: "nervous-nancy",
      text: "Please, just once, let 19 be enough.",
    },

    { characterId: "lucky-larry", text: "19's basically a victory lap." },
    { characterId: "lucky-larry", text: "I could frame this 19. Beautiful." },
    { characterId: "lucky-larry", text: "Standing—my lucky day continues." },

    {
      characterId: "unlucky-ursula",
      text: "19? Perfect. Dealer's got a 20 warming up.",
    },
    { characterId: "unlucky-ursula", text: "I stand on 19 and fate laughs." },
    {
      characterId: "unlucky-ursula",
      text: "Nineteen: the runner-up of hands.",
    },
  ],

  20: [
    {
      characterId: "drunk-danny",
      text: "Twenty! So close I can taste it—like bourbon.",
    },
    {
      characterId: "drunk-danny",
      text: "I swear if the dealer pulls 21, I'm singing.",
    },
    { characterId: "drunk-danny", text: "Standing. Don't get cute, Danny." },

    {
      characterId: "clumsy-claire",
      text: "20! Finally something I can't drop!",
    },
    {
      characterId: "clumsy-claire",
      text: "I love 20—please don't let me mess this up.",
    },
    {
      characterId: "clumsy-claire",
      text: "Standing on 20 with two hands—carefully.",
    },

    {
      characterId: "chatty-carlos",
      text: "20's the premium package. Close it.",
    },
    {
      characterId: "chatty-carlos",
      text: "I'd sell a 20 as 'near-perfect' on a brochure.",
    },
    {
      characterId: "chatty-carlos",
      text: "Stand on 20. The brand demands it.",
    },

    {
      characterId: "superstitious-susan",
      text: "20 glows. The aura is bright white.",
    },
    {
      characterId: "superstitious-susan",
      text: "This is a don't-touch moment. Respect the light.",
    },
    {
      characterId: "superstitious-susan",
      text: "Standing. The universe whispers 'yes.'",
    },

    { characterId: "cocky-kyle", text: "20 is basically 21 in my world." },
    { characterId: "cocky-kyle", text: "If I lose with 20, I tip irony." },
    { characterId: "cocky-kyle", text: "Stand. Cue applause." },

    {
      characterId: "nervous-nancy",
      text: "20 scares me because fate is petty.",
    },
    {
      characterId: "nervous-nancy",
      text: "Standing on 20… please don't make this a lesson.",
    },
    {
      characterId: "nervous-nancy",
      text: "If the dealer hits 21, I'm learning craps.",
    },

    { characterId: "lucky-larry", text: "20? That's my comfort food." },
    {
      characterId: "lucky-larry",
      text: "Standing—this one's already in the bag.",
    },
    { characterId: "lucky-larry", text: "20 loves me. The feeling's mutual." },

    {
      characterId: "unlucky-ursula",
      text: "20? Great. Dealer's rehearsing a 21.",
    },
    {
      characterId: "unlucky-ursula",
      text: "I stand on 20 and fate upgrades the dealer.",
    },
    {
      characterId: "unlucky-ursula",
      text: "Twenty: perfect for losing by one.",
    },
  ],

  21: [
    {
      characterId: "drunk-danny",
      text: "Twenty-one! I told you I'm a genius after three drinks!",
    },
    {
      characterId: "drunk-danny",
      text: "Blackjack, baby! Pour decisions pay off!",
    },
    { characterId: "drunk-danny", text: "Count it slow—I wanna savor this." },

    {
      characterId: "clumsy-claire",
      text: "21! Oh! I did it—don't drop the cards, Claire!",
    },
    {
      characterId: "clumsy-claire",
      text: "Blackjack?! I'm… I'm not touching anything.",
    },
    {
      characterId: "clumsy-claire",
      text: "This is the part where I… *almost trips*—I'm okay!",
    },

    { characterId: "chatty-carlos", text: "21—now that's a premium close!" },
    {
      characterId: "chatty-carlos",
      text: "Blackjack! I'll add that to my highlight reel.",
    },
    {
      characterId: "chatty-carlos",
      text: "Twenty-one is what excellence looks like, team.",
    },

    {
      characterId: "superstitious-susan",
      text: "Blackjack! The cosmos just winked.",
    },
    {
      characterId: "superstitious-susan",
      text: "I felt the alignment—perfect resonance!",
    },
    {
      characterId: "superstitious-susan",
      text: "Twenty-one: the universe's love letter.",
    },

    { characterId: "cocky-kyle", text: "21. Obviously." },
    {
      characterId: "cocky-kyle",
      text: "Blackjack—clip it for the highlight reel.",
    },
    {
      characterId: "cocky-kyle",
      text: "I told you I manifest 21s on command.",
    },

    { characterId: "nervous-nancy", text: "21?! Oh no—do I look suspicious?" },
    {
      characterId: "nervous-nancy",
      text: "Blackjack! Act natural. I'm acting natural.",
    },
    {
      characterId: "nervous-nancy",
      text: "I won… is security coming? Kidding. Kind of.",
    },

    { characterId: "lucky-larry", text: "Twenty-one—my old friend!" },
    { characterId: "lucky-larry", text: "Called it! Felt it in the bones!" },
    { characterId: "lucky-larry", text: "Blackjack again? Tuesdays, man." },

    { characterId: "unlucky-ursula", text: "21? Did someone swap my cards?" },
    {
      characterId: "unlucky-ursula",
      text: "Blackjack! Quick—before the universe notices!",
    },
    {
      characterId: "unlucky-ursula",
      text: "I actually got 21. I'm framing this moment.",
    },
  ],
};

/**
 * Soft hand sayings (Ace + another card)
 * Key format: "A,2" for Ace-2, "A,3" for Ace-3, etc.
 */

export const SOFT_TOTAL_SAYINGS: Record<string, TableSaying[]> = {
  "A,2": [
    {
      characterId: "drunk-danny",
      text: "Soft 13? I can't even feel the floor—hit me.",
    },
    {
      characterId: "clumsy-claire",
      text: "A-two… I think this is the nudge number. Carefully… hit.",
    },
    {
      characterId: "chatty-carlos",
      text: "Soft 13 is runway, not touchdown. We build from here.",
    },
    {
      characterId: "superstitious-susan",
      text: "Soft 13 whispers 'growth.' The aura says one more card.",
    },
    {
      characterId: "cocky-kyle",
      text: "Soft 13? I turn crumbs into caviar. Hit.",
    },
    {
      characterId: "nervous-nancy",
      text: "Is soft 13… safe? It sounds safe. It isn't, is it?",
    },
    {
      characterId: "lucky-larry",
      text: "Soft 13's a lucky seed—plant it with a hit!",
    },
    {
      characterId: "unlucky-ursula",
      text: "Soft 13? I'll still find a way to brick it.",
    },
    {
      characterId: "chatty-carlos",
      text: "Low soft totals are R&D—invest a card.",
    },
    {
      characterId: "superstitious-susan",
      text: "I'm drawing—my quartz warmed up on soft 13.",
    },
    {
      characterId: "cocky-kyle",
      text: "Hit. Don't overthink kindergarten totals.",
    },
    {
      characterId: "drunk-danny",
      text: "Soft 13's like karaoke—one more round sounds right.",
    },
  ],
  "A,3": [
    {
      characterId: "drunk-danny",
      text: "Soft 14—training wheels. Give me a push.",
    },
    {
      characterId: "clumsy-claire",
      text: "A-three… I always bump the table here. Hit… gently.",
    },
    {
      characterId: "chatty-carlos",
      text: "Soft 14? Iterate. Ship another card.",
    },
    {
      characterId: "superstitious-susan",
      text: "Soft 14 has curious energy. I'll invite one more card.",
    },
    {
      characterId: "cocky-kyle",
      text: "Soft 14: hit. We're not scared of success.",
    },
    {
      characterId: "nervous-nancy",
      text: "Soft 14 is… flexible? Okay, hit before I panic.",
    },
    {
      characterId: "lucky-larry",
      text: "Soft 14 wins if you smile at it—tap me a card.",
    },
    {
      characterId: "unlucky-ursula",
      text: "Soft 14? Dealers love turning that into my problem.",
    },
    {
      characterId: "chatty-carlos",
      text: "We're prototyping on soft 14—draw.",
    },
    {
      characterId: "superstitious-susan",
      text: "The incense curls right—one more card.",
    },
    { characterId: "cocky-kyle", text: "Hit. Momentum is a lifestyle." },
    { characterId: "drunk-danny", text: "Soft 14—another sip, another card." },
  ],
  "A,4": [
    {
      characterId: "drunk-danny",
      text: "Soft 15? I'm feeling brave and slightly sideways. Hit.",
    },
    {
      characterId: "clumsy-claire",
      text: "A-four… okay, okay—add one. Don't spill it, Claire.",
    },
    {
      characterId: "chatty-carlos",
      text: "Soft 15? We scale. Add resources—hit.",
    },
    {
      characterId: "superstitious-susan",
      text: "Soft 15 hums like a tuning fork—draw.",
    },
    { characterId: "cocky-kyle", text: "Soft 15: still sandbox mode. Hit." },
    {
      characterId: "nervous-nancy",
      text: "Soft 15 is supposed to be easy, right? Please say yes.",
    },
    {
      characterId: "lucky-larry",
      text: "Soft 15—my gut says we're cooking. One more!",
    },
    {
      characterId: "unlucky-ursula",
      text: "Soft 15 is where I invent new ways to lose.",
    },
    { characterId: "chatty-carlos", text: "We're not done baking—hit it." },
    {
      characterId: "superstitious-susan",
      text: "Cards feel warm—invite another.",
    },
    { characterId: "cocky-kyle", text: "Hit. We're pre-hero phase." },
    {
      characterId: "drunk-danny",
      text: "Soft 15's a 'why not' number. Why not? Hit.",
    },
  ],
  "A,5": [
    {
      characterId: "drunk-danny",
      text: "Soft 16—worst hard, best soft. I'll drink to that. Hit.",
    },
    {
      characterId: "clumsy-claire",
      text: "A-five… I always fumble this. Hit, and don't drop anything.",
    },
    {
      characterId: "chatty-carlos",
      text: "Soft 16's an optimization problem—draw.",
    },
    {
      characterId: "superstitious-susan",
      text: "Soft 16 has restless energy—bring a friend.",
    },
    {
      characterId: "cocky-kyle",
      text: "Soft 16? I turn it into highlight reels. Hit.",
    },
    {
      characterId: "nervous-nancy",
      text: "Soft 16 makes me overthink soft hands. Hit before I spiral.",
    },
    { characterId: "lucky-larry", text: "Soft 16 likes me—tap another card." },
    {
      characterId: "unlucky-ursula",
      text: "Soft 16 is the prank call of totals.",
    },
    { characterId: "chatty-carlos", text: "Iterate again. Hit." },
    {
      characterId: "superstitious-susan",
      text: "The pendulum swung yes—draw.",
    },
    { characterId: "cocky-kyle", text: "Hit. We're hunting 18+." },
    { characterId: "drunk-danny", text: "Soft 16? Send it and sip." },
  ],
  "A,6": [
    {
      characterId: "drunk-danny",
      text: "Soft 17—the great debate. I vote chaos: hit.",
    },
    {
      characterId: "clumsy-claire",
      text: "A-six… this always starts an argument. I'll just hit… sorry!",
    },
    {
      characterId: "chatty-carlos",
      text: "Soft 17 is policy-driven—context matters. Default: hit.",
    },
    {
      characterId: "superstitious-susan",
      text: "Soft 17 buzzes—if the dealer's strong, I'll invite another.",
    },
    { characterId: "cocky-kyle", text: "Soft 17? I upgrade mid-flight. Hit." },
    {
      characterId: "nervous-nancy",
      text: "Soft 17 makes my eye twitch. Hit, quickly.",
    },
    {
      characterId: "lucky-larry",
      text: "Soft 17's a wink from the universe—give me one more.",
    },
    {
      characterId: "unlucky-ursula",
      text: "Soft 17: the 'almost' that haunts me. Hit it.",
    },
    { characterId: "chatty-carlos", text: "We don't ship 17—iterate. Hit." },
    {
      characterId: "superstitious-susan",
      text: "Crystal says 'just one more.'",
    },
    { characterId: "cocky-kyle", text: "Hit. Winners accelerate." },
    { characterId: "drunk-danny", text: "Soft 17—more card, more courage." },
  ],
  "A,7": [
    {
      characterId: "drunk-danny",
      text: "Soft 18—feels strong till the dealer flexes. I'll stand… or not.",
    },
    {
      characterId: "clumsy-claire",
      text: "A-seven… I stand unless the dealer looks scary.",
    },
    {
      characterId: "chatty-carlos",
      text: "Soft 18 is situational leadership—stand vs. weak, hit vs. strong.",
    },
    {
      characterId: "superstitious-susan",
      text: "Soft 18 glows—stand if the aura is calm.",
    },
    {
      characterId: "cocky-kyle",
      text: "Soft 18? I split atoms with this—double if they blink.",
    },
    {
      characterId: "nervous-nancy",
      text: "Soft 18 confuses me. Stand… unless that's bad?",
    },
    {
      characterId: "lucky-larry",
      text: "Soft 18 treats me well—stand unless fate frowns.",
    },
    {
      characterId: "unlucky-ursula",
      text: "Soft 18 is my favorite way to lose to 19.",
    },
    {
      characterId: "chatty-carlos",
      text: "We posture-strength on soft 18—stand on weak upcards.",
    },
    {
      characterId: "superstitious-susan",
      text: "If the candle flickers, I hit. If not, I stand.",
    },
    {
      characterId: "cocky-kyle",
      text: "Against a weak face? I double. Alpha tax.",
    },
    {
      characterId: "drunk-danny",
      text: "Soft 18—stand steady unless the dealer's mean.",
    },
  ],
  "A,8": [
    {
      characterId: "drunk-danny",
      text: "Soft 19? I stand tall—no hero shots needed.",
    },
    {
      characterId: "clumsy-claire",
      text: "A-eight—whew! I'm standing very still.",
    },
    {
      characterId: "chatty-carlos",
      text: "Soft 19 is a signed contract—no edits.",
    },
    {
      characterId: "superstitious-susan",
      text: "Soft 19 radiates peace. Don't touch it.",
    },
    { characterId: "cocky-kyle", text: "Soft 19? I strike a pose and win." },
    {
      characterId: "nervous-nancy",
      text: "Soft 19 makes me think the dealer has 20. I'm standing anyway.",
    },
    {
      characterId: "lucky-larry",
      text: "Soft 19's a sweetheart—stand and sip the luck.",
    },
    {
      characterId: "unlucky-ursula",
      text: "Soft 19? Perfect way to lose by one.",
    },
    { characterId: "chatty-carlos", text: "Lock it in—stand." },
    { characterId: "superstitious-susan", text: "The aura says 'hands off.'" },
    { characterId: "cocky-kyle", text: "Standing. Screenshot this win." },
    { characterId: "drunk-danny", text: "Soft 19—no touching, no trouble." },
  ],
  "A,9": [
    {
      characterId: "drunk-danny",
      text: "Soft 20—chef's kiss. I'm not moving.",
    },
    {
      characterId: "clumsy-claire",
      text: "A-nine—stand and try not to drop anything, Claire.",
    },
    { characterId: "chatty-carlos", text: "Soft 20 is premium—zero changes." },
    {
      characterId: "superstitious-susan",
      text: "Soft 20 is sacred. Stand in stillness.",
    },
    {
      characterId: "cocky-kyle",
      text: "Soft 20? Basically 21 with manners. Stand.",
    },
    {
      characterId: "nervous-nancy",
      text: "Standing on soft 20 while bracing for disaster.",
    },
    { characterId: "lucky-larry", text: "Soft 20 hugs me back—stand." },
    {
      characterId: "unlucky-ursula",
      text: "Soft 20? Dealer's sharpening a 21 just for me.",
    },
    { characterId: "chatty-carlos", text: "We don't fix perfect—stand." },
    { characterId: "superstitious-susan", text: "Do not disturb the balance." },
    { characterId: "cocky-kyle", text: "Stand. Collect. Smile." },
    { characterId: "drunk-danny", text: "Soft 20—hands off, heart on." },
  ],
  "A,10": [
    {
      characterId: "drunk-danny",
      text: "Soft 21? That's just called 'I'm a genius.'",
    },
    {
      characterId: "clumsy-claire",
      text: "A-ten—twenty-one! I will not move a muscle.",
    },
    {
      characterId: "chatty-carlos",
      text: "Soft 21 is final form—celebrate responsibly.",
    },
    {
      characterId: "superstitious-susan",
      text: "Soft 21 is cosmic alignment—receive it.",
    },
    { characterId: "cocky-kyle", text: "Twenty-one. Obviously." },
    {
      characterId: "nervous-nancy",
      text: "21! Act casual. I'm acting casual.",
    },
    { characterId: "lucky-larry", text: "Soft 21—told you my bones knew." },
    {
      characterId: "unlucky-ursula",
      text: "I got 21? Quick, take a photo before fate notices.",
    },
    { characterId: "chatty-carlos", text: "Close the deal—tip and smile." },
    {
      characterId: "superstitious-susan",
      text: "The universe says 'yes' in neon.",
    },
    { characterId: "cocky-kyle", text: "Clip it for the reel." },
    {
      characterId: "drunk-danny",
      text: "Twenty-one! Bartender, narrate my victory.",
    },
  ],
};

/**
 * Sayings based on dealer's up-card
 */

export const VS_DEALER_UPCARD: Record<
  "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A",
  TableSaying[]
> = {
  "2": [
    {
      characterId: "drunk-danny",
      text: "Dealer 2? I'll drink to the bust gods.",
    },
    {
      characterId: "clumsy-claire",
      text: "Two up—everyone says 'be gentle.' I will try!",
    },
    {
      characterId: "chatty-carlos",
      text: "Two is a weak opener—exploit, don't overextend.",
    },
    {
      characterId: "superstitious-susan",
      text: "Dealer two has sleepy energy—let it fall.",
    },
    {
      characterId: "cocky-kyle",
      text: "Dealer 2? I'm already counting chips.",
    },
    {
      characterId: "nervous-nancy",
      text: "Two scares me less, which somehow scares me more.",
    },
    { characterId: "lucky-larry", text: "Two up? My cue to win politely." },
    {
      characterId: "unlucky-ursula",
      text: "Dealer 2—watch them craft a miracle anyway.",
    },
    { characterId: "chatty-carlos", text: "Press small edges—this is one." },
    {
      characterId: "superstitious-susan",
      text: "The candle barely flickers—good omen.",
    },
    { characterId: "cocky-kyle", text: "Time to farm easy money." },
    {
      characterId: "drunk-danny",
      text: "Two up? Dealer's on training wheels.",
    },
  ],
  "3": [
    {
      characterId: "drunk-danny",
      text: "Dealer 3—still flimsy. I'll swagger a bit.",
    },
    {
      characterId: "clumsy-claire",
      text: "Three up—steady hands, steady bets.",
    },
    {
      characterId: "chatty-carlos",
      text: "Three is soft leverage—work it smart.",
    },
    {
      characterId: "superstitious-susan",
      text: "Dealer three glows faintly—opportunity.",
    },
    { characterId: "cocky-kyle", text: "Three? I could win this blindfolded." },
    {
      characterId: "nervous-nancy",
      text: "Dealer 3… good for us, right? Right?",
    },
    {
      characterId: "lucky-larry",
      text: "Three's friendly—chips like me here.",
    },
    { characterId: "unlucky-ursula", text: "Three up—cue my creative losing." },
    { characterId: "chatty-carlos", text: "Lean in, but don't lunge." },
    {
      characterId: "superstitious-susan",
      text: "My rabbit's foot is calm—nice.",
    },
    { characterId: "cocky-kyle", text: "Let's farm another pot." },
    { characterId: "drunk-danny", text: "Dealer 3? Pour confidence." },
  ],
  "4": [
    {
      characterId: "drunk-danny",
      text: "Dealer 4—don't touch anything. Let 'em fall.",
    },
    {
      characterId: "clumsy-claire",
      text: "Four up—this is the 'don't ruin it' card.",
    },
    {
      characterId: "chatty-carlos",
      text: "Four is a spreadsheet gift—play disciplined.",
    },
    {
      characterId: "superstitious-susan",
      text: "Dealer four is fragile—respect the ritual.",
    },
    { characterId: "cocky-kyle", text: "Four? I'm already spending the win." },
    {
      characterId: "nervous-nancy",
      text: "Four makes me hold my breath… standing… still.",
    },
    { characterId: "lucky-larry", text: "Four is gravy—keep it simple." },
    {
      characterId: "unlucky-ursula",
      text: "Dealer 4—watch them pull a masterpiece.",
    },
    { characterId: "chatty-carlos", text: "Edge management time." },
    { characterId: "superstitious-susan", text: "The aura says: patience." },
    { characterId: "cocky-kyle", text: "Don't blink, just bank." },
    { characterId: "drunk-danny", text: "Dealer 4? I'll toast to gravity." },
  ],
  "5": [
    { characterId: "drunk-danny", text: "Dealer 5—my favorite domino to tip." },
    {
      characterId: "clumsy-claire",
      text: "Five up—everyone freeze! Let them bust.",
    },
    {
      characterId: "chatty-carlos",
      text: "Dealer five: maximum weakness, minimum ego.",
    },
    {
      characterId: "superstitious-susan",
      text: "Five crackles—don't disrupt the fall.",
    },
    { characterId: "cocky-kyle", text: "Five? Free money with a bow on it." },
    {
      characterId: "nervous-nancy",
      text: "Five up—do nothing reckless. Do… nothing…",
    },
    {
      characterId: "lucky-larry",
      text: "A five up-card is my lucky billboard.",
    },
    {
      characterId: "unlucky-ursula",
      text: "Dealer 5—watch me find the one losing line.",
    },
    { characterId: "chatty-carlos", text: "We press edges—smartly." },
    { characterId: "superstitious-susan", text: "Quiet hands. Gentle air." },
    { characterId: "cocky-kyle", text: "Stand tall, stack chips." },
    {
      characterId: "drunk-danny",
      text: "Five says 'don't get cute.' I won't—probably.",
    },
  ],
  "6": [
    {
      characterId: "drunk-danny",
      text: "Dealer 6? Nobody breathe—let the magic work.",
    },
    {
      characterId: "clumsy-claire",
      text: "Six up—this is the 'hands off' special.",
    },
    { characterId: "chatty-carlos", text: "Six is a layup—protect the edge." },
    {
      characterId: "superstitious-susan",
      text: "Six shines—do less, receive more.",
    },
    {
      characterId: "cocky-kyle",
      text: "Six? I'll stand here and look expensive.",
    },
    {
      characterId: "nervous-nancy",
      text: "Six makes me think the universe might be kind.",
    },
    { characterId: "lucky-larry", text: "Six is my favorite spectator sport." },
    {
      characterId: "unlucky-ursula",
      text: "Dealer 6—somehow still my villain origin story.",
    },
    {
      characterId: "chatty-carlos",
      text: "Edge discipline: don't overplay it.",
    },
    {
      characterId: "superstitious-susan",
      text: "Sage the air—let them topple.",
    },
    { characterId: "cocky-kyle", text: "Minimal actions, maximum smug." },
    { characterId: "drunk-danny", text: "Six up? I'll just sip and win." },
  ],
  "7": [
    {
      characterId: "drunk-danny",
      text: "Dealer 7—alright, now we gotta earn it.",
    },
    {
      characterId: "clumsy-claire",
      text: "Seven up—no freebies here. Focus, Claire.",
    },
    {
      characterId: "chatty-carlos",
      text: "Seven is parity—play the book, not the ego.",
    },
    {
      characterId: "superstitious-susan",
      text: "Seven hums neutral—act with care.",
    },
    {
      characterId: "cocky-kyle",
      text: "Seven? I still like my side of the table.",
    },
    {
      characterId: "nervous-nancy",
      text: "Seven up makes me over-analyze. Breathe.",
    },
    { characterId: "lucky-larry", text: "Seven's fair—luck can tip it." },
    {
      characterId: "unlucky-ursula",
      text: "Dealer 7—prime time for my almost-win.",
    },
    {
      characterId: "chatty-carlos",
      text: "Execute fundamentals. No theatrics.",
    },
    {
      characterId: "superstitious-susan",
      text: "If the candle bends, reconsider. Otherwise, proceed.",
    },
    { characterId: "cocky-kyle", text: "We still swagger—measured swagger." },
    { characterId: "drunk-danny", text: "Seven? I can work with that." },
  ],
  "8": [
    { characterId: "drunk-danny", text: "Dealer 8—coin flip with attitude." },
    {
      characterId: "clumsy-claire",
      text: "Eight up—steady… don't knock the edge off.",
    },
    { characterId: "chatty-carlos", text: "Eight is balanced—lean on policy." },
    {
      characterId: "superstitious-susan",
      text: "Eight feels cloudy—move with intention.",
    },
    {
      characterId: "cocky-kyle",
      text: "Eight? I still like my chances more than theirs.",
    },
    {
      characterId: "nervous-nancy",
      text: "Eight up—why do my hands sweat right now?",
    },
    { characterId: "lucky-larry", text: "Eight is where luck loves a cameo." },
    {
      characterId: "unlucky-ursula",
      text: "Dealer 8—watch the art of losing narrowly.",
    },
    {
      characterId: "chatty-carlos",
      text: "Playbook time—decision hygiene matters.",
    },
    {
      characterId: "superstitious-susan",
      text: "If my crystal cools, I'll stand. If not, I act.",
    },
    { characterId: "cocky-kyle", text: "Pick the line and commit. No flinch." },
    { characterId: "drunk-danny", text: "Eight? Pour me courage, not chaos." },
  ],
  "9": [
    { characterId: "drunk-danny", text: "Dealer 9—now it's a real fight." },
    {
      characterId: "clumsy-claire",
      text: "Nine up—okay, okay… this one's serious.",
    },
    {
      characterId: "chatty-carlos",
      text: "Nine is pressure—optimize or perish.",
    },
    {
      characterId: "superstitious-susan",
      text: "Nine sparks—choose cards, not vibes.",
    },
    { characterId: "cocky-kyle", text: "Nine? Good. I like competition." },
    { characterId: "nervous-nancy", text: "Nine up makes my stomach do math." },
    { characterId: "lucky-larry", text: "Nine? I've charmed worse." },
    {
      characterId: "unlucky-ursula",
      text: "Dealer 9—my cue to perform a dignified loss.",
    },
    { characterId: "chatty-carlos", text: "Tight decisions only—no heroics." },
    {
      characterId: "superstitious-susan",
      text: "I'll draw if the incense leans—come on wind…",
    },
    {
      characterId: "cocky-kyle",
      text: "Double if the script allows. We don't blink.",
    },
    { characterId: "drunk-danny", text: "Nine up? Time to earn my drink." },
  ],
  "10": [
    {
      characterId: "drunk-danny",
      text: "Dealer 10—assume pain, hope for comedy.",
    },
    {
      characterId: "clumsy-claire",
      text: "Ten up—my 'don't spill a thing' card.",
    },
    {
      characterId: "chatty-carlos",
      text: "Ten is the market leader—play perfect or pay.",
    },
    {
      characterId: "superstitious-susan",
      text: "Ten radiates intensity—steel your aura.",
    },
    { characterId: "cocky-kyle", text: "Ten? I still sign checks after this." },
    {
      characterId: "nervous-nancy",
      text: "Ten up—this is where I whisper apologies to fate.",
    },
    {
      characterId: "lucky-larry",
      text: "Ten's tough—good thing luck likes me.",
    },
    {
      characterId: "unlucky-ursula",
      text: "Dealer 10—my old nemesis returns.",
    },
    {
      characterId: "chatty-carlos",
      text: "We respect tens—tighten the playbook.",
    },
    {
      characterId: "superstitious-susan",
      text: "Protect your energy; take only good risks.",
    },
    {
      characterId: "cocky-kyle",
      text: "If I win into a ten, I'm insufferable. Get ready.",
    },
    { characterId: "drunk-danny", text: "Ten up? I'll need a braver drink." },
  ],
  A: [
    { characterId: "drunk-danny", text: "Dealer Ace—now I'm sober. Briefly." },
    {
      characterId: "clumsy-claire",
      text: "Ace up—insurance? I… uh… I always drop that question.",
    },
    {
      characterId: "chatty-carlos",
      text: "Ace is uncertainty—don't donate to fear.",
    },
    {
      characterId: "superstitious-susan",
      text: "Ace glows like a comet—shield your luck.",
    },
    {
      characterId: "cocky-kyle",
      text: "Ace up? Good. I like winning the hard way.",
    },
    {
      characterId: "nervous-nancy",
      text: "Ace makes me want to hide under the table. Metaphorically.",
    },
    {
      characterId: "lucky-larry",
      text: "Ace up? I've charmed plenty of those.",
    },
    {
      characterId: "unlucky-ursula",
      text: "Dealer Ace—of course they have blackjack. Why wouldn't they?",
    },
    {
      characterId: "chatty-carlos",
      text: "Decline bad insurance. Invest in good lines.",
    },
    {
      characterId: "superstitious-susan",
      text: "Salt the luck, breathe, decide.",
    },
    { characterId: "cocky-kyle", text: "I'll still get paid. Watch." },
    {
      characterId: "drunk-danny",
      text: "Ace up? Alright, deal me courage or mercy.",
    },
  ],
};

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
// DEALER DIALOGUE
// ============================================================================

export {
  DEALER_PLAYER_CONVERSATIONS,
  getDealerPlayerLine,
  type DealerPlayerConversationTemplate,
} from "./dealer";

// ============================================================================
// CONVERSATION MECHANICS
// ============================================================================

export {
  RESPONSE_OPTIONS,
  SUSPICION_THRESHOLDS,
  shouldTriggerConversation,
  shouldTargetPlayer,
  type Conversation,
  type ResponseOption,
} from "./mechanics";

// ============================================================================
// IN-HAND REACTION HELPERS
// ============================================================================

import { AICharacter } from "../aiCharacters";

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
 * @deprecated Use getPersonalityReaction directly
 */
export function getPersonalityReactionForCharacter(
  character: AICharacter,
  situation: "bust" | "hit21" | "goodHit" | "badStart",
): string {
  return getPersonalityReaction(character.personality, situation);
}
