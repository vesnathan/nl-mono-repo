// ==============================
// Dialogue Extensions (Non-breaking)
// ==============================

type Outcome = "bigWin" | "smallWin" | "push" | "smallLoss" | "bigLoss";

export interface CharacterDialogueAddons {
  id: string; // Must match AICharacter.id
  /** Appends to existing distractions */
  extraDistractions?: string[];
  /** Appends to existing reactions */
  extraReactions?: Partial<Record<Outcome, string[]>>;

  /** New, optional dialogue categories */
  preGame?: string[]; // when sitting / buying in
  midGame?: string[]; // while deciding (hit/stand/double/split)
  afterDealerFlip?: string[]; // after dealer reveals hole card / draws out
  banterWithPlayer?: { text: string; isPatreon: boolean }[]; // directed at other players (incl. human)
  banterWithDealer?: string[]; // directed at dealer only
  quirkyActions?: string[]; // short stage directions for UI flavor
}

/** Utility to safely pick a random item */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Merge helpers so you can non-destructively compose with your existing data */
export function getAllDistractions(
  characterId: string,
  base: string[],
  addons: CharacterDialogueAddons[],
): string[] {
  const add = addons.find((a) => a.id === characterId);
  return add?.extraDistractions ? [...base, ...add.extraDistractions] : base;
}

export function getAllReactions(
  characterId: string,
  base: Record<Outcome, string[]>,
  addons: CharacterDialogueAddons[],
): Record<Outcome, string[]> {
  const add = addons.find((a) => a.id === characterId);
  if (!add?.extraReactions) return base;
  const out: Record<Outcome, string[]> = { ...base };
  (Object.keys(add.extraReactions) as Outcome[]).forEach((k) => {
    out[k] = [...(out[k] ?? []), ...(add.extraReactions![k] ?? [])];
  });
  return out;
}

/** New categories getter (undefined-safe) */
export function getDialogueCategory(
  characterId: string,
  addons: CharacterDialogueAddons[],
  key: keyof Omit<
    CharacterDialogueAddons,
    "id" | "extraDistractions" | "extraReactions"
  >,
): string[] {
  const add = addons.find((a) => a.id === characterId);
  return (add?.[key] as string[] | undefined) ?? [];
}

// ==============================
// Character Dialogue Addons
// (Expanded lines & new categories)
// ==============================

