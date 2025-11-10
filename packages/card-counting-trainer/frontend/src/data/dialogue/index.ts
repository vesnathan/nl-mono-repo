/**
 * Main dialogue export file
 * Aggregates all character dialogue and helper functions
 */

// Export types
// Import types and utilities
import { TableSaying, CharacterDialogue } from "./types";
import type { AICharacter } from "../aiCharacters";

// Import all character dialogues
import { drunkDanny } from "./characters/drunk-danny";
import { clumsyClaire } from "./characters/clumsy-claire";
import { chattyCarlos } from "./characters/chatty-carlos";
import { superstitiousSusan } from "./characters/superstitious-susan";
import { cockyKyle } from "./characters/cocky-kyle";
import { nervousNancy } from "./characters/nervous-nancy";
import { luckyLarry } from "./characters/lucky-larry";
import { unluckyUrsula } from "./characters/unlucky-ursula";

export * from "./types";

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

export const CHARACTER_DIALOGUE: Record<string, CharacterDialogue> = {
  DRUNK_DANNY_ID: drunkDanny,
  CLUMSY_CLAIRE_ID: clumsyClaire,
  CHATTY_CARLOS_ID: chattyCarlos,
  SUPERSTITIOUS_SUSAN_ID: superstitiousSusan,
  COCKY_KYLE_ID: cockyKyle,
  NERVOUS_NANCY_ID: nervousNancy,
  LUCKY_LARRY_ID: luckyLarry,
  UNLUCKY_URSULA_ID: unluckyUrsula,
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
 * End-of-hand reactions for wins (non-blackjack)
 */
export const PERSONALITY_WIN_REACTIONS: Record<
  AICharacter["personality"],
  string[]
> = {
  drunk: [
    "Haha! Still got it! *hiccup*",
    "Not too shabby for a drunk old man, huh?",
    "I'll drink to that! Another win!",
    "Winner winner! *waves glass*",
    "Bartender! Victory round!",
  ],
  clumsy: [
    "I won! I actually won! *nervously excited*",
    "Oh! Did I do it right? I think I won!",
    "Yay! *carefully stacks chips*",
    "Is this real? I'm not dreaming?",
    "I didn't mess up! Hooray!",
  ],
  chatty: [
    "Nice! That reminds me of this one time...",
    "See? Confidence pays off!",
    "Another win! Just like last Tuesday!",
    "You know, winning's all about attitude...",
    "Victory! Let me tell you about my strategy...",
  ],
  superstitious: [
    "My crystals KNEW it! Thank you universe!",
    "The energy shift! I felt it coming!",
    "Mercury's in retrograde but I STILL won!",
    "My lucky ritual worked! As always!",
    "Positive vibes! I manifested this!",
  ],
  cocky: [
    "Of course I won. Did you expect otherwise?",
    "Too easy. Next?",
    "And THAT'S how it's done.",
    "Did anyone doubt me? Anyone?",
    "I could do this in my sleep.",
  ],
  nervous: [
    "I won?! Oh my gosh! *sweating*",
    "Wait, really?! I did it?!",
    "Is this allowed? Am I in trouble?",
    "*nervously celebrates* Yay...?",
    "I won! Why am I still shaking?!",
  ],
  lucky: [
    "Called it! Lucky Larry strikes again!",
    "My streak continues! Boom!",
    "Luck's on my side tonight!",
    "I FELT this win coming!",
    "Can't stop won't stop!",
  ],
  unlucky: [
    "Wait, I WON?! Actually won?!",
    "Did the dealer make a mistake?",
    "I... I won? Is this a trick?",
    "Finally! FINALLY!",
    "A win! Mark your calendars!",
  ],
};

/**
 * End-of-hand reactions for pushes (ties)
 */
export const PERSONALITY_PUSH_REACTIONS: Record<
  AICharacter["personality"],
  string[]
> = {
  drunk: [
    "Tie? Shit, I'll take it I guess...",
    "*squints at cards* Wait... is that good or bad?",
    "Eh, at least I didn't lose!",
    "Push? Bartender explains pushy to me again...",
    "I'll call that a moral victory *hiccup*",
  ],
  clumsy: [
    "A tie? Oh! That's okay I think!",
    "At least I didn't knock anything over!",
    "Push! That means I get my chips back right?",
    "Phew! Nobody loses! *sighs with relief*",
    "Tie! I'll take it! *carefully protects chips*",
  ],
  chatty: [
    "Push! You know, ties are underrated...",
    "Tie game! Reminds me of that board meeting...",
    "A push! Better than a loss, am I right?",
    "Split decision! Like my fantasy league draft...",
    "We'll call it even! No harm no foul!",
  ],
  superstitious: [
    "A tie... the universe balances all things.",
    "Push! The energies are in equilibrium!",
    "Neutral outcome! My aura's balanced!",
    "The cards reflect cosmic harmony!",
    "A tie! As the stars predicted!",
  ],
  cocky: [
    "A push? I'll allow it.",
    "Tie? Fine. I'm feeling generous.",
    "Push. Could've won but whatever.",
    "I'll take the tie. This time.",
    "Meh. At least I didn't lose.",
  ],
  nervous: [
    "A push?! Is that okay?! Nobody's mad?!",
    "*nervously* So... we're good? Tie?",
    "Push! Thank goodness! *wipes sweat*",
    "Tie! Nobody gets hurt! Perfect!",
    "Is a push bad? It feels neutral? Okay!",
  ],
  lucky: [
    "Push! I'll call that half a win!",
    "Tie! My luck held just enough!",
    "Push! Could be worse!",
    "Tie game! Still in the game!",
    "A push! Good vibes sustained!",
  ],
  unlucky: [
    "A push? I'll take it! That's HUGE for me!",
    "Tie?! That's basically a win in my book!",
    "Push! I didn't lose! This is amazing!",
    "A tie! I'll count this as progress!",
    "Push? I was SURE I'd lose!",
  ],
};

/**
 * End-of-hand reactions for losses (dealer beats player)
 */
export const PERSONALITY_LOSS_REACTIONS: Record<
  AICharacter["personality"],
  string[]
> = {
  drunk: [
    "Ah hell... where'd my chips go?",
    "Son of a... *hiccup* ...I had that!",
    "Dammit. Dealer got lucky that time.",
    "*slurs* That was MY hand!",
    "Bartender! I need another drink!",
  ],
  clumsy: [
    "Oh no... I lost... *sad face*",
    "Aww... did I do something wrong?",
    "I tried my best... *sighs*",
    "*carefully collects remaining chips*",
    "Maybe next time... *hopeful*",
  ],
  chatty: [
    "Well THAT'S frustrating! You know what though...",
    "Loss! But here's the thing about losses...",
    "Dealer wins! Reminds me of Q3 earnings...",
    "Ah well! As my mentor always said...",
    "Lost that one! But perspective is key...",
  ],
  superstitious: [
    "The dealer's energy was too strong!",
    "I KNEW I should've cleansed before this hand!",
    "The moon's phase was against me!",
    "Negative vibes! I felt them!",
    "My crystals need recharging!",
  ],
  cocky: [
    "Dealer got lucky. That's all.",
    "Fluke. Pure fluke.",
    "Whatever. Next hand's mine.",
    "That shouldn't have happened.",
    "Luck. Nothing but luck.",
  ],
  nervous: [
    "Oh no oh no! I KNEW it!",
    "*panicking* I lost! Is everyone mad?!",
    "I'm so sorry! *to nobody in particular*",
    "I should've known! *sweating*",
    "This is bad! This is really bad!",
  ],
  lucky: [
    "Lost? Huh. Doesn't happen often!",
    "Dealer got one over on me! Rare!",
    "Well that's unusual for me...",
    "Lost! But my luck'll turn around!",
    "A loss! But I'll bounce back!",
  ],
  unlucky: [
    "Of course! Why would I expect anything else?!",
    "Classic me! *laughs bitterly*",
    "Lost again! Story of my life!",
    "Yep. There it is. As expected.",
    "I called it! Knew I'd lose!",
  ],
};

/**
 * End-of-hand reactions when dealer gets blackjack
 */
export const PERSONALITY_DEALER_BLACKJACK_REACTIONS: Record<
  AICharacter["personality"],
  string[]
> = {
  drunk: [
    "Dealer blackjack?! This night just gets worse!",
    "Of course the dealer pulls 21. OF COURSE!",
    "*hiccup* Blackjack? Really?!",
    "That's just... *waves hand* ...unfair!",
    "Dealer blackjack! Bartender! NOW!",
  ],
  clumsy: [
    "Dealer got blackjack?! Oh my!",
    "Oh no! Natural 21! *gasps*",
    "Blackjack! Well... okay then...",
    "The dealer got blackjack? *nervous laugh*",
    "*sighs* Dealer blackjack... of course...",
  ],
  chatty: [
    "Dealer blackjack! You know, statistically...",
    "Natural 21! That's like when my client...",
    "Dealer blackjack! Reminds me of this seminar...",
    "Blackjack! But here's an interesting fact...",
    "Dealer 21! Well THAT'S a conversation starter!",
  ],
  superstitious: [
    "Dealer blackjack! The universe is testing me!",
    "Natural 21! Dark energy at work!",
    "Dealer blackjack! Mercury retrograde strikes!",
    "The dealer's aura is TOO strong!",
    "Blackjack! The cosmos are against me!",
  ],
  cocky: [
    "Dealer blackjack?! That's BULLSHIT!",
    "How?! HOW does the dealer get blackjack?!",
    "Dealer 21! That's just lucky!",
    "Blackjack! Unbelievable!",
    "Of COURSE the dealer gets blackjack!",
  ],
  nervous: [
    "DEALER BLACKJACK?! *panics*",
    "Oh god! Natural 21! We're doomed!",
    "*hyperventilating* Blackjack! Blackjack!",
    "Dealer blackjack! I KNEW this would happen!",
    "Natural 21! This is my nightmare!",
  ],
  lucky: [
    "Dealer blackjack?! My luck ran out!",
    "Natural 21! Well that's rare!",
    "Dealer blackjack! Even I can't beat that!",
    "Blackjack! The streak ends here!",
    "Dealer 21! That's... actually impressive!",
  ],
  unlucky: [
    "Dealer blackjack! OF COURSE! *laughs*",
    "Natural 21! Because WHY NOT?!",
    "Dealer blackjack! That's so ME!",
    "Blackjack! This is my life in a nutshell!",
    "Dealer 21! I should've bet on the dealer!",
  ],
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
 * Now considers strategic value based on dealer's up card
 */
export function getGenericInitialReaction(
  handValue: number,
  dealerUpCard?: { rank: string },
): string | null {
  if (handValue === 20) {
    const reactions = GENERIC_INITIAL_REACTIONS.twenty;
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  // Strategically bad hands:
  // - 5-8: Very weak, always hit
  // - 12-16: Stiff hands (bust easily), especially vs dealer 7+
  const dealerRank = dealerUpCard?.rank;
  const isDealerStrong =
    dealerRank &&
    ["7", "8", "9", "10", "J", "Q", "K", "A"].includes(dealerRank);

  // Very weak hands (5-8): Always bad
  if (handValue >= 5 && handValue <= 8) {
    const reactions = GENERIC_INITIAL_REACTIONS.badStart;
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  // Stiff hands (12-16): Bad, especially vs strong dealer
  // Only show reaction if dealer is showing strength or if hand is very stiff (14-16)
  if (
    handValue >= 12 &&
    handValue <= 16 &&
    (isDealerStrong || handValue >= 14)
  ) {
    const reactions = GENERIC_INITIAL_REACTIONS.badStart;
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  // Note: 9-11 are good/neutral (can't bust, double-down candidates) so no reaction
  // Note: 17-19 are solid hands, no reaction needed
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
  if (
    newHandValue >= 12 &&
    newHandValue <= 16 &&
    oldHandValue >= 12 &&
    Math.random() < 0.3
  ) {
    const reactions = GENERIC_HIT_REACTIONS.stuckInDanger;
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  return null;
}

// ============================================================================
// HAND-BASED SAYINGS
// ============================================================================

/**
 * Character ID constants to avoid string literal duplication
 */
const DRUNK_DANNY_ID = "drunk-danny";
const CLUMSY_CLAIRE_ID = "clumsy-claire";
const CHATTY_CARLOS_ID = "chatty-carlos";
const SUPERSTITIOUS_SUSAN_ID = "superstitious-susan";
const COCKY_KYLE_ID = "cocky-kyle";
const NERVOUS_NANCY_ID = "nervous-nancy";
const LUCKY_LARRY_ID = "lucky-larry";
const UNLUCKY_URSULA_ID = "unlucky-ursula";

/**
 * Hand-based character sayings organized by hand total
 * Extracted from tableSayings.ts for better modularity
 */
export const SAYINGS_BY_TOTAL: Record<number, TableSaying[]> = {
  12: [
    // Drunk Danny
    {
      characterId: DRUNK_DANNY_ID,
      text: "Twelve? That's the 'order another whiskey' number.",
    },
    {
      characterId: DRUNK_DANNY_ID,
      text: "Hit me soft… *hic*… not too hard, I bust easy on 12.",
    },
    {
      characterId: DRUNK_DANNY_ID,
      text: "Every time I get 12, I swear the dealer starts smilin'.",
    },

    // Clumsy Claire
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Twelve… oh gosh, I always mess this one up!",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Is twelve bad? I mean… it feels unlucky. Oops—my chips!",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Twelve it is—*drops card*—sorry! Sorry!",
    },

    // Chatty Carlos
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Twelve reminds me of Q4 sales—could go either way.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "12 is where discipline wins. You know, like margins.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "With 12, you follow the plan. In business and blackjack.",
    },

    // Superstitious Susan
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Twelve is a pause card—the universe says 'breathe.'",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "My crystal hates 12. We must proceed gently.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Twelve's energy is brittle. Don't anger the shoe.",
    },

    // Cocky Kyle
    {
      characterId: COCKY_KYLE_ID,
      text: "Twelve? I'll still outplay the table. Watch.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "12 is just foreplay before I pull a face card and flex.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Give me the ten—I like living on the edge.",
    },

    // Nervous Nancy
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Oh no, 12… this is where I always bust, right?",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Is there a camera on me? I swear 12 is a setup.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Okay, okay—12. I can do this. I THINK I can…",
    },

    // Lucky Larry
    {
      characterId: LUCKY_LARRY_ID,
      text: "12? My gut says this one's magic—hit me!",
    },
    {
      characterId: LUCKY_LARRY_ID,
      text: "I win with 12 all the time. Don't ask me why!",
    },
    {
      characterId: LUCKY_LARRY_ID,
      text: "Twelve's my Tuesday number. It's golden.",
    },

    // Unlucky Ursula
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "12? Cool, I'll bust on a 10—watch this art form.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Twelve and me? We have a long, tragic history.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "If anyone can ruin a 12, it's me. Stand back.",
    },
  ],

  13: [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Lucky 13? Buddy, my luck left with my ex.",
    },
    {
      characterId: DRUNK_DANNY_ID,
      text: "Thirteen… feels like a trap with free peanuts.",
    },
    {
      characterId: DRUNK_DANNY_ID,
      text: "I'll hit it—what's the worst that could happen? Don't answer.",
    },

    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Oh no, thirteen… I always trip here. Literally.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Is 13 cursed? Because I just spilled my drink again.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Thirteen. Deep breath. Don't bump the chips…",
    },

    {
      characterId: CHATTY_CARLOS_ID,
      text: "13's about risk management. I preach this to my sales team.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "We respect 13. Bad optics to go wild.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "I've seen folks implode on 13. Not me—I budget it.",
    },

    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Thirteen vibrates weird. Sage the shoe!",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "If a black cat walks past, I'm out with this 13.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "I'm waiting for a sign… thirteen needs a sign.",
    },

    {
      characterId: COCKY_KYLE_ID,
      text: "13 is cute. I make 21 out of anything.",
    },
    { characterId: COCKY_KYLE_ID, text: "Hit me—I don't play scared money." },
    {
      characterId: COCKY_KYLE_ID,
      text: "If I bust, I double next hand. That's alpha math.",
    },

    {
      characterId: NERVOUS_NANCY_ID,
      text: "Thirteen?! Are they testing me? Is this a sting?",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "I read a chapter about 13… I forgot what it said.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Please tell me what the book would do. Quietly.",
    },

    {
      characterId: LUCKY_LARRY_ID,
      text: "13's hot tonight—I can feel it in my elbow.",
    },
    { characterId: LUCKY_LARRY_ID, text: "Watch this 13 turn into magic—bam!" },
    {
      characterId: LUCKY_LARRY_ID,
      text: "I once hit 13 five times in a row and won. True story.",
    },

    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Thirteen? Perfect. I collect cursed numbers.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "If the dealer shows a 10, I'll pre-sign the loss slip.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "13 is my brand. My therapist knows.",
    },
  ],

  14: [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Fourteen… feels like last call: risky and loud.",
    },
    {
      characterId: DRUNK_DANNY_ID,
      text: "I either bust or brag. Both are fun.",
    },
    { characterId: DRUNK_DANNY_ID, text: "Hit the sad number. Let's dance." },

    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Fourteen scares me—I always nudge the table here.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "14? I'll try not to knock my stack again.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Is it weird my hands shake more on 14?",
    },

    {
      characterId: CHATTY_CARLOS_ID,
      text: "14's a KPI: keep potential intact, don't overreach.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "I've closed deals from worse than 14.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "14? We play the odds, not the ego.",
    },

    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Fourteen is a 'don't poke the spirits' number.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Let me align my tiger's eye—14 is finicky.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "If the candle flickers, I'm standing on 14.",
    },

    {
      characterId: COCKY_KYLE_ID,
      text: "14's fine. I print money from worse spots.",
    },
    { characterId: COCKY_KYLE_ID, text: "Hit. I'm here to win, not journal." },
    { characterId: COCKY_KYLE_ID, text: "Dealer's sweating. I can smell it." },

    {
      characterId: NERVOUS_NANCY_ID,
      text: "14 is the panic number. I'm officially panicking.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "If I hit, I bust. If I stand, I lose. Amazing.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Can someone cough if I should hit? Subtly?",
    },

    {
      characterId: LUCKY_LARRY_ID,
      text: "14's where legends are made. Hit me!",
    },
    {
      characterId: LUCKY_LARRY_ID,
      text: "My lucky streak LOVES a 14. Don't blink.",
    },
    {
      characterId: LUCKY_LARRY_ID,
      text: "If I win this 14, drinks are on the cosmos.",
    },

    {
      characterId: UNLUCKY_URSULA_ID,
      text: "14 is a long walk to a short bust.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "If I stand on 14, dealer flips a 20. Trust the process.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "14 and I are on a first-name basis: 'Hi, Loss.'",
    },
  ],

  15: [
    { characterId: DRUNK_DANNY_ID, text: "Fifteen—the devil's bar tab." },
    {
      characterId: DRUNK_DANNY_ID,
      text: "Whatever I do, it's wrong—so I'll make it loud.",
    },
    {
      characterId: DRUNK_DANNY_ID,
      text: "Hit it. Regret is tomorrow Danny's problem.",
    },

    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "15… I always knock something over right before I bust.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Fifteen is so mean. Please be kind, deck.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "I'll decide as soon as I stop shaking. Sorry!",
    },

    {
      characterId: CHATTY_CARLOS_ID,
      text: "15 demands discipline—like payroll.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "We minimize downside on 15. That's leadership.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "I've seen fortunes die on 15. Not mine.",
    },

    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "My moon chart says stand still on 15.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Fifteen feels karmically fragile.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Don't touch your cards—15 attracts chaos.",
    },

    { characterId: COCKY_KYLE_ID, text: "15? Dealer's cooked. Hit me." },
    {
      characterId: COCKY_KYLE_ID,
      text: "If I bust, I raise. That's how winners learn.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Fifteen is a speed bump for legends.",
    },

    {
      characterId: NERVOUS_NANCY_ID,
      text: "15 is statistically horrible. I memorized that.",
    },
    { characterId: NERVOUS_NANCY_ID, text: "If I breathe wrong, I lose 15." },
    { characterId: NERVOUS_NANCY_ID, text: "I'll… stand? No, hit. No—oh god." },

    { characterId: LUCKY_LARRY_ID, text: "15? My lucky elbow says go for it!" },
    {
      characterId: LUCKY_LARRY_ID,
      text: "I've won too many 15s to be scared now.",
    },
    { characterId: LUCKY_LARRY_ID, text: "Trust the vibe—15's a sleeper win." },

    {
      characterId: UNLUCKY_URSULA_ID,
      text: "15 is where dreams come to stub their toe.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "If I don't bust, the dealer pulls a 6 to a 21. Watch.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Fifteen and I need couples therapy.",
    },
  ],

  16: [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Sixteen—the officially worst hangover.",
    },
    {
      characterId: DRUNK_DANNY_ID,
      text: "Hit me, I fear nothing but Mondays.",
    },
    {
      characterId: DRUNK_DANNY_ID,
      text: "Stand? Hit? Bartender? Surprise me.",
    },

    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "16 makes my palms sweaty. Sorry if I… *bump*—oh no.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "I always drop something on 16—usually hopes.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Okay, steady hands. 16 can't scare me forever.",
    },

    {
      characterId: CHATTY_CARLOS_ID,
      text: "16 is a layoffs-or-late-hours decision.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "We follow the book on 16. That's non-negotiable.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "I delegate emotions on 16. Just math.",
    },

    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Sixteen is a trickster spirit. Tread light.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "If my rabbit's foot twitches, I'm standing.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "I need silence—16 needs respect.",
    },

    { characterId: COCKY_KYLE_ID, text: "16's for cowards to fear, not me." },
    { characterId: COCKY_KYLE_ID, text: "Hit. Alpha move. Next question." },
    {
      characterId: COCKY_KYLE_ID,
      text: "Sixteen? Dealer's about to learn my name.",
    },

    {
      characterId: NERVOUS_NANCY_ID,
      text: "16 is where I spiral. I'm spiraling.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Whatever I choose, it's wrong. Classic 16.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "I'm going to faint. Or hit. Or both.",
    },

    { characterId: LUCKY_LARRY_ID, text: "16 treats me nice. Don't ask how." },
    { characterId: LUCKY_LARRY_ID, text: "I feel a tiny card coming—watch!" },
    { characterId: LUCKY_LARRY_ID, text: "Sixteen, shmisteen. Winner vibes." },

    { characterId: UNLUCKY_URSULA_ID, text: "16 is my brand mascot." },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "There's a specific 10 with my name on it.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "I pre-apologize to the table for my 16.",
    },
  ],

  17: [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Seventeen—good enough to brag, bad enough to regret.",
    },
    {
      characterId: DRUNK_DANNY_ID,
      text: "I'll sit on 17 like a barstool. Wobbly.",
    },
    { characterId: DRUNK_DANNY_ID, text: "17? Cheers to mediocrity!" },

    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "17! Okay, I can relax… *knocks chips*—oh no!",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Seventeen feels safe… that's when I spill things.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Standing on 17. Carefully. Very carefully.",
    },

    {
      characterId: CHATTY_CARLOS_ID,
      text: "17 wins markets if the dealer's weak.",
    },
    { characterId: CHATTY_CARLOS_ID, text: "We respect 17. That's a policy." },
    { characterId: CHATTY_CARLOS_ID, text: "Seventeen? I'll take the spread." },

    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "17 is balanced. The aura hums.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "My cards feel warm—17 wants stillness.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Standing—don't break the circle.",
    },

    { characterId: COCKY_KYLE_ID, text: "17 is fine. Dealer's got less." },
    { characterId: COCKY_KYLE_ID, text: "Standing on 17 like a boss." },
    {
      characterId: COCKY_KYLE_ID,
      text: "If 17 loses, I double next hand anyway.",
    },

    {
      characterId: NERVOUS_NANCY_ID,
      text: "17 makes me think the dealer has 20. They do, right?",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Standing on 17… unless—no. Standing.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Please don't flip a 10, please don't flip a 10…",
    },

    { characterId: LUCKY_LARRY_ID, text: "17's a winner if you smile at it." },
    {
      characterId: LUCKY_LARRY_ID,
      text: "I've beaten 20s with 17s—luck's weird!",
    },
    { characterId: LUCKY_LARRY_ID, text: "Stand on 17, trust the vibe." },

    {
      characterId: UNLUCKY_URSULA_ID,
      text: "17? Cute. Dealer will show 19 just for me.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "I stand on 17; the house stands on my soul.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Seventeen—good enough to almost win.",
    },
  ],

  18: [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Eighteen—strong like my third whiskey.",
    },
    {
      characterId: DRUNK_DANNY_ID,
      text: "18's the 'don't touch anything' number.",
    },
    {
      characterId: DRUNK_DANNY_ID,
      text: "I'll toast to 18. Preferably twice.",
    },

    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "18! I can finally relax—oh no, my chips!",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "This is where I win… unless I sneeze on the shoe.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Eighteen feels safe. I'm standing very still.",
    },

    {
      characterId: CHATTY_CARLOS_ID,
      text: "18 is a solid quarter—profit if the dealer's soft.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "We protect 18s like brand equity.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Seventeen envies 18. I said what I said.",
    },

    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "18 has gentle energy. Don't jinx it.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "I'm sealing 18 with a crystal tap.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Eighteen is harmony. Standing.",
    },

    { characterId: COCKY_KYLE_ID, text: "18's fine. Dealer's drawing dead." },
    { characterId: COCKY_KYLE_ID, text: "If I lose with 18, I buy the pit." },
    { characterId: COCKY_KYLE_ID, text: "Stand. Pose. Win." },

    {
      characterId: NERVOUS_NANCY_ID,
      text: "18… is this when the dealer shows a 9? They always do.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Standing on 18, breathing exercises engaged.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Please don't make this dramatic, dealer.",
    },

    { characterId: LUCKY_LARRY_ID, text: "18 treats me like royalty." },
    { characterId: LUCKY_LARRY_ID, text: "Standing—my gut winked at me." },
    { characterId: LUCKY_LARRY_ID, text: "18 wins when I grin. Watch." },

    {
      characterId: UNLUCKY_URSULA_ID,
      text: "18? Great. Dealer's prepping a 19.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "I stand on 18; fate stands on me.",
    },
    { characterId: UNLUCKY_URSULA_ID, text: "Eighteen, the almost-hero." },
  ],

  19: [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Nineteen! I'm buying the next round.",
    },
    {
      characterId: DRUNK_DANNY_ID,
      text: "19's classy—like top-shelf regret tomorrow.",
    },
    { characterId: DRUNK_DANNY_ID, text: "Standing. Even I can't mess up 19." },

    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "19! Okay, I won't touch anything… *touches everything*",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "I love 19! It loves me back… I hope.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Standing on 19 with my best posture.",
    },

    {
      characterId: CHATTY_CARLOS_ID,
      text: "19 closes deals. That's a handshake number.",
    },
    { characterId: CHATTY_CARLOS_ID, text: "We lock 19. No heroics." },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Nineteen? That's quarterly profit vibes.",
    },

    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "19 radiates abundance. Don't break the aura.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "I'll bless this 19 with sage after.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Standing. The cosmos approves.",
    },

    { characterId: COCKY_KYLE_ID, text: "19? Dealer's toast." },
    { characterId: COCKY_KYLE_ID, text: "I win on 19 in my sleep." },
    { characterId: COCKY_KYLE_ID, text: "Stand. Smile. Collect." },

    {
      characterId: NERVOUS_NANCY_ID,
      text: "19… this is where the dealer flips a 20, right?",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "I'm standing, but I'm not happy about it.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Please, just once, let 19 be enough.",
    },

    { characterId: LUCKY_LARRY_ID, text: "19's basically a victory lap." },
    { characterId: LUCKY_LARRY_ID, text: "I could frame this 19. Beautiful." },
    { characterId: LUCKY_LARRY_ID, text: "Standing—my lucky day continues." },

    {
      characterId: UNLUCKY_URSULA_ID,
      text: "19? Perfect. Dealer's got a 20 warming up.",
    },
    { characterId: UNLUCKY_URSULA_ID, text: "I stand on 19 and fate laughs." },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Nineteen: the runner-up of hands.",
    },
  ],

  20: [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Twenty! So close I can taste it—like bourbon.",
    },
    {
      characterId: DRUNK_DANNY_ID,
      text: "I swear if the dealer pulls 21, I'm singing.",
    },
    { characterId: DRUNK_DANNY_ID, text: "Standing. Don't get cute, Danny." },

    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "20! Finally something I can't drop!",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "I love 20—please don't let me mess this up.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Standing on 20 with two hands—carefully.",
    },

    {
      characterId: CHATTY_CARLOS_ID,
      text: "20's the premium package. Close it.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "I'd sell a 20 as 'near-perfect' on a brochure.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Stand on 20. The brand demands it.",
    },

    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "20 glows. The aura is bright white.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "This is a don't-touch moment. Respect the light.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Standing. The universe whispers 'yes.'",
    },

    { characterId: COCKY_KYLE_ID, text: "20 is basically 21 in my world." },
    { characterId: COCKY_KYLE_ID, text: "If I lose with 20, I tip irony." },
    { characterId: COCKY_KYLE_ID, text: "Stand. Cue applause." },

    {
      characterId: NERVOUS_NANCY_ID,
      text: "20 scares me because fate is petty.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Standing on 20… please don't make this a lesson.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "If the dealer hits 21, I'm learning craps.",
    },

    { characterId: LUCKY_LARRY_ID, text: "20? That's my comfort food." },
    {
      characterId: LUCKY_LARRY_ID,
      text: "Standing—this one's already in the bag.",
    },
    { characterId: LUCKY_LARRY_ID, text: "20 loves me. The feeling's mutual." },

    {
      characterId: UNLUCKY_URSULA_ID,
      text: "20? Great. Dealer's rehearsing a 21.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "I stand on 20 and fate upgrades the dealer.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Twenty: perfect for losing by one.",
    },
  ],

  21: [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Twenty-one! I told you I'm a genius after three drinks!",
    },
    {
      characterId: DRUNK_DANNY_ID,
      text: "Blackjack, baby! Pour decisions pay off!",
    },
    { characterId: DRUNK_DANNY_ID, text: "Count it slow—I wanna savor this." },

    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "21! Oh! I did it—don't drop the cards, Claire!",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Blackjack?! I'm… I'm not touching anything.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "This is the part where I… *almost trips*—I'm okay!",
    },

    { characterId: CHATTY_CARLOS_ID, text: "21—now that's a premium close!" },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Blackjack! I'll add that to my highlight reel.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Twenty-one is what excellence looks like, team.",
    },

    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Blackjack! The cosmos just winked.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "I felt the alignment—perfect resonance!",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Twenty-one: the universe's love letter.",
    },

    { characterId: COCKY_KYLE_ID, text: "21. Obviously." },
    {
      characterId: COCKY_KYLE_ID,
      text: "Blackjack—clip it for the highlight reel.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "I told you I manifest 21s on command.",
    },

    { characterId: NERVOUS_NANCY_ID, text: "21?! Oh no—do I look suspicious?" },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Blackjack! Act natural. I'm acting natural.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "I won… is security coming? Kidding. Kind of.",
    },

    { characterId: LUCKY_LARRY_ID, text: "Twenty-one—my old friend!" },
    { characterId: LUCKY_LARRY_ID, text: "Called it! Felt it in the bones!" },
    { characterId: LUCKY_LARRY_ID, text: "Blackjack again? Tuesdays, man." },

    { characterId: UNLUCKY_URSULA_ID, text: "21? Did someone swap my cards?" },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Blackjack! Quick—before the universe notices!",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
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
      characterId: DRUNK_DANNY_ID,
      text: "Soft 13? I can't even feel the floor—hit me.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "A-two… I think this is the nudge number. Carefully… hit.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Soft 13 is runway, not touchdown. We build from here.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Soft 13 whispers 'growth.' The aura says one more card.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Soft 13? I turn crumbs into caviar. Hit.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Is soft 13… safe? It sounds safe. It isn't, is it?",
    },
    {
      characterId: LUCKY_LARRY_ID,
      text: "Soft 13's a lucky seed—plant it with a hit!",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Soft 13? I'll still find a way to brick it.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Low soft totals are R&D—invest a card.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "I'm drawing—my quartz warmed up on soft 13.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Hit. Don't overthink kindergarten totals.",
    },
    {
      characterId: DRUNK_DANNY_ID,
      text: "Soft 13's like karaoke—one more round sounds right.",
    },
  ],
  "A,3": [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Soft 14—training wheels. Give me a push.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "A-three… I always bump the table here. Hit… gently.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Soft 14? Iterate. Ship another card.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Soft 14 has curious energy. I'll invite one more card.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Soft 14: hit. We're not scared of success.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Soft 14 is… flexible? Okay, hit before I panic.",
    },
    {
      characterId: LUCKY_LARRY_ID,
      text: "Soft 14 wins if you smile at it—tap me a card.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Soft 14? Dealers love turning that into my problem.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "We're prototyping on soft 14—draw.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "The incense curls right—one more card.",
    },
    { characterId: COCKY_KYLE_ID, text: "Hit. Momentum is a lifestyle." },
    { characterId: DRUNK_DANNY_ID, text: "Soft 14—another sip, another card." },
  ],
  "A,4": [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Soft 15? I'm feeling brave and slightly sideways. Hit.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "A-four… okay, okay—add one. Don't spill it, Claire.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Soft 15? We scale. Add resources—hit.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Soft 15 hums like a tuning fork—draw.",
    },
    { characterId: COCKY_KYLE_ID, text: "Soft 15: still sandbox mode. Hit." },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Soft 15 is supposed to be easy, right? Please say yes.",
    },
    {
      characterId: LUCKY_LARRY_ID,
      text: "Soft 15—my gut says we're cooking. One more!",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Soft 15 is where I invent new ways to lose.",
    },
    { characterId: CHATTY_CARLOS_ID, text: "We're not done baking—hit it." },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Cards feel warm—invite another.",
    },
    { characterId: COCKY_KYLE_ID, text: "Hit. We're pre-hero phase." },
    {
      characterId: DRUNK_DANNY_ID,
      text: "Soft 15's a 'why not' number. Why not? Hit.",
    },
  ],
  "A,5": [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Soft 16—worst hard, best soft. I'll drink to that. Hit.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "A-five… I always fumble this. Hit, and don't drop anything.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Soft 16's an optimization problem—draw.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Soft 16 has restless energy—bring a friend.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Soft 16? I turn it into highlight reels. Hit.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Soft 16 makes me overthink soft hands. Hit before I spiral.",
    },
    { characterId: LUCKY_LARRY_ID, text: "Soft 16 likes me—tap another card." },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Soft 16 is the prank call of totals.",
    },
    { characterId: CHATTY_CARLOS_ID, text: "Iterate again. Hit." },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "The pendulum swung yes—draw.",
    },
    { characterId: COCKY_KYLE_ID, text: "Hit. We're hunting 18+." },
    { characterId: DRUNK_DANNY_ID, text: "Soft 16? Send it and sip." },
  ],
  "A,6": [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Soft 17—the great debate. I vote chaos: hit.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "A-six… this always starts an argument. I'll just hit… sorry!",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Soft 17 is policy-driven—context matters. Default: hit.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Soft 17 buzzes—if the dealer's strong, I'll invite another.",
    },
    { characterId: COCKY_KYLE_ID, text: "Soft 17? I upgrade mid-flight. Hit." },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Soft 17 makes my eye twitch. Hit, quickly.",
    },
    {
      characterId: LUCKY_LARRY_ID,
      text: "Soft 17's a wink from the universe—give me one more.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Soft 17: the 'almost' that haunts me. Hit it.",
    },
    { characterId: CHATTY_CARLOS_ID, text: "We don't ship 17—iterate. Hit." },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Crystal says 'just one more.'",
    },
    { characterId: COCKY_KYLE_ID, text: "Hit. Winners accelerate." },
    { characterId: DRUNK_DANNY_ID, text: "Soft 17—more card, more courage." },
  ],
  "A,7": [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Soft 18—feels strong till the dealer flexes. I'll stand… or not.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "A-seven… I stand unless the dealer looks scary.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Soft 18 is situational leadership—stand vs. weak, hit vs. strong.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Soft 18 glows—stand if the aura is calm.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Soft 18? I split atoms with this—double if they blink.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Soft 18 confuses me. Stand… unless that's bad?",
    },
    {
      characterId: LUCKY_LARRY_ID,
      text: "Soft 18 treats me well—stand unless fate frowns.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Soft 18 is my favorite way to lose to 19.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "We posture-strength on soft 18—stand on weak upcards.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "If the candle flickers, I hit. If not, I stand.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Against a weak face? I double. Alpha tax.",
    },
    {
      characterId: DRUNK_DANNY_ID,
      text: "Soft 18—stand steady unless the dealer's mean.",
    },
  ],
  "A,8": [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Soft 19? I stand tall—no hero shots needed.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "A-eight—whew! I'm standing very still.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Soft 19 is a signed contract—no edits.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Soft 19 radiates peace. Don't touch it.",
    },
    { characterId: COCKY_KYLE_ID, text: "Soft 19? I strike a pose and win." },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Soft 19 makes me think the dealer has 20. I'm standing anyway.",
    },
    {
      characterId: LUCKY_LARRY_ID,
      text: "Soft 19's a sweetheart—stand and sip the luck.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Soft 19? Perfect way to lose by one.",
    },
    { characterId: CHATTY_CARLOS_ID, text: "Lock it in—stand." },
    { characterId: SUPERSTITIOUS_SUSAN_ID, text: "The aura says 'hands off.'" },
    { characterId: COCKY_KYLE_ID, text: "Standing. Screenshot this win." },
    { characterId: DRUNK_DANNY_ID, text: "Soft 19—no touching, no trouble." },
  ],
  "A,9": [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Soft 20—chef's kiss. I'm not moving.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "A-nine—stand and try not to drop anything, Claire.",
    },
    { characterId: CHATTY_CARLOS_ID, text: "Soft 20 is premium—zero changes." },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Soft 20 is sacred. Stand in stillness.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Soft 20? Basically 21 with manners. Stand.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Standing on soft 20 while bracing for disaster.",
    },
    { characterId: LUCKY_LARRY_ID, text: "Soft 20 hugs me back—stand." },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Soft 20? Dealer's sharpening a 21 just for me.",
    },
    { characterId: CHATTY_CARLOS_ID, text: "We don't fix perfect—stand." },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Do not disturb the balance.",
    },
    { characterId: COCKY_KYLE_ID, text: "Stand. Collect. Smile." },
    { characterId: DRUNK_DANNY_ID, text: "Soft 20—hands off, heart on." },
  ],
  "A,10": [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Soft 21? That's just called 'I'm a genius.'",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "A-ten—twenty-one! I will not move a muscle.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Soft 21 is final form—celebrate responsibly.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Soft 21 is cosmic alignment—receive it.",
    },
    { characterId: COCKY_KYLE_ID, text: "Twenty-one. Obviously." },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "21! Act casual. I'm acting casual.",
    },
    { characterId: LUCKY_LARRY_ID, text: "Soft 21—told you my bones knew." },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "I got 21? Quick, take a photo before fate notices.",
    },
    { characterId: CHATTY_CARLOS_ID, text: "Close the deal—tip and smile." },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "The universe says 'yes' in neon.",
    },
    { characterId: COCKY_KYLE_ID, text: "Clip it for the reel." },
    {
      characterId: DRUNK_DANNY_ID,
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
      characterId: DRUNK_DANNY_ID,
      text: "Dealer 2? I'll drink to the bust gods.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Two up—everyone says 'be gentle.' I will try!",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Two is a weak opener—exploit, don't overextend.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Dealer two has sleepy energy—let it fall.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Dealer 2? I'm already counting chips.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Two scares me less, which somehow scares me more.",
    },
    { characterId: LUCKY_LARRY_ID, text: "Two up? My cue to win politely." },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Dealer 2—watch them craft a miracle anyway.",
    },
    { characterId: CHATTY_CARLOS_ID, text: "Press small edges—this is one." },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "The candle barely flickers—good omen.",
    },
    { characterId: COCKY_KYLE_ID, text: "Time to farm easy money." },
    {
      characterId: DRUNK_DANNY_ID,
      text: "Two up? Dealer's on training wheels.",
    },
  ],
  "3": [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Dealer 3—still flimsy. I'll swagger a bit.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Three up—steady hands, steady bets.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Three is soft leverage—work it smart.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Dealer three glows faintly—opportunity.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Three? I could win this blindfolded.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Dealer 3… good for us, right? Right?",
    },
    {
      characterId: LUCKY_LARRY_ID,
      text: "Three's friendly—chips like me here.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Three up—cue my creative losing.",
    },
    { characterId: CHATTY_CARLOS_ID, text: "Lean in, but don't lunge." },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "My rabbit's foot is calm—nice.",
    },
    { characterId: COCKY_KYLE_ID, text: "Let's farm another pot." },
    { characterId: DRUNK_DANNY_ID, text: "Dealer 3? Pour confidence." },
  ],
  "4": [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Dealer 4—don't touch anything. Let 'em fall.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Four up—this is the 'don't ruin it' card.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Four is a spreadsheet gift—play disciplined.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Dealer four is fragile—respect the ritual.",
    },
    { characterId: COCKY_KYLE_ID, text: "Four? I'm already spending the win." },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Four makes me hold my breath… standing… still.",
    },
    { characterId: LUCKY_LARRY_ID, text: "Four is gravy—keep it simple." },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Dealer 4—watch them pull a masterpiece.",
    },
    { characterId: CHATTY_CARLOS_ID, text: "Edge management time." },
    { characterId: SUPERSTITIOUS_SUSAN_ID, text: "The aura says: patience." },
    { characterId: COCKY_KYLE_ID, text: "Don't blink, just bank." },
    { characterId: DRUNK_DANNY_ID, text: "Dealer 4? I'll toast to gravity." },
  ],
  "5": [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Dealer 5—my favorite domino to tip.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Five up—everyone freeze! Let them bust.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Dealer five: maximum weakness, minimum ego.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Five crackles—don't disrupt the fall.",
    },
    { characterId: COCKY_KYLE_ID, text: "Five? Free money with a bow on it." },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Five up—do nothing reckless. Do… nothing…",
    },
    {
      characterId: LUCKY_LARRY_ID,
      text: "A five up-card is my lucky billboard.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Dealer 5—watch me find the one losing line.",
    },
    { characterId: CHATTY_CARLOS_ID, text: "We press edges—smartly." },
    { characterId: SUPERSTITIOUS_SUSAN_ID, text: "Quiet hands. Gentle air." },
    { characterId: COCKY_KYLE_ID, text: "Stand tall, stack chips." },
    {
      characterId: DRUNK_DANNY_ID,
      text: "Five says 'don't get cute.' I won't—probably.",
    },
  ],
  "6": [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Dealer 6? Nobody breathe—let the magic work.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Six up—this is the 'hands off' special.",
    },
    { characterId: CHATTY_CARLOS_ID, text: "Six is a layup—protect the edge." },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Six shines—do less, receive more.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Six? I'll stand here and look expensive.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Six makes me think the universe might be kind.",
    },
    {
      characterId: LUCKY_LARRY_ID,
      text: "Six is my favorite spectator sport.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Dealer 6—somehow still my villain origin story.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Edge discipline: don't overplay it.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Sage the air—let them topple.",
    },
    { characterId: COCKY_KYLE_ID, text: "Minimal actions, maximum smug." },
    { characterId: DRUNK_DANNY_ID, text: "Six up? I'll just sip and win." },
  ],
  "7": [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Dealer 7—alright, now we gotta earn it.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Seven up—no freebies here. Focus, Claire.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Seven is parity—play the book, not the ego.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Seven hums neutral—act with care.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Seven? I still like my side of the table.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Seven up makes me over-analyze. Breathe.",
    },
    { characterId: LUCKY_LARRY_ID, text: "Seven's fair—luck can tip it." },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Dealer 7—prime time for my almost-win.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Execute fundamentals. No theatrics.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "If the candle bends, reconsider. Otherwise, proceed.",
    },
    { characterId: COCKY_KYLE_ID, text: "We still swagger—measured swagger." },
    { characterId: DRUNK_DANNY_ID, text: "Seven? I can work with that." },
  ],
  "8": [
    { characterId: DRUNK_DANNY_ID, text: "Dealer 8—coin flip with attitude." },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Eight up—steady… don't knock the edge off.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Eight is balanced—lean on policy.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Eight feels cloudy—move with intention.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Eight? I still like my chances more than theirs.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Eight up—why do my hands sweat right now?",
    },
    { characterId: LUCKY_LARRY_ID, text: "Eight is where luck loves a cameo." },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Dealer 8—watch the art of losing narrowly.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Playbook time—decision hygiene matters.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "If my crystal cools, I'll stand. If not, I act.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Pick the line and commit. No flinch.",
    },
    { characterId: DRUNK_DANNY_ID, text: "Eight? Pour me courage, not chaos." },
  ],
  "9": [
    { characterId: DRUNK_DANNY_ID, text: "Dealer 9—now it's a real fight." },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Nine up—okay, okay… this one's serious.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Nine is pressure—optimize or perish.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Nine sparks—choose cards, not vibes.",
    },
    { characterId: COCKY_KYLE_ID, text: "Nine? Good. I like competition." },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Nine up makes my stomach do math.",
    },
    { characterId: LUCKY_LARRY_ID, text: "Nine? I've charmed worse." },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Dealer 9—my cue to perform a dignified loss.",
    },
    { characterId: CHATTY_CARLOS_ID, text: "Tight decisions only—no heroics." },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "I'll draw if the incense leans—come on wind…",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Double if the script allows. We don't blink.",
    },
    { characterId: DRUNK_DANNY_ID, text: "Nine up? Time to earn my drink." },
  ],
  "10": [
    {
      characterId: DRUNK_DANNY_ID,
      text: "Dealer 10—assume pain, hope for comedy.",
    },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Ten up—my 'don't spill a thing' card.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Ten is the market leader—play perfect or pay.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Ten radiates intensity—steel your aura.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Ten? I still sign checks after this.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Ten up—this is where I whisper apologies to fate.",
    },
    {
      characterId: LUCKY_LARRY_ID,
      text: "Ten's tough—good thing luck likes me.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Dealer 10—my old nemesis returns.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "We respect tens—tighten the playbook.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Protect your energy; take only good risks.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "If I win into a ten, I'm insufferable. Get ready.",
    },
    { characterId: DRUNK_DANNY_ID, text: "Ten up? I'll need a braver drink." },
  ],
  A: [
    { characterId: DRUNK_DANNY_ID, text: "Dealer Ace—now I'm sober. Briefly." },
    {
      characterId: CLUMSY_CLAIRE_ID,
      text: "Ace up—insurance? I… uh… I always drop that question.",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Ace is uncertainty—don't donate to fear.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Ace glows like a comet—shield your luck.",
    },
    {
      characterId: COCKY_KYLE_ID,
      text: "Ace up? Good. I like winning the hard way.",
    },
    {
      characterId: NERVOUS_NANCY_ID,
      text: "Ace makes me want to hide under the table. Metaphorically.",
    },
    {
      characterId: LUCKY_LARRY_ID,
      text: "Ace up? I've charmed plenty of those.",
    },
    {
      characterId: UNLUCKY_URSULA_ID,
      text: "Dealer Ace—of course they have blackjack. Why wouldn't they?",
    },
    {
      characterId: CHATTY_CARLOS_ID,
      text: "Decline bad insurance. Invest in good lines.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN_ID,
      text: "Salt the luck, breathe, decide.",
    },
    { characterId: COCKY_KYLE_ID, text: "I'll still get paid. Watch." },
    {
      characterId: DRUNK_DANNY_ID,
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

/**
 * Get character reaction when dealt initial hand
 * Uses character-specific bigWin reactions for blackjack, generic for others
 */
export function getInitialHandReaction(
  character: AICharacter,
  handValue: number,
  hasBlackjack: boolean,
  dealerUpCard?: { rank: string; suit: string },
): string | null {
  // Blackjack - use generic celebration
  if (hasBlackjack) {
    const blackjackReactions = [
      "BLACKJACK! YES!",
      "Twenty-one baby!",
      "Blackjack! That's what I'm talking about!",
      "Natural blackjack! Love it!",
    ];
    return blackjackReactions[
      Math.floor(Math.random() * blackjackReactions.length)
    ];
  }

  // Twenty - use generic celebration (not personality-specific)
  if (handValue === 20) {
    const reactions = GENERIC_INITIAL_REACTIONS.twenty;
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  // Bad hands - use personality-specific reactions for more variety
  const dealerRank = dealerUpCard?.rank;
  const isDealerStrong =
    dealerRank &&
    ["7", "8", "9", "10", "J", "Q", "K", "A"].includes(dealerRank);

  // Very weak hands (5-8): Always bad
  if (handValue >= 5 && handValue <= 8) {
    return getPersonalityReaction(character.personality, "badStart");
  }

  // Stiff hands (12-16): Bad, especially vs strong dealer
  // Only show reaction if dealer is showing strength or if hand is very stiff (14-16)
  if (
    handValue >= 12 &&
    handValue <= 16 &&
    (isDealerStrong || handValue >= 14)
  ) {
    return getPersonalityReaction(character.personality, "badStart");
  }

  // Note: 9-11 are good/neutral (can't bust, double-down candidates) so no reaction
  // Note: 17-19 are solid hands, no reaction needed
  return null;
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
 * Get character reaction at end of hand based on outcome
 */
export function getEndOfHandReaction(
  character: AICharacter,
  outcome: "bigWin" | "smallWin" | "push" | "smallLoss" | "bigLoss",
  context: "bust" | "blackjack" | "dealerBlackjack" | "dealerWin" | "any",
): string | null {
  // Map outcomes to personality situations
  if (outcome === "bigWin" && context === "blackjack") {
    // Use generic blackjack celebration for big wins
    const blackjackReactions = [
      "BLACKJACK! YES!",
      "Twenty-one baby!",
      "Blackjack! That's what I'm talking about!",
      "Natural blackjack! Love it!",
    ];
    return blackjackReactions[
      Math.floor(Math.random() * blackjackReactions.length)
    ];
  }

  if (outcome === "smallWin") {
    // Small win personality reactions
    const winReactions = PERSONALITY_WIN_REACTIONS[character.personality];
    return winReactions[Math.floor(Math.random() * winReactions.length)];
  }

  if (outcome === "push") {
    // Push personality reactions
    const pushReactions = PERSONALITY_PUSH_REACTIONS[character.personality];
    return pushReactions[Math.floor(Math.random() * pushReactions.length)];
  }

  if (outcome === "smallLoss" && context === "dealerWin") {
    // Dealer beat us reactions
    const lossReactions = PERSONALITY_LOSS_REACTIONS[character.personality];
    return lossReactions[Math.floor(Math.random() * lossReactions.length)];
  }

  if (outcome === "bigLoss" && context === "dealerBlackjack") {
    // Dealer got blackjack reactions
    const dealerBJReactions =
      PERSONALITY_DEALER_BLACKJACK_REACTIONS[character.personality];
    return dealerBJReactions[
      Math.floor(Math.random() * dealerBJReactions.length)
    ];
  }

  // Don't show bust reactions at end of hand - they were already shown during the turn
  return null;
}

/**
 * Helper: Add decision-specific comments to pool
 */
function addDecisionComments(
  commentPool: string[],
  decision: "hit" | "stand",
  commentary: NonNullable<CharacterDialogue["decisionCommentary"]>,
  maxCount?: number,
) {
  const comments =
    decision === "hit" ? commentary.shouldHit : commentary.shouldStand;
  if (comments) {
    const toAdd = maxCount ? comments.slice(0, maxCount) : comments;
    commentPool.push(...toAdd);
  }
}

/**
 * Helper: Build comment pool for high skill players
 */
function buildHighSkillComments(
  isCorrectPlay: boolean,
  decision: "hit" | "stand",
  commentary: NonNullable<CharacterDialogue["decisionCommentary"]>,
): string[] {
  const pool: string[] = [];

  if (isCorrectPlay) {
    // High skill making correct play = confident
    if (commentary.confident) {
      pool.push(...commentary.confident);
    }
    addDecisionComments(pool, decision, commentary, 2);
  } else if (commentary.uncertain) {
    // High skill making incorrect play = uncertain/conflicted
    pool.push(...commentary.uncertain);
  }

  return pool;
}

/**
 * Helper: Build comment pool for low skill players
 */
function buildLowSkillComments(
  isCorrectPlay: boolean,
  decision: "hit" | "stand",
  commentary: NonNullable<CharacterDialogue["decisionCommentary"]>,
): string[] {
  const pool: string[] = [];

  if (isCorrectPlay) {
    // Low skill making correct play = uncertain (got lucky)
    if (commentary.uncertain) {
      pool.push(...commentary.uncertain);
    }
    addDecisionComments(pool, decision, commentary);
  } else {
    // Low skill making incorrect play = overconfident
    if (commentary.confident) {
      pool.push(...commentary.confident);
    }
    addDecisionComments(pool, decision, commentary);
  }

  return pool;
}

/**
 * Helper: Build comment pool for medium skill players
 */
function buildMediumSkillComments(
  isCorrectPlay: boolean,
  handValue: number,
  decision: "hit" | "stand",
  commentary: NonNullable<CharacterDialogue["decisionCommentary"]>,
): string[] {
  const pool: string[] = [];
  const toughHand = handValue >= 12 && handValue <= 16;

  // Medium skill = mix of everything, lean uncertain on tough hands
  if (toughHand && commentary.uncertain) {
    pool.push(...commentary.uncertain);
  }
  addDecisionComments(pool, decision, commentary);
  if (isCorrectPlay && commentary.confident) {
    pool.push(...commentary.confident.slice(0, 2));
  }

  return pool;
}

/**
 * Get strategy-aware decision commentary for an AI player
 * Shows their thinking process before making a decision
 *
 * @param characterId - The character's ID
 * @param decision - What they're about to do ("hit" or "stand")
 * @param skillLevel - Character's skill level (0-100)
 * @param handValue - Current hand value
 * @param isCorrectPlay - Whether this follows basic strategy
 * @returns A decision commentary string or null
 */
export function getDecisionCommentary(
  characterId: string,
  decision: "hit" | "stand",
  skillLevel: number,
  handValue: number,
  isCorrectPlay: boolean,
): string | null {
  const characterDialogue = CHARACTER_DIALOGUE[characterId];
  if (!characterDialogue?.decisionCommentary) {
    return null;
  }

  const commentary = characterDialogue.decisionCommentary;

  // Strategy-aware logic:
  // - High skill (>=70) + correct = confident
  // - High skill + incorrect = uncertain
  // - Low skill (<50) + correct = uncertain (lucky)
  // - Low skill + incorrect = overconfident
  // - Medium skill (50-69) = mixed

  const highSkill = skillLevel >= 70;
  const lowSkill = skillLevel < 50;

  let commentPool: string[];
  if (highSkill) {
    commentPool = buildHighSkillComments(isCorrectPlay, decision, commentary);
  } else if (lowSkill) {
    commentPool = buildLowSkillComments(isCorrectPlay, decision, commentary);
  } else {
    commentPool = buildMediumSkillComments(
      isCorrectPlay,
      handValue,
      decision,
      commentary,
    );
  }

  // Return random comment from pool
  if (commentPool.length > 0) {
    return commentPool[Math.floor(Math.random() * commentPool.length)];
  }

  return null;
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