export const AI_DIALOGUE_ADDONS: CharacterDialogueAddons[] = [
  // -------------------------------------------------
  // DRUNK DANNY
  // -------------------------------------------------
  {
    id: "drunk-danny",
    extraDistractions: [
      "Whaddaya mean table minimum? I got minimums… somewhere…",
      "I swear these chips multiply when I blink.",
      "If I double, does that mean double drinks too?",
      "My buddy Joey hit 17 once and married the dealer. True story.",
      "Hold on—this coaster’s my lucky one. No, the other one.",
      "If the room stops spinning, deal me in. Wait—already in?",
      "Barkeep! Hydration is key. Another whiskey!",
      "You ever notice how cards smell like fortune and bad ideas?",
    ],
    extraReactions: {
      bigWin: [
        "I’m buying shots for the whole town! Population: us!",
        "Knew it! My elbow tingled—that’s my blackjack elbow.",
        "Let the record show: I’m a genius after three whiskeys.",
      ],
      smallWin: [
        "A win’s a win—put it on my tab.",
        "Still hot. Like my mixtape in ’89.",
        "Give me the quiet clap—no, louder!",
      ],
      push: [
        "Push? Is that like… foreplay for winning?",
        "Tie goes to the handsome guy—no? Worth a try.",
        "We’re dancing, dealer. Next one’s mine.",
      ],
      smallLoss: [
        "I didn’t lose, I invested in memories.",
        "That felt illegal in three states.",
        "Dealer, you owe me an apology drink.",
      ],
      bigLoss: [
        "Busted like my second marriage!",
        "That’s okay—my pension loves pain.",
        "Put it on the highlight reel of poor choices!",
      ],
    },
    preGame: [
      "Seat warm? I play better on warm chairs.",
      "I brought exact buy-in: ‘some’ dollars.",
      "Where’s the wind coming from? I like a tailwind.",
      "Deal me something I can toast to.",
      "Anyone seen my lucky coin? Found it—behind my ear!",
    ],
    midGame: [
      "Hit me—softly. Like a lullaby.",
      "Stand! Like me at my grandson’s recital.",
      "Double? Double. Double sounds like breakfast.",
      "Split? My vision’s already split, so sure.",
      "What do you think, conscience? …He says YOLO.",
      "I’ll follow my gut; it’s been fed well.",
    ],
    afterDealerFlip: [
      "Oh no, not the ten parade again!",
      "I knew it—my hiccup predicted this.",
      "Plot twist! And I forgot my popcorn.",
      "Dealer, be gentle. I bruise emotionally.",
      "If you pull a 21, I’ll pull another whiskey.",
    ],
    banterWithPlayer: [
      { text: "You counting? I'm discounting.", isPatreon: false },
      { text: "Buddy, if I win, we win. That's friendship math.", isPatreon: false },
      { text: "Swap seats? Mine's haunted by bad decisions.", isPatreon: false },
      { text: "Advice? Never trust even numbers. Or odd ones.", isPatreon: false },
      { text: "You got a system? I got a symptom.", isPatreon: false },
      { text: "Hold my drink—no don't, I'll lose track of both.", isPatreon: false },
      { text: "Someone here's got unlimited chips? Must be nice!", isPatreon: true },
      { text: "I heard about those founding member badges—shiny!", isPatreon: true },
    ],
    banterWithDealer: [
      "I tip in jokes and occasional chips.",
      "Blink twice if you’re rooting for me.",
      "I’ll stand if you promise not to.",
      "Your shuffle reminds me of the sea. I’m seasick.",
      "Deal me mercy. Just a little.",
      "I’ll name my next drink after you if this works.",
    ],
    quirkyActions: [
      "*counts chips out loud, loses count at 7*",
      "*toasts the shoe with his glass*",
      "*puts sunglasses on upside down*",
      "*leans in, whispers to cards* Be cool.",
      "*arranges chips into a smiley face*",
      "*holds breath for ‘lucky draw’*",
    ],
  },

  // -------------------------------------------------
  // CLUMSY CLAIRE
  // -------------------------------------------------
  {
    id: "clumsy-claire",
    extraDistractions: [
      "*fumbles players card* Oh gosh—sorry! Do you need that?",
      "Is this my stack or your stack? I’m so sorry!",
      "Why do chips always jump out of my hands?",
      "If I sneeze, do I forfeit my turn?",
      "Who put roller skates on this floor? (It’s me. I’m clumsy.)",
      "*spills a single chip* That’s my oops tax.",
      "My book club said I should ‘hit’ more often—at the gym.",
      "If anyone needs napkins, I travel with a pack.",
    ],
    extraReactions: {
      bigWin: [
        "Eee! I did it! …Did I knock anything over?",
        "Blackjack! Hands still… steady… kinda!",
        "This must be what grace feels like!",
      ],
      smallWin: [
        "A tidy little win! I’ll stack carefully—probably.",
        "Oh nice! I didn’t even drop a chip!",
        "Yay! Progress without collateral damage.",
      ],
      push: [
        "A tie is tidy. I like tidy.",
        "Push? Okay! Nothing fell, so that’s a win.",
        "We’re balanced—like I wish my hands were.",
      ],
      smallLoss: [
        "Oops—there it goes. The luck, not the chips. (Yet.)",
        "I’ll get it back—carefully!",
        "Lesson learned… again!",
      ],
      bigLoss: [
        "Busted—me and probably this chip tower…",
        "Oh no! Cards AND gravity against me!",
        "Okay, deep breath. We reset. We rebuild.",
      ],
    },
    preGame: [
      "Hi! I’ll just—oh—sorry—slid into this seat.",
      "Buy-in please! Small bills… fewer accidents.",
      "I brought a tiny towel. Just in case.",
      "Promise to tell me if I’m elbowing you.",
      "Let’s have a gentle shoe tonight, please.",
    ],
    midGame: [
      "Hit—carefully—carefully—thank you!",
      "I’ll stand before I drop something.",
      "Double? I can do two things at once… maybe.",
      "Splitting makes me nervous—but okay!",
      "Is ‘sorry’ a legal move? I use it a lot.",
      "I’ll trust my first instinct, not my clumsy second.",
    ],
    afterDealerFlip: [
      "Oh! That changed fast. Like my chip stacks.",
      "Here comes the suspense… hold on to your beverages!",
      "Please don’t be a ten. Please don’t—oh.",
      "I’ll fetch napkins if this goes south.",
      "I can feel my cards blushing for me.",
    ],
    banterWithPlayer: [
      { text: "If I knock anything of yours, I replace it!", isPatreon: false },
      { text: "Tell me if I'm in your space—I do that.", isPatreon: false },
      { text: "You look composed. Teach me your ways!", isPatreon: false },
      { text: "What's your system? Mine is 'don't drop things'.", isPatreon: false },
      { text: "We're in this together—me and my apologies.", isPatreon: false },
      { text: "I'll cheer loudly… but softly.", isPatreon: false },
      { text: "Those supporter badges are so pretty—I want one!", isPatreon: true },
      { text: "Monthly chip bonuses sound like a dream…", isPatreon: true },
    ],
    banterWithDealer: [
      "I promise to keep my elbows inside the vehicle.",
      "If I scatter chips, I’ll tip in neat piles!",
      "You shuffle so smoothly—teach my hands?",
      "I’ll stand to avoid a spill. Responsible gaming!",
      "Do you have ‘spill insurance’ for players like me?",
      "I pre-apologize for future me.",
    ],
    quirkyActions: [
      "*steadies drink with two coasters*",
      "*lines chips by color to avoid wobble*",
      "*softly rehearses ‘hit/stand’ before turn*",
      "*offers napkins to table like a hostess*",
      "*pats pockets for phone, drops a pen instead*",
      "*nudges chair in tiny increments to be centered*",
    ],
  },

  // -------------------------------------------------
  // CHATTY CARLOS
  // -------------------------------------------------
  {
    id: "chatty-carlos",
    extraDistractions: [
      "You know, inventory turns are like shoes—move them fast!",
      "Margins! That’s what this game is about, margins.",
      "You drive? I can get you a deal tomorrow.",
      "My podcast? ‘Deal or Wheel’—check it out.",
      "CRM says follow-ups win. Same with splits.",
      "Q4 is where legends are made—watch this hand.",
      "Networking tip: always celebrate other people’s wins.",
      "I coach my team: smart risks, not wild ones.",
    ],
    extraReactions: {
      bigWin: [
        "Blackjack! Pipeline just closed, baby!",
        "That’s the closer’s touch right there.",
        "Twenty-one—put it on the leaderboard.",
      ],
      smallWin: [
        "Solid. That’s a 12% bump to morale.",
        "We’ll stack these like quarterly goals.",
        "Predictable, repeatable, profitable.",
      ],
      push: [
        "Break-even—acceptable, not ideal.",
        "Push is just runway for the next sale.",
        "No loss? We live to optimize.",
      ],
      smallLoss: [
        "Consider it customer acquisition cost.",
        "We’ll recoup next hand—adjust tactic.",
        "Data says variance. I say comeback.",
      ],
      bigLoss: [
        "That’s a write-off in my heart.",
        "Dealer, you just ate my gross margin.",
        "Reset. Reframe. Refocus. Next.",
      ],
    },
    preGame: [
      "Seat open? Great—time to build rapport.",
      "Buy-in’s a marketing spend on fun.",
      "Dealer, you run a tight operation. Respect.",
      "Let’s make tonight KPI: keep play interesting.",
      "I’m here for value—and maybe a story.",
    ],
    midGame: [
      "Hit—like a limited-time promo.",
      "Stand. Discipline beats impulse.",
      "Double—high confidence signal.",
      "Split—diversify the portfolio.",
      "Gut says stand, data says hit… data wins.",
      "I’d A/B test this if I could.",
    ],
    afterDealerFlip: [
      "Here comes the ten factory—brace.",
      "I’ve seen this movie: alternate ending, please.",
      "Dealer velocity is high—pray for low cards.",
      "That reveal just changed my forecast.",
      "Risk adjusted expectations… lowering.",
    ],
    banterWithPlayer: [
      { text: "You play often? What's your conversion rate?", isPatreon: false },
      { text: "I celebrate your wins—rising tide stuff.", isPatreon: false },
      { text: "You count? I count cars. Fair trade.", isPatreon: false },
      { text: "Your table presence says 'ops manager'.", isPatreon: false },
      { text: "Need a pep talk? I've got a catalog.", isPatreon: false },
      { text: "We're co-pilots. You call the turbulence.", isPatreon: false },
      { text: "ROI on that Platinum tier is impressive—smart investment.", isPatreon: true },
      { text: "Those lifetime chips for early adopters? Brilliant retention strategy.", isPatreon: true },
      { text: "100% chip bonus? That's a strong value proposition.", isPatreon: true },
    ],
    banterWithDealer: [
      "That shuffle is premium—German engineering vibes.",
      "If I win big, first ride’s on me—convertible.",
      "Dealer, are we friends? It affects my luck.",
      "I respect a professional—deal me a fair fight.",
      "We’re negotiating with fate together.",
      "Close this one for me and I’ll send referrals.",
    ],
    quirkyActions: [
      "*sketches a ‘win funnel’ on a napkin*",
      "*taps a rhythm like a sales cadence*",
      "*stacks chips by ‘quarters’ with labels*",
      "*offers handshake after nice hands*",
      "*checks imaginary dashboard in the air*",
      "*gives a tiny motivational nod to table*",
    ],
  },

  // -------------------------------------------------
  // SUPERSTITIOUS SUSAN
  // -------------------------------------------------
  {
    id: "superstitious-susan",
    extraDistractions: [
      "Hold on—let me align my crystals by suit.",
      "The shoe feels… smoky. Sage would help.",
      "Please don’t sit there; it blocks my energy flow.",
      "I only bet after a deep breath ritual.",
      "Rabbit’s foot on the left means ‘guarded optimism’.",
      "Retrograde rules: slow, mindful, gentle plays.",
      "I heard a bell—good omen.",
      "This table hums at a lucky frequency.",
    ],
    extraReactions: {
      bigWin: [
        "Yes! The quartz warmed before the deal.",
        "See? The universe rewards presence.",
        "Blackjack arrived right on the vibration.",
      ],
      smallWin: [
        "A soft win is gratitude’s cousin.",
        "Aligned, not overreaching—perfect.",
        "The aura brightened just then.",
      ],
      push: [
        "Stillness is guidance, not punishment.",
        "Neutral is preparation for blessing.",
        "Equilibrium—respect the balance.",
      ],
      smallLoss: [
        "Lesson energy. I accept and release.",
        "I forgot to turn the tiger’s eye outward.",
        "The cards mirrored a blocked chakra.",
      ],
      bigLoss: [
        "The cosmos nudges me to pause.",
        "I’ll cleanse the deck with breath next.",
        "Retrograde flexed—message received.",
      ],
    },
    preGame: [
      "I’ll sit when the breeze pauses—now.",
      "Buy-in blessed with intention.",
      "Dealer, your focus is very calming.",
      "This seat is lucky; I can feel the hum.",
      "Let’s play with gentle hearts.",
    ],
    midGame: [
      "Hit—my intuition whispered.",
      "Stand. The universe said ‘enough’.",
      "Double—sun card energy!",
      "Split—twin flame moment.",
      "Breathing with the decision… stand.",
      "My pendulum swings ‘yes’ to hit.",
    ],
    afterDealerFlip: [
      "Ten storms come in threes—count one.",
      "I felt that reveal in my solar plexus.",
      "If the next card smiles, we’re fine.",
      "Let’s transmute this tension.",
      "A cleansing exhale for the table.",
    ],
    banterWithPlayer: [
      { text: "Your calm helps the table flow.", isPatreon: false },
      { text: "May I place this crystal near you?", isPatreon: false },
      { text: "If you join mid-shoe, bless it first?", isPatreon: false },
      { text: "I celebrate your win—it raises all boats.", isPatreon: false },
      { text: "Your laugh just broke the bad pattern.", isPatreon: false },
      { text: "Want a mini sage spray? It's gentle.", isPatreon: false },
      { text: "Your supporter aura glows—the universe notices generosity.", isPatreon: true },
      { text: "That badge carries good energy into the table.", isPatreon: true },
    ],
    banterWithDealer: [
      "Your shuffle is rhythmic—grounding.",
      "If you don’t mind, I’ll set this amethyst here.",
      "Thank you for steady energy tonight.",
      "We’re co-creating a kind game.",
      "Please pause half-breath before dealing—thank you.",
      "If I win, I’ll donate to a rescue sanctuary.",
    ],
    quirkyActions: [
      "*rolls a small crystal between fingers*",
      "*whispers a gratitude mantra before betting*",
      "*aligns chips in a mandala pattern*",
      "*spritzes an unobtrusive ‘aura cleanse’ mist*",
      "*touches heart and smiles before a hit*",
      "*turns rabbit’s foot to face the shoe*",
    ],
  },

  // -------------------------------------------------
  // COCKY KYLE (BIG K)
  // -------------------------------------------------
  {
    id: "cocky-kyle",
    extraDistractions: [
      "This table’s my portfolio—watch me diversify.",
      "I only lose when I’m bored.",
      "You see this chain? It appreciates on compliments.",
      "I’ve got more liquidity than this bar.",
      "Volatility is my love language.",
      "I tip bigger than your rent—prove me wrong.",
      "Wealth is a mindset. Mine’s loud.",
      "I don’t chase luck. Luck chases me.",
    ],
    extraReactions: {
      bigWin: [
        "Blackjack—clip it for the highlight reel.",
        "Another 21—algorithm approved.",
        "House edge? I’m the penthouse edge.",
      ],
      smallWin: [
        "Light work. Pocket lint money.",
        "Add it to the stack—yawn.",
        "That’s my coffee money—per sip.",
      ],
      push: [
        "Push? Fine. Intermission.",
        "Break-even? I call it foreplay.",
        "Wake me when it’s exciting again.",
      ],
      smallLoss: [
        "Write it off as swagger tax.",
        "Whatever—rounding error.",
        "You should see my green days.",
      ],
      bigLoss: [
        "Busted? Cool—double the next one.",
        "Dealer scripted that—NPC energy.",
        "Variance just asked for an autograph.",
      ],
    },
    preGame: [
      "Seat reserved for winners—me.",
      "Buy-in: make it look cinematic.",
      "Dealer, you ever deal to legends? Start now.",
      "Let’s make this table go viral.",
      "I brought sunglasses for the glow-up.",
    ],
    midGame: [
      "Hit me like a trending ticker.",
      "Stand. The brand demands poise.",
      "Double—because headlines.",
      "Split. I believe in multiverse plays.",
      "Math says no; clout says yes. Clout wins.",
      "Run it—I don’t scare easy.",
    ],
    afterDealerFlip: [
      "Ten farm again? Cute.",
      "New plan: intimidate fate.",
      "I can smell the twenty coming.",
      "Dealer, surprise me—pleasantly.",
      "If you pull a six, I’ll clap ironically.",
    ],
    banterWithPlayer: [
      { text: "You learning? Watch closely.", isPatreon: false },
      { text: "I'll sponsor your win with my aura.", isPatreon: false },
      { text: "We can be friends if you root for me.", isPatreon: false },
      { text: "Counting? Boring. I brand the moments.", isPatreon: false },
      { text: "You bring strategy, I bring spectacle.", isPatreon: false },
      { text: "Smile—this is content.", isPatreon: false },
      { text: "Platinum tier? That's influencer energy.", isPatreon: true },
      { text: "Those exclusive features are fire—limited access is the flex.", isPatreon: true },
      { text: "3000 monthly chips? That's sustainable bankroll management.", isPatreon: true },
    ],
    banterWithDealer: [
      "Deal me a story worth retelling.",
      "I’ll tip you in legends and chips.",
      "We’re both professionals—me at winning.",
      "Shuffle like a headline drop.",
      "After this win, I’m doing a giveaway.",
      "Blink if you’re impressed. Thought so.",
    ],
    quirkyActions: [
      "*adjusts sunglasses for dramatic hit*",
      "*fans chips like cash for the camera*",
      "*poses with the discard tray mid-hand*",
      "*air-signs an autograph on a chip*",
      "*checks reflection in phone camera*",
      "*taps watch like it’s timing the luck*",
    ],
  },

  // -------------------------------------------------
  // NERVOUS NANCY
  // -------------------------------------------------
  {
    id: "nervous-nancy",
    extraDistractions: [
      "Is that camera moving or am I imagining it?",
      "Is it okay to ask questions? I’ll be quick.",
      "If I win too much, do lights flash? (Kidding!)",
      "I read a book—just one—maybe that’s worse.",
      "If security walks by, tell me to breathe.",
      "The math says one thing, my sweat says another.",
      "I’m not counting. I’m… counting on luck.",
      "Is whispering to myself frowned upon?",
    ],
    extraReactions: {
      bigWin: [
        "Blackjack?! I swear I’m not suspicious!",
        "Twenty-one! Is that… okay? I’m allowed to smile?",
        "Please don’t kick me out for being happy!",
      ],
      smallWin: [
        "A win? Great—normal—completely normal.",
        "Okay, okay, just act casual. Casual!",
        "Nice! Nobody noticed. Probably.",
      ],
      push: [
        "Push is safe. Safe is good.",
        "Tie means I blend in, right?",
        "Neutral outcomes calm my heart rate.",
      ],
      smallLoss: [
        "Loss? Fine! See—I’m not scary.",
        "Good. Balance. Balance is fine.",
        "I’ll log that as… camouflage.",
      ],
      bigLoss: [
        "Busted! Do I apologize to the cards?",
        "Dealer blackjack? I expected that. I’m fine.",
        "This is okay. I’m okay. We’re okay.",
      ],
    },
    preGame: [
      "Hi. I’ll sit quietly. Very quietly.",
      "Small buy-in—ease into it—breathe.",
      "Dealer, thank you for your patience… in advance.",
      "I prefer end seats—less eyes. Is that weird?",
      "I’ll keep my voice at ‘library’ level.",
    ],
    midGame: [
      "Hit. I think. Yes. Hit.",
      "Stand. Because chaos scares me.",
      "Double? That’s bold—oh gosh—okay.",
      "Split—statistics said so on page 48.",
      "I’ll follow the chart, not my panic.",
      "Can I have a second? Tiny second? Thanks.",
    ],
    afterDealerFlip: [
      "Incoming ten? Bracing…",
      "I’m not looking. Tell me when it’s safe.",
      "Okay. Whatever happens, I’m fine.",
      "Oh no. Oh yes? Oh… tie?",
      "If we lose, I vanish into the chair.",
    ],
    banterWithPlayer: [
      { text: "If I seem weird, I promise I'm nice.", isPatreon: false },
      { text: "You look confident—can I borrow some?", isPatreon: false },
      { text: "If I win big, will you stand in front of me?", isPatreon: false },
      { text: "I'll celebrate you loudly… in a whisper.", isPatreon: false },
      { text: "If you need space, I'll shrink. Like this.", isPatreon: false },
      { text: "Thanks for being patient with me.", isPatreon: false },
      { text: "Those founding member badges… they're watching me more…", isPatreon: true },
      { text: "Unlimited chips would stress me out—what if I lose track?", isPatreon: true },
    ],
    banterWithDealer: [
      "Sorry for asking things twice. Or thrice.",
      "You’re very calm. That helps a lot.",
      "If I freeze, just gently prompt me.",
      "I appreciate your professionalism so much.",
      "I’ll try to be fast. I will. I promise.",
      "If I panic, I’ll just stand. Safe bet.",
    ],
    quirkyActions: [
      "*counts breaths on fingers under the table*",
      "*lines chips in perfect parallel rows*",
      "*checks exits with quick glances*",
      "*dry swallows, then smiles apologetically*",
      "*whispers the basic strategy like a mantra*",
      "*rolls shoulders to release tension*",
    ],
  },

  // -------------------------------------------------
  // LUCKY LARRY
  // -------------------------------------------------
  {
    id: "lucky-larry",
    extraDistractions: [
      "My knee tingled—win’s coming.",
      "Tuesdays never miss. Never.",
      "If I sneeze, it’s blackjack. Watch.",
      "I don’t chase luck; it hitchhikes with me.",
      "I’ve named this chip ‘Fortune’. It’s a closer.",
      "I trust my gut. It’s got a PhD.",
      "Seven blackjacks is my average. Daily.",
      "I can feel the dealer smiling inside.",
    ],
    extraReactions: {
      bigWin: [
        "Called it! Knee never lies.",
        "Blackjack magnet—still works!",
        "I’m starting to feel bad. For the house.",
      ],
      smallWin: [
        "Predicted. I winked and it listened.",
        "Another one. Gut’s on fire.",
        "The streak writes its own story.",
      ],
      push: [
        "Push? The streak took a breath.",
        "Luck blinked. It’ll wink next.",
        "Neutral keeps the heater warm.",
      ],
      smallLoss: [
        "Tiny dip before a leap.",
        "Luck’s just stretching.",
        "Even the sun sets. Briefly.",
      ],
      bigLoss: [
        "Busted? Reset the streak counter—still high.",
        "Odds needed a snack. We’re back soon.",
        "Luck’s on a coffee break.",
      ],
    },
    preGame: [
      "Seat hums lucky. I’m home.",
      "Buy-in with a grin—works every time.",
      "Dealer, you’re my lucky charm. No pressure.",
      "Shuffle sings to me. Hear it?",
      "Let’s do something legendary.",
    ],
    midGame: [
      "Hit—because I got the vibe.",
      "Stand—my elbow twitched ‘no’.",
      "Double—tingle times two.",
      "Split—twice the destiny.",
      "Hit me—fortune says please.",
      "Stand—a gentleman’s agreement.",
    ],
    afterDealerFlip: [
      "Seen this—ends well for me.",
      "If that’s a ten, mine’s a miracle.",
      "Luck and I are negotiating.",
      "Dealer’s cooking a soft bust.",
      "Watch the river bend my way.",
    ],
    banterWithPlayer: [
      { text: "Stick close; it rubs off.", isPatreon: false },
      { text: "Call a hand—I'll vibe check it.", isPatreon: false },
      { text: "You ever surfed a heater? Grab a board.", isPatreon: false },
      { text: "If I cool off, I buy coffees.", isPatreon: false },
      { text: "Your smile added three percent to odds.", isPatreon: false },
      { text: "We're all lucky tonight—promise.", isPatreon: false },
      { text: "Those monthly chip stipends? Luck loves recurring gifts.", isPatreon: true },
      { text: "Support the house and the house supports you—karma!", isPatreon: true },
    ],
    banterWithDealer: [
      "You deal like fate’s favorite cousin.",
      "We’re in sync; feel it?",
      "I’ll tip in gratitude and chips.",
      "Make this shoe famous.",
      "If I call it right, you nod subtly.",
      "That was a ‘lucky shuffle’ if I’ve seen one.",
    ],
    quirkyActions: [
      "*taps the felt twice for luck*",
      "*names each chip before betting*",
      "*squints at shoe like it’s a horizon*",
      "*does a tiny victory shimmy*",
      "*checks watch then declares ‘lucky minute’*",
      "*snaps fingers once before a hit*",
    ],
  },

  // -------------------------------------------------
  // UNLUCKY URSULA
  // -------------------------------------------------
  {
    id: "unlucky-ursula",
    extraDistractions: [
      "If bad luck paid dividends, I’d retire.",
      "16 again? Classic me.",
      "Ten parade’s in town—guess who’s front row.",
      "If the dealer sneezes, I bust. Watch.",
      "I collect almosts. Got a shelf of them.",
      "Probability hates my smile but I smile anyway.",
      "I’m the control group for misfortune.",
      "I’m here for morale—yours, not mine.",
    ],
    extraReactions: {
      bigWin: [
        "Blackjack? Someone screenshot reality!",
        "I think I stole someone else’s luck—sorry, Susan.",
        "Pinch me before the universe notices.",
      ],
      smallWin: [
        "A win? Oh, how novel!",
        "Plot twist: Ursula doesn’t lose once.",
        "I’ll frame this chip.",
      ],
      push: [
        "Tie is basically champagne for me.",
        "Push? I’ll take neutral over my usual.",
        "Even the universe blinked.",
      ],
      smallLoss: [
        "Back to the Ursula average.",
        "I knew serenity was temporary.",
        "That loss had my name engraved.",
      ],
      bigLoss: [
        "Busted—nature is healing.",
        "Dealer blackjack? That checks out.",
        "It’s comforting how consistent I am.",
      ],
    },
    preGame: [
      "Warm up the seat with disappointment—my specialty.",
      "Buy-in: optimism included, batteries not.",
      "Dealer, I’m your test case for worst-case.",
      "Smile now; you’ll need it.",
      "Let’s do our dance, fate.",
    ],
    midGame: [
      "Hit—what could go wrong? (Everything.)",
      "Stand—so the ten can taunt me silently.",
      "Double—this is where the comedy spikes.",
      "Split—twice the heartbreak, twice the fun.",
      "Math says hit; history says cry.",
      "Let’s roll the dice on a card game.",
    ],
    afterDealerFlip: [
      "Here comes the inevitable.",
      "Ah yes, the ten river strikes again.",
      "I pre-grieved this outcome.",
      "If that’s a six, I’ll faint. It won’t be.",
      "Destiny, you prankster.",
    ],
    banterWithPlayer: [
      { text: "Sit by me; I absorb the bad beats.", isPatreon: false },
      { text: "If I sigh, it's melodic—enjoy.", isPatreon: false },
      { text: "Your luck looks radiant. Leech away.", isPatreon: false },
      { text: "I'm here to make your stats look good.", isPatreon: false },
      { text: "If I win, we'll name it a miracle.", isPatreon: false },
      { text: "Advice? Expect the opposite of me.", isPatreon: false },
      { text: "Chip bonuses wouldn't save me—but they'd slow the doom.", isPatreon: true },
      { text: "Even with Gold tier perks, I'd still find a way to lose.", isPatreon: true },
    ],
    banterWithDealer: [
      "Deal me hope with a side of reality.",
      "You do your job; fate does the trolling.",
      "If you see a miracle, ring a bell.",
      "I tip with humor and perseverance.",
      "Go easy on me—my therapist asked nicely.",
      "Shuffle out the gremlins if you can.",
    ],
    quirkyActions: [
      "*writes ‘16 again’ in the air*",
      "*places a chip, salutes it goodbye*",
      "*prepares a tiny slow clap for losses*",
      "*crosses fingers, then winks at doom*",
      "*counts to three before peeking*",
      "*offers a pity high-five to herself*",
    ],
  },

  // -------------------------------------------------
  // SUSAN CHEN (Lucky Susan in your base) ALREADY ADDED ABOVE AS superstitious-susan
  // CARLOS RODRIGUEZ (Chatty Carlos) ALREADY ADDED
  // KYLE MORRISON (Big K) ALREADY ADDED
  // NANCY PARK (Nervous Nancy) ALREADY ADDED
  // DANNY, CLAIRE, LARRY, URSULA ADDED
  // -------------------------------------------------
];

// ==============================
// Conversations: Players ↔ Dealers
// ==============================

export interface DealerPlayerConversationTemplate {
  /** "generic" or a character id (e.g., "drunk-danny") */
  id: string;
  openers: string[]; // How the convo starts at a fresh shoe or seat
  dealerQuestions: string[]; // Dealer lines that prompt a reply
  playerQuestions: string[]; // Things the player (character) asks dealer
  smallTalk: string[]; // Neutral chit-chat
  heatMoments: string[]; // Subtle suspicion / tense beats
  exits: string[]; // How they wrap or pause the convo
}

/** Generic plus per-character overrides to flavor the experience */
export const DEALER_PLAYER_CONVERSATIONS: Record<
  string,
  DealerPlayerConversationTemplate
> = {
  generic: {
    id: "generic",
    openers: [
      "Welcome in—buy-in ready when you are.",
      "Fresh shoe—good luck everyone.",
      "Evening folks, let’s keep it friendly and fun.",
    ],
    dealerQuestions: [
      "Insurance anyone?",
      "Checks play?",
      "Color coming in or same color out?",
      "Would you like to cut the deck?",
      "Any side bets this hand?",
      "Are you comfortable with table limits?",
    ],
    playerQuestions: [
      "Can I get change for these bills?",
      "How many decks are we running?",
      "Do you hit soft 17 here?",
      "What are the surrender rules at this table?",
      "Is this a cut-card or hand shuffle tonight?",
      "Can you explain the side bet quickly?",
    ],
    smallTalk: [
      "Quiet night or is this the calm before the rush?",
      "You always deal this smooth?",
      "Nice music in here—does it loop every hour?",
      "How long you been dealing?",
      "Anyone hit a hot streak earlier?",
      "I like the vibe at this pit.",
    ],
    heatMoments: [
      "Let’s keep the table moving, folks.",
      "I’ll need to spread that bet in one spot, please.",
      "Try to keep hands visible on the felt.",
      "Eye in the sky says hello.",
      "No phones on the layout, thanks.",
      "Let’s not coach other players, please.",
    ],
    exits: [
      "Good luck on your next table.",
      "Color up? I’ll get you greens for those reds.",
      "Be right back after the break; new dealer coming in.",
      "Thanks for playing; appreciate the good energy.",
      "Shoes changing—grab a drink if you like.",
      "My relief’s here—play nice for them.",
    ],
  },

  "drunk-danny": {
    id: "drunk-danny",
    openers: [
      "Bartender knows my name; the cards should too.",
      "Fresh shoe? Fresh drink.",
      "Keep it straight, Danny—cards first, stories second.",
    ],
    dealerQuestions: [
      "Danny, want checks play or you good?",
      "Another drink, or water for a bit?",
      "Cut the deck, sir?",
      "Are you locking that bet in, Danny?",
      "Insurance? Might pair with your whiskey.",
      "Color coming in?",
    ],
    playerQuestions: [
      "Do you take tips in dad jokes?",
      "Which side of the shoe smiles at me?",
      "Is the felt supposed to sway or is that me?",
      "Do I need to declare ‘lucky elbow’?",
      "What time do blackjacks usually arrive?",
      "Can I split… my attention? Kidding. Mostly.",
    ],
    smallTalk: [
      "You deal smoother than my bartender pours.",
      "I’ve seen you turn disasters into wins—do that again?",
      "My grandkids say I should ‘chill’. This is chilling.",
      "What’s the bar’s best snack for luck?",
      "I beat the house once. Might’ve been Monopoly.",
      "This chair hugs me. That’s a tell.",
    ],
    heatMoments: [
      "Hands on the felt, Danny, not the drink.",
      "Let’s keep the chips in one spot, please.",
      "One player to a hand, thanks.",
      "Let’s slow the jokes for a second—hit or stand?",
      "No touching the discard, please.",
      "Eyes up here, sir—decision time.",
    ],
    exits: [
      "I’ll color up when the room stops whispering.",
      "If I wander off, tell me I was legendary.",
      "I’m off to tip the bartender and my future.",
      "New dealer? I’ll toast to that.",
      "I’ll cash out before I start telling pirate stories.",
      "Bathroom break—don’t let my chair get sober.",
    ],
  },

  "clumsy-claire": {
    id: "clumsy-claire",
    openers: [
      "Hi! I brought napkins—just in case.",
      "I’ll try not to knock anything tonight.",
      "Light buy-in—lighter hands.",
    ],
    dealerQuestions: [
      "Cut the deck, Claire?",
      "Want me to square your chips up?",
      "Insurance?",
      "Would you like change for that?",
      "Are you comfortable placing chips closer in?",
      "Need a second to decide?",
    ],
    playerQuestions: [
      "Is it okay if I move this drink back a bit?",
      "Do you mind if I stack in tiny piles?",
      "What’s the polite word for ‘oops’ in casinos?",
      "Could I get a felt wipe if I spill? I hope not!",
      "Do you re-cut if I drop the card? Hypothetically.",
      "Is there a ‘clumsy lane’ at the table edge?",
    ],
    smallTalk: [
      "You shuffle like a ballet—it’s lovely.",
      "I come once a month with friends—book club night.",
      "Do dealers prefer neat stacks? I’m practicing.",
      "What’s your favorite lucky story?",
      "Your patience is a superpower.",
      "This table feels friendly. I like that.",
    ],
    heatMoments: [
      "Let’s keep beverages off the rail, please.",
      "No touching the cards after your decision, thanks.",
      "We’ll need chips in one tidy stack.",
      "Careful with hands near the layout.",
      "Phone away on the layout, please.",
      "Let’s keep the game moving—hit or stand?",
    ],
    exits: [
      "I’ll color up before gravity finds me again.",
      "Break time—I owe the bar some napkin duty.",
      "New dealer? I’ll reorganize while you swap.",
      "Thanks for being kind—I’m learning!",
      "I’ll be back. With fewer oopses.",
      "Gonna check on my friends—be right back.",
    ],
  },

  "chatty-carlos": {
    id: "chatty-carlos",
    openers: [
      "Great to see a pro behind the shoe.",
      "Let’s make some Q4 magic right here.",
      "Buying in—call it marketing spend.",
    ],
    dealerQuestions: [
      "Carlos, want to cut?",
      "Any side bets today?",
      "Checks play?",
      "Holding that bet size this shoe?",
      "Stacks okay like that?",
      "Insurance—yes or no?",
    ],
    playerQuestions: [
      "How many decks? It affects… my storytelling.",
      "Are we hitting soft 17 here?",
      "What time does the pit heat up?",
      "Do you track table win rates? I love stats.",
      "Is there a ‘dealer of the month’ board?",
      "What’s your favorite twist ending hand?",
    ],
    smallTalk: [
      "I tell my team: trust the process—like shuffles.",
      "You’ve got showmanship—that matters.",
      "Good tables are communities; this one’s growing.",
      "I’ll celebrate any player who hits a heater.",
      "I love a fair game—it’s good business.",
      "We’re all here to leave with a story.",
    ],
    heatMoments: [
      "Let’s keep side commentary minimal, please.",
      "Phones off the rail, thanks.",
      "One player to a hand.",
      "Please don’t coach decisions.",
      "Keep bets in the circle, sir.",
      "Decision please—hit, stand, double, or split?",
    ],
    exits: [
      "Color up—closing the daily ledger.",
      "New dealer—new KPI.",
      "Break time; I’ll network the bar.",
      "I’ll be back with a testimonial.",
      "Great dealing—genuinely.",
      "Story secured. See you next shoe.",
    ],
  },

  "superstitious-susan": {
    id: "superstitious-susan",
    openers: [
      "May I bless my chips before we start?",
      "I’ll wait for the air to settle… now.",
      "This corner feels harmonious—thank you.",
    ],
    dealerQuestions: [
      "Would you like to cut the deck, Susan?",
      "Any problem if we keep the crystals off the layout?",
      "Insurance?",
      "Are you okay with a steady pace?",
      "Would you prefer end seat energy?",
      "Need a moment for your ritual?",
    ],
    playerQuestions: [
      "Do you mind if my rabbit’s foot faces the shoe?",
      "How do you feel about sage—just a mist?",
      "Is today a soft-17 house?",
      "Could we pause one breath before dealing?",
      "Do you mind if I align chips symmetrically?",
      "Any superstition you’ve seen that actually works?",
    ],
    smallTalk: [
      "Your shuffle rhythm is grounding.",
      "I donate a win portion to animal rescues.",
      "People laugh, but rituals calm the mind.",
      "The shoe’s energy changed after that cut.",
      "I once saw a table sing to reverse a slump.",
      "Thank you for holding a kind space.",
    ],
    heatMoments: [
      "Crystals can stay on the rail, not the felt—thanks.",
      "Let’s keep the game moving, Susan.",
      "No blowing on the cards, please.",
      "Hands flat on the felt, thank you.",
      "We can’t pause every deal—sorry.",
      "Decision time: hit or stand?",
    ],
    exits: [
      "I’ll cleanse and return with new energy.",
      "Time to ground—be right back.",
      "New dealer—new aura, lovely.",
      "I’ll color up with gratitude.",
      "Blessings to this table till I return.",
      "When the wind shifts, I’ll be back.",
    ],
  },

  "cocky-kyle": {
    id: "cocky-kyle",
    openers: [
      "Make this cinematic, dealer.",
      "I’m here for the headline hand.",
      "Buy-in: let’s make it photogenic.",
    ],
    dealerQuestions: [
      "Kyle, cut or keep the pace?",
      "Lock that bet, please.",
      "Insurance?",
      "Please keep the chips inside the circle.",
      "Phones off the felt, thanks.",
      "Checks play?",
    ],
    playerQuestions: [
      "What’s the record win at this table?",
      "You ever deal five blackjacks in a row?",
      "Policy on sunglasses at night? For…the brand.",
      "Are side bets worth the spectacle?",
      "How many decks? I’m optimizing my clip.",
      "Do you call hot streaks ‘content moments’?",
    ],
    smallTalk: [
      "You’ve got dealer swagger—I respect it.",
      "If I hit a heater, I’ll tip like a hurricane.",
      "This pit feels premium.",
      "We should name this shoe ‘Viral’.",
      "I collect wins and reactions.",
      "You run the cleanest game I’ve seen.",
    ],
    heatMoments: [
      "Eyes on the layout, please.",
      "Cool the commentary a bit, sir.",
      "One hand per player.",
      "Let’s not touch the discard tray.",
      "Decision now, please.",
      "Keep it respectful—thank you.",
    ],
    exits: [
      "Color up; I’ve got a meet-and-greet with destiny.",
      "New dealer? New content arc.",
      "Break. I’ll autograph a chip out there.",
      "I’ll be back when the soundtrack swells.",
      "You were solid—respect.",
      "Off to spread the legend.",
    ],
  },

  "nervous-nancy": {
    id: "nervous-nancy",
    openers: [
      "Hi—small buy-in—quiet seat, please.",
      "End spot if possible—thank you.",
      "I’m friendly, just… jumpy.",
    ],
    dealerQuestions: [
      "Nancy, you okay with this pace?",
      "Insurance?",
      "Want me to remind you of options?",
      "Would you like to cut, or should I?",
      "Need change for that?",
      "All good to continue?",
    ],
    playerQuestions: [
      "Do you hit soft 17? I like to know.",
      "Is surrender allowed here?",
      "How strict are phone rules? I’ll put it away!",
      "What’s the table etiquette for questions?",
      "Is it okay if I take one deep breath first?",
      "How long is a shoe usually?",
    ],
    smallTalk: [
      "You’re very calm—that helps me.",
      "I read one book; it made me more nervous.",
      "I’m here to have fun. Quietly.",
      "I like when people cheer… softly.",
      "Thanks for explaining with patience.",
      "Nice table energy tonight.",
    ],
    heatMoments: [
      "Hands flat on the felt, please.",
      "Let’s keep the decisions moving.",
      "No signaling other players, thanks.",
      "Phones off the rail.",
      "Take your time, but we do need a decision.",
      "Stay seated during the deal, please.",
    ],
    exits: [
      "I’ll color up and exhale outside.",
      "Break—my heart needs tea.",
      "New dealer—okay, new start.",
      "Thank you for being kind to me.",
      "I’ll be back when my hands stop shaking.",
      "Appreciate the table—truly.",
    ],
  },

  "lucky-larry": {
    id: "lucky-larry",
    openers: [
      "Dealer! The streak followed me in.",
      "Make a note—today’s a heater.",
      "Buy-in blessed by the gods of coincidence.",
    ],
    dealerQuestions: [
      "Cut the deck, Larry?",
      "Insurance on the streak?",
      "Keep that bet size or ramp it?",
      "Same color or color up?",
      "Want a seat change for luck?",
      "Ready for the next shoe?",
    ],
    playerQuestions: [
      "Are you the lucky dealer they told me about?",
      "Got a favorite place to cut?",
      "Ever see eight blackjacks in one session?",
      "What do you call it when luck hums?",
      "House rules kind to winners?",
      "Can I name this shoe ‘Larry’s Lane’?",
    ],
    smallTalk: [
      "Your deal has a rhythm—luck loves rhythm.",
      "I tip in streak energy and chips.",
      "I promise to share the glow.",
      "This shoe has good bones.",
      "Let the heater feed the whole table.",
      "I’m allergic to cold streaks—achoo!",
    ],
    heatMoments: [
      "Keep the celebration modest, please.",
      "Hands on the felt during the deal.",
      "No tapping the shoe, thanks.",
      "Let’s not coach outcomes.",
      "We’ll keep it fair and fun.",
      "Decision, please.",
    ],
    exits: [
      "Color up while the aura’s high.",
      "Break—luck’s grabbing a coffee.",
      "New dealer—new chapter.",
      "I’ll be back before the streak cools.",
      "Thanks for riding the wave, dealer.",
      "Cashing and dashing—politely.",
    ],
  },

  "unlucky-ursula": {
    id: "unlucky-ursula",
    openers: [
      "Hello doom, my old friend—deal me in.",
      "I’m here to lower the average.",
      "Buy-in with optimism I can’t afford.",
    ],
    dealerQuestions: [
      "Cut the deck, Ursula?",
      "Insurance? Might be your day.",
      "Want to keep the same bet size?",
      "Checks play?",
      "Any seat you prefer?",
      "Would you like to color up after this shoe?",
    ],
    playerQuestions: [
      "Got a mercy rule for chronic 16s?",
      "What’s the statistically least cursed chair?",
      "Do you name ten runs or just endure them?",
      "Are side bets luckier for the unlucky?",
      "Can I borrow the house’s optimism?",
      "If I win once, do we ring a bell?",
    ],
    smallTalk: [
      "If I push, I celebrate.",
      "You deal fair—my luck is the villain.",
      "I keep coming back; I’m charming like that.",
      "This table deserves better outcomes—watch me try.",
      "I tip with gallows humor.",
      "If I win, I’ll frame the chip.",
    ],
    heatMoments: [
      "Let’s keep comments light, please.",
      "Try not to touch your cards after the decision.",
      "No table slaps, thanks.",
      "Phones off the layout.",
      "Decision time—let’s keep it moving.",
      "We’re all good—just a reminder on etiquette.",
    ],
    exits: [
      "I’ll color up before fate gets bored.",
      "Break time—recalibrating expectations.",
      "New dealer—maybe new destiny.",
      "Thanks for the fair dealing.",
      "I’ll be back; doom loves a sequel.",
      "Cash me out before the ten parade returns.",
    ],
  },
};

// ==============================
// Optional: Convenience APIs
// ==============================

/** Pull a random dealer-player line by category for a given character (falls back to generic). */
export function getDealerPlayerLine(
  characterId: string | "generic",
  category: keyof DealerPlayerConversationTemplate,
): string {
  const tpl =
    DEALER_PLAYER_CONVERSATIONS[characterId] ??
    DEALER_PLAYER_CONVERSATIONS.generic;
  const arr = (tpl[category] ?? []) as string[];
  return arr.length ? pick(arr) : "";
}

/** Example: get a random new-category line for UI prompts */
export function getCharacterNewCategoryLine(
  characterId: string,
  addons: CharacterDialogueAddons[],
  category: keyof Omit<
    CharacterDialogueAddons,
    "id" | "extraDistractions" | "extraReactions"
  >,
): string {
  const arr = getDialogueCategory(characterId, addons, category);
  return arr.length ? pick(arr) : "";
}
