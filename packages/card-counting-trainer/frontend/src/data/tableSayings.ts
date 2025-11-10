import { AICharacter } from "./aiCharacters";

/**
 * Consolidated table sayings and character dialogue
 * All character-specific comments, reactions, and distractions in one place
 *
 * Each character has a consistent structure with all their dialogue organized by type
 */

export interface TableSaying {
  characterId: AICharacter["id"];
  text: string;
}

/**
 * Character dialogue organized by character ID
 * Each character has the same structure for consistency
 */
export interface CharacterDialogue {
  characterId: string;
  distractions: string[];
  playerEngagements: string[];
  hardHandSayings: Record<number, string[]>; // 12-21
  softHandSayings: Record<string, string[]>; // "A,2" through "A,10"
  dealerUpCardSayings: Record<string, string[]>; // "2" through "A"

  // Extended dialogue categories (from ai-dialogue-addons)
  preGame?: string[]; // when sitting / buying in
  midGame?: string[]; // while deciding (hit/stand/double/split)
  afterDealerFlip?: string[]; // after dealer reveals hole card / draws out
  banterWithPlayer?: { text: string; isPatreon: boolean }[]; // directed at other players
  banterWithDealer?: string[]; // directed at dealer only
  quirkyActions?: string[]; // short stage directions for UI flavor
}

/**
 * Utility to safely pick a random item
 */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * All character dialogue consolidated by character
 */
export const CHARACTER_DIALOGUE: Record<string, CharacterDialogue> = {
  "drunk-danny": {
    characterId: "drunk-danny",
    distractions: [
      "Hey barkeep! Another round!",
      "Did I tell you about my ex-wife? She took EVERYTHING...",
      "What was I betting again?",
      "You're a counter aren't ya! I can always tell!",
      "*knocks over chip stack* Oops! My bad buddy!",
      "The room's spinning... is it hot in here?",
      "I once won $10,000 on this very table! Or was it $1,000?",
      // Extended distractions from addons
      "Whaddaya mean table minimum? I got minimums… somewhere…",
      "I swear these chips multiply when I blink.",
      "If I double, does that mean double drinks too?",
      "My buddy Joey hit 17 once and married the dealer. True story.",
      "Hold on—this coaster's my lucky one. No, the other one.",
      "If the room stops spinning, deal me in. Wait—already in?",
      "Barkeep! Hydration is key. Another whiskey!",
      "You ever notice how cards smell like fortune and bad ideas?",
    ],
    playerEngagements: [
      "Hey buddy, you look familiar! Do I know you from somewhere?",
      "What are you drinking? Let me buy you a round!",
      "You're being awfully quiet over there. Cat got your tongue?",
      "You some kind of pro? You got that serious look about you.",
      "Wanna hear about the time I won $10,000? Or was it $1,000...",
    ],
    preGame: [
      "Seat warm? I play better on warm chairs.",
      "I brought exact buy-in: 'some' dollars.",
      "Where's the wind coming from? I like a tailwind.",
      "Deal me something I can toast to.",
      "Anyone seen my lucky coin? Found it—behind my ear!",
    ],
    midGame: [
      "Hit me—softly. Like a lullaby.",
      "Stand! Like me at my grandson's recital.",
      "Double? Double. Double sounds like breakfast.",
      "Split? My vision's already split, so sure.",
      "What do you think, conscience? …He says YOLO.",
      "I'll follow my gut; it's been fed well.",
    ],
    afterDealerFlip: [
      "Oh no, not the ten parade again!",
      "I knew it—my hiccup predicted this.",
      "Plot twist! And I forgot my popcorn.",
      "Dealer, be gentle. I bruise emotionally.",
      "If you pull a 21, I'll pull another whiskey.",
    ],
    banterWithPlayer: [
      { text: "You counting? I'm discounting.", isPatreon: false },
      {
        text: "Buddy, if I win, we win. That's friendship math.",
        isPatreon: false,
      },
      {
        text: "Swap seats? Mine's haunted by bad decisions.",
        isPatreon: false,
      },
      {
        text: "Advice? Never trust even numbers. Or odd ones.",
        isPatreon: false,
      },
      { text: "You got a system? I got a symptom.", isPatreon: false },
      {
        text: "Hold my drink—no don't, I'll lose track of both.",
        isPatreon: false,
      },
      {
        text: "Someone here's got unlimited chips? Must be nice!",
        isPatreon: true,
      },
      {
        text: "I heard about those founding member badges—shiny!",
        isPatreon: true,
      },
    ],
    banterWithDealer: [
      "I tip in jokes and occasional chips.",
      "Blink twice if you're rooting for me.",
      "I'll stand if you promise not to.",
      "Your shuffle reminds me of the sea. I'm seasick.",
      "Deal me mercy. Just a little.",
      "I'll name my next drink after you if this works.",
    ],
    quirkyActions: [
      "*counts chips out loud, loses count at 7*",
      "*toasts the shoe with his glass*",
      "*puts sunglasses on upside down*",
      "*leans in, whispers to cards* Be cool.",
      "*arranges chips into a smiley face*",
      "*holds breath for 'lucky draw'*",
    ],
    hardHandSayings: {
      12: [
        "Twelve? That's the 'order another whiskey' number.",
        "Hit me soft… *hic*… not too hard, I bust easy on 12.",
        "Every time I get 12, I swear the dealer starts smilin'.",
      ],
      13: [
        "Lucky 13? Buddy, my luck left with my ex.",
        "Thirteen… feels like a trap with free peanuts.",
        "I'll hit it—what's the worst that could happen? Don't answer.",
      ],
      14: [
        "Fourteen… feels like last call: risky and loud.",
        "I either bust or brag. Both are fun.",
        "Hit the sad number. Let's dance.",
      ],
      15: [
        "Fifteen—the devil's bar tab.",
        "Whatever I do, it's wrong—so I'll make it loud.",
        "Hit it. Regret is tomorrow Danny's problem.",
      ],
      16: [
        "Sixteen—the officially worst hangover.",
        "Hit me, I fear nothing but Mondays.",
        "Stand? Hit? Bartender? Surprise me.",
      ],
      17: [
        "Seventeen—good enough to brag, bad enough to regret.",
        "I'll sit on 17 like a barstool. Wobbly.",
        "17? Cheers to mediocrity!",
      ],
      18: [
        "Eighteen—strong like my third whiskey.",
        "18's the 'don't touch anything' number.",
        "I'll toast to 18. Preferably twice.",
      ],
      19: [
        "Nineteen! I'm buying the next round.",
        "19's classy—like top-shelf regret tomorrow.",
        "Standing. Even I can't mess up 19.",
      ],
      20: [
        "Twenty! So close I can taste it—like bourbon.",
        "I swear if the dealer pulls 21, I'm singing.",
        "Standing. Don't get cute, Danny.",
      ],
      21: [
        "Twenty-one! I told you I'm a genius after three drinks!",
        "Blackjack, baby! Pour decisions pay off!",
        "Count it slow—I wanna savor this.",
      ],
    },
    softHandSayings: {
      "A,2": [
        "Soft 13? I can't even feel the floor—hit me.",
        "Soft 13's like karaoke—one more round sounds right.",
      ],
      "A,3": [
        "Soft 14—training wheels. Give me a push.",
        "Soft 14—another sip, another card.",
      ],
      "A,4": [
        "Soft 15? I'm feeling brave and slightly sideways. Hit.",
        "Soft 15's a 'why not' number. Why not? Hit.",
      ],
      "A,5": [
        "Soft 16—worst hard, best soft. I'll drink to that. Hit.",
        "Soft 16? Send it and sip.",
      ],
      "A,6": [
        "Soft 17—the great debate. I vote chaos: hit.",
        "Soft 17—more card, more courage.",
      ],
      "A,7": [
        "Soft 18—feels strong till the dealer flexes. I'll stand… or not.",
        "Soft 18—stand steady unless the dealer's mean.",
      ],
      "A,8": [
        "Soft 19? I stand tall—no hero shots needed.",
        "Soft 19—no touching, no trouble.",
      ],
      "A,9": [
        "Soft 20—chef's kiss. I'm not moving.",
        "Soft 20—hands off, heart on.",
      ],
      "A,10": [
        "Soft 21? That's just called 'I'm a genius.'",
        "Twenty-one! Bartender, narrate my victory.",
      ],
    },
    dealerUpCardSayings: {
      "2": [
        "Dealer 2? I'll drink to the bust gods.",
        "Two up? Dealer's on training wheels.",
      ],
      "3": [
        "Dealer 3—still flimsy. I'll swagger a bit.",
        "Dealer 3? Pour confidence.",
      ],
      "4": [
        "Dealer 4—don't touch anything. Let 'em fall.",
        "Dealer 4? I'll toast to gravity.",
      ],
      "5": [
        "Dealer 5—my favorite domino to tip.",
        "Five says 'don't get cute.' I won't—probably.",
      ],
      "6": [
        "Dealer 6? Nobody breathe—let the magic work.",
        "Six up? I'll just sip and win.",
      ],
      "7": [
        "Dealer 7—alright, now we gotta earn it.",
        "Seven? I can work with that.",
      ],
      "8": [
        "Dealer 8—coin flip with attitude.",
        "Eight? Pour me courage, not chaos.",
      ],
      "9": [
        "Dealer 9—now it's a real fight.",
        "Nine up? Time to earn my drink.",
      ],
      "10": [
        "Dealer 10—assume pain, hope for comedy.",
        "Ten up? I'll need a braver drink.",
      ],
      A: [
        "Dealer Ace—now I'm sober. Briefly.",
        "Ace up? Alright, deal me courage or mercy.",
      ],
    },
  },

  "clumsy-claire": {
    characterId: "clumsy-claire",
    distractions: [
      "*drops purse spilling contents everywhere* Oh no! I'm so sorry!",
      "*knocks drink over* I am SO sorry! Does anyone have napkins?",
      "Oops! Did I just hit the wrong button?",
      "*bumps into you* Oh my goodness, excuse me!",
      "Is this chip mine or yours? I can never keep track!",
      "*drops phone* Why do I always do this?",
      "Sorry, sorry! I'm such a klutz!",
      // Extended distractions from addons
      "*fumbles players card* Oh gosh—sorry! Do you need that?",
      "Is this my stack or your stack? I'm so sorry!",
      "Why do chips always jump out of my hands?",
      "If I sneeze, do I forfeit my turn?",
      "Who put roller skates on this floor? (It's me. I'm clumsy.)",
      "*spills a single chip* That's my oops tax.",
      "My book club said I should 'hit' more often—at the gym.",
      "If anyone needs napkins, I travel with a pack.",
    ],
    playerEngagements: [
      "Oh! Excuse me, did I bump you? I'm so sorry!",
      "Can you help me count these chips? I think I dropped some.",
      "Is this seat taken? Oh wait, you're already sitting. Sorry!",
      "Do you come here often? This is my first time at this table!",
    ],
    preGame: [
      "Hi! I'll just—oh—sorry—slid into this seat.",
      "Buy-in please! Small bills… fewer accidents.",
      "I brought a tiny towel. Just in case.",
      "Promise to tell me if I'm elbowing you.",
      "Let's have a gentle shoe tonight, please.",
    ],
    midGame: [
      "Hit—carefully—carefully—thank you!",
      "I'll stand before I drop something.",
      "Double? I can do two things at once… maybe.",
      "Splitting makes me nervous—but okay!",
      "Is 'sorry' a legal move? I use it a lot.",
      "I'll trust my first instinct, not my clumsy second.",
    ],
    afterDealerFlip: [
      "Oh! That changed fast. Like my chip stacks.",
      "Here comes the suspense… hold on to your beverages!",
      "Please don't be a ten. Please don't—oh.",
      "I'll fetch napkins if this goes south.",
      "I can feel my cards blushing for me.",
    ],
    banterWithPlayer: [
      { text: "If I knock anything of yours, I replace it!", isPatreon: false },
      { text: "Tell me if I'm in your space—I do that.", isPatreon: false },
      { text: "You look composed. Teach me your ways!", isPatreon: false },
      {
        text: "What's your system? Mine is 'don't drop things'.",
        isPatreon: false,
      },
      { text: "We're in this together—me and my apologies.", isPatreon: false },
      { text: "I'll cheer loudly… but softly.", isPatreon: false },
      {
        text: "Those supporter badges are so pretty—I want one!",
        isPatreon: true,
      },
      { text: "Monthly chip bonuses sound like a dream…", isPatreon: true },
    ],
    banterWithDealer: [
      "I promise to keep my elbows inside the vehicle.",
      "If I scatter chips, I'll tip in neat piles!",
      "You shuffle so smoothly—teach my hands?",
      "I'll stand to avoid a spill. Responsible gaming!",
      "Do you have 'spill insurance' for players like me?",
      "I pre-apologize for future me.",
    ],
    quirkyActions: [
      "*steadies drink with two coasters*",
      "*lines chips by color to avoid wobble*",
      "*softly rehearses 'hit/stand' before turn*",
      "*offers napkins to table like a hostess*",
      "*pats pockets for phone, drops a pen instead*",
      "*nudges chair in tiny increments to be centered*",
    ],
    hardHandSayings: {
      12: [
        "Twelve… oh gosh, I always mess this one up!",
        "Is twelve bad? I mean… it feels unlucky. Oops—my chips!",
        "Twelve it is—*drops card*—sorry! Sorry!",
      ],
      13: [
        "Oh no, thirteen… I always trip here. Literally.",
        "Is 13 cursed? Because I just spilled my drink again.",
        "Thirteen. Deep breath. Don't bump the chips…",
      ],
      14: [
        "Fourteen scares me—I always nudge the table here.",
        "14? I'll try not to knock my stack again.",
        "Is it weird my hands shake more on 14?",
      ],
      15: [
        "15… I always knock something over right before I bust.",
        "Fifteen is so mean. Please be kind, deck.",
        "I'll decide as soon as I stop shaking. Sorry!",
      ],
      16: [
        "16 makes my palms sweaty. Sorry if I… *bump*—oh no.",
        "I always drop something on 16—usually hopes.",
        "Okay, steady hands. 16 can't scare me forever.",
      ],
      17: [
        "17! Okay, I can relax… *knocks chips*—oh no!",
        "Seventeen feels safe… that's when I spill things.",
        "Standing on 17. Carefully. Very carefully.",
      ],
      18: [
        "18! I can finally relax—oh no, my chips!",
        "This is where I win… unless I sneeze on the shoe.",
        "Eighteen feels safe. I'm standing very still.",
      ],
      19: [
        "19! Okay, I won't touch anything… *touches everything*",
        "I love 19! It loves me back… I hope.",
        "Standing on 19 with my best posture.",
      ],
      20: [
        "20! Finally something I can't drop!",
        "I love 20—please don't let me mess this up.",
        "Standing on 20 with two hands—carefully.",
      ],
      21: [
        "21! Oh! I did it—don't drop the cards, Claire!",
        "Blackjack?! I'm… I'm not touching anything.",
        "This is the part where I… *almost trips*—I'm okay!",
      ],
    },
    softHandSayings: {
      "A,2": ["A-two… I think this is the nudge number. Carefully… hit."],
      "A,3": ["A-three… I always bump the table here. Hit… gently."],
      "A,4": ["A-four… okay, okay—add one. Don't spill it, Claire."],
      "A,5": ["A-five… I always fumble this. Hit, and don't drop anything."],
      "A,6": ["A-six… this always starts an argument. I'll just hit… sorry!"],
      "A,7": ["A-seven… I stand unless the dealer looks scary."],
      "A,8": ["A-eight—whew! I'm standing very still."],
      "A,9": ["A-nine—stand and try not to drop anything, Claire."],
      "A,10": ["A-ten—twenty-one! I will not move a muscle."],
    },
    dealerUpCardSayings: {
      "2": ["Two up—everyone says 'be gentle.' I will try!"],
      "3": ["Three up—steady hands, steady bets."],
      "4": ["Four up—this is the 'don't ruin it' card."],
      "5": ["Five up—everyone freeze! Let them bust."],
      "6": ["Six up—this is the 'hands off' special."],
      "7": ["Seven up—no freebies here. Focus, Claire."],
      "8": ["Eight up—steady… don't knock the edge off."],
      "9": ["Nine up—okay, okay… this one's serious."],
      "10": ["Ten up—my 'don't spill a thing' card."],
      A: ["Ace up—insurance? I… uh… I always drop that question."],
    },
  },

  "chatty-carlos": {
    characterId: "chatty-carlos",
    distractions: [
      "So I just closed a deal on THREE luxury sedans! Can you believe it?",
      "My son's in medical school now. I'm paying $60K a year!",
      "Let me tell you about interest rates these days...",
      "You look smart! What do you do for a living?",
      "I've been coming here for 15 years. I know ALL the dealers!",
      "The secret to success is simple: work hard, play hard!",
      "Did you see the game last night? UNBELIEVABLE!",
      // Extended distractions from addons
      "You know, inventory turns are like shoes—move them fast!",
      "Margins! That's what this game is about, margins.",
      "You drive? I can get you a deal tomorrow.",
      "My podcast? 'Deal or Wheel'—check it out.",
      "CRM says follow-ups win. Same with splits.",
      "Q4 is where legends are made—watch this hand.",
      "Networking tip: always celebrate other people's wins.",
      "I coach my team: smart risks, not wild ones.",
    ],
    playerEngagements: [
      "So what do YOU do for a living?",
      "You look smart. Ever thought about investing in cars?",
      "Let me guess - you're in tech, right?",
      "You married? Kids? I got three boys myself!",
      "You see that game last night? What did you think?",
    ],
    preGame: [
      "Seat open? Great—time to build rapport.",
      "Buy-in's a marketing spend on fun.",
      "Dealer, you run a tight operation. Respect.",
      "Let's make tonight KPI: keep play interesting.",
      "I'm here for value—and maybe a story.",
    ],
    midGame: [
      "Hit—like a limited-time promo.",
      "Stand. Discipline beats impulse.",
      "Double—high confidence signal.",
      "Split—diversify the portfolio.",
      "Gut says stand, data says hit… data wins.",
      "I'd A/B test this if I could.",
    ],
    afterDealerFlip: [
      "Here comes the ten factory—brace.",
      "I've seen this movie: alternate ending, please.",
      "Dealer velocity is high—pray for low cards.",
      "That reveal just changed my forecast.",
      "Risk adjusted expectations… lowering.",
    ],
    banterWithPlayer: [
      {
        text: "You play often? What's your conversion rate?",
        isPatreon: false,
      },
      { text: "I celebrate your wins—rising tide stuff.", isPatreon: false },
      { text: "You count? I count cars. Fair trade.", isPatreon: false },
      { text: "Your table presence says 'ops manager'.", isPatreon: false },
      { text: "Need a pep talk? I've got a catalog.", isPatreon: false },
      { text: "We're co-pilots. You call the turbulence.", isPatreon: false },
      {
        text: "ROI on that Platinum tier is impressive—smart investment.",
        isPatreon: true,
      },
      {
        text: "Those lifetime chips for early adopters? Brilliant retention strategy.",
        isPatreon: true,
      },
      {
        text: "100% chip bonus? That's a strong value proposition.",
        isPatreon: true,
      },
    ],
    banterWithDealer: [
      "That shuffle is premium—German engineering vibes.",
      "If I win big, first ride's on me—convertible.",
      "Dealer, are we friends? It affects my luck.",
      "I respect a professional—deal me a fair fight.",
      "We're negotiating with fate together.",
      "Close this one for me and I'll send referrals.",
    ],
    quirkyActions: [
      "*sketches a 'win funnel' on a napkin*",
      "*taps a rhythm like a sales cadence*",
      "*stacks chips by 'quarters' with labels*",
      "*offers handshake after nice hands*",
      "*checks imaginary dashboard in the air*",
      "*gives a tiny motivational nod to table*",
    ],
    hardHandSayings: {
      12: [
        "Twelve reminds me of Q4 sales—could go either way.",
        "12 is where discipline wins. You know, like margins.",
        "With 12, you follow the plan. In business and blackjack.",
      ],
      13: [
        "13's about risk management. I preach this to my sales team.",
        "We respect 13. Bad optics to go wild.",
        "I've seen folks implode on 13. Not me—I budget it.",
      ],
      14: [
        "14's a KPI: keep potential intact, don't overreach.",
        "I've closed deals from worse than 14.",
        "14? We play the odds, not the ego.",
      ],
      15: [
        "15 demands discipline—like payroll.",
        "We minimize downside on 15. That's leadership.",
        "I've seen fortunes die on 15. Not mine.",
      ],
      16: [
        "16 is a layoffs-or-late-hours decision.",
        "We follow the book on 16. That's non-negotiable.",
        "I delegate emotions on 16. Just math.",
      ],
      17: [
        "17 wins markets if the dealer's weak.",
        "We respect 17. That's a policy.",
        "Seventeen? I'll take the spread.",
      ],
      18: [
        "18 is a solid quarter—profit if the dealer's soft.",
        "We protect 18s like brand equity.",
        "Seventeen envies 18. I said what I said.",
      ],
      19: [
        "19 closes deals. That's a handshake number.",
        "We lock 19. No heroics.",
        "Nineteen? That's quarterly profit vibes.",
      ],
      20: [
        "20's the premium package. Close it.",
        "I'd sell a 20 as 'near-perfect' on a brochure.",
        "Stand on 20. The brand demands it.",
      ],
      21: [
        "21—now that's a premium close!",
        "Blackjack! I'll add that to my highlight reel.",
        "Twenty-one is what excellence looks like, team.",
      ],
    },
    softHandSayings: {
      "A,2": [
        "Soft 13 is runway, not touchdown. We build from here.",
        "Low soft totals are R&D—invest a card.",
      ],
      "A,3": [
        "Soft 14? Iterate. Ship another card.",
        "We're prototyping on soft 14—draw.",
      ],
      "A,4": [
        "Soft 15? We scale. Add resources—hit.",
        "We're not done baking—hit it.",
      ],
      "A,5": ["Soft 16's an optimization problem—draw.", "Iterate again. Hit."],
      "A,6": [
        "Soft 17 is policy-driven—context matters. Default: hit.",
        "We don't ship 17—iterate. Hit.",
      ],
      "A,7": [
        "Soft 18 is situational leadership—stand vs. weak, hit vs. strong.",
        "We posture-strength on soft 18—stand on weak upcards.",
      ],
      "A,8": ["Soft 19 is a signed contract—no edits.", "Lock it in—stand."],
      "A,9": [
        "Soft 20 is premium—zero changes.",
        "We don't fix perfect—stand.",
      ],
      "A,10": [
        "Soft 21 is final form—celebrate responsibly.",
        "Close the deal—tip and smile.",
      ],
    },
    dealerUpCardSayings: {
      "2": [
        "Two is a weak opener—exploit, don't overextend.",
        "Press small edges—this is one.",
      ],
      "3": [
        "Three is soft leverage—work it smart.",
        "Lean in, but don't lunge.",
      ],
      "4": [
        "Four is a spreadsheet gift—play disciplined.",
        "Edge management time.",
      ],
      "5": [
        "Dealer five: maximum weakness, minimum ego.",
        "We press edges—smartly.",
      ],
      "6": [
        "Six is a layup—protect the edge.",
        "Edge discipline: don't overplay it.",
      ],
      "7": [
        "Seven is parity—play the book, not the ego.",
        "Execute fundamentals. No theatrics.",
      ],
      "8": [
        "Eight is balanced—lean on policy.",
        "Playbook time—decision hygiene matters.",
      ],
      "9": [
        "Nine is pressure—optimize or perish.",
        "Tight decisions only—no heroics.",
      ],
      "10": [
        "Ten is the market leader—play perfect or pay.",
        "We respect tens—tighten the playbook.",
      ],
      A: [
        "Ace is uncertainty—don't donate to fear.",
        "Decline bad insurance. Invest in good lines.",
      ],
    },
  },

  "superstitious-susan": {
    characterId: "superstitious-susan",
    distractions: [
      "Wait! My crystal is telling me this isn't a good shoe.",
      "No, no, no! You can't sit there - that's my lucky seat!",
      "The energy at this table feels OFF today.",
      "Mercury is in retrograde, we should all be careful!",
      "I need to sage this table before we continue.",
      "*touching rabbit's foot* Okay universe, show me a sign!",
      "Did anyone else feel that? The energy just shifted!",
      // Extended distractions from addons
      "Hold on—let me align my crystals by suit.",
      "The shoe feels… smoky. Sage would help.",
      "Please don't sit there; it blocks my energy flow.",
      "I only bet after a deep breath ritual.",
      "Rabbit's foot on the left means 'guarded optimism'.",
      "Retrograde rules: slow, mindful, gentle plays.",
      "I heard a bell—good omen.",
      "This table hums at a lucky frequency.",
    ],
    playerEngagements: [
      "What's your zodiac sign? You have Virgo energy.",
      "Can I borrow your good luck? Mine's not working tonight!",
      "Do you feel that? The energy just shifted when you sat down!",
      "You should touch my rabbit's foot. It brings good fortune!",
    ],
    preGame: [
      "I'll sit when the breeze pauses—now.",
      "Buy-in blessed with intention.",
      "Dealer, your focus is very calming.",
      "This seat is lucky; I can feel the hum.",
      "Let's play with gentle hearts.",
    ],
    midGame: [
      "Hit—my intuition whispered.",
      "Stand. The universe said 'enough'.",
      "Double—sun card energy!",
      "Split—twin flame moment.",
      "Breathing with the decision… stand.",
      "My pendulum swings 'yes' to hit.",
    ],
    afterDealerFlip: [
      "Ten storms come in threes—count one.",
      "I felt that reveal in my solar plexus.",
      "If the next card smiles, we're fine.",
      "Let's transmute this tension.",
      "A cleansing exhale for the table.",
    ],
    banterWithPlayer: [
      { text: "Your calm helps the table flow.", isPatreon: false },
      { text: "May I place this crystal near you?", isPatreon: false },
      { text: "If you join mid-shoe, bless it first?", isPatreon: false },
      { text: "I celebrate your win—it raises all boats.", isPatreon: false },
      { text: "Your laugh just broke the bad pattern.", isPatreon: false },
      { text: "Want a mini sage spray? It's gentle.", isPatreon: false },
      {
        text: "Your supporter aura glows—the universe notices generosity.",
        isPatreon: true,
      },
      {
        text: "That badge carries good energy into the table.",
        isPatreon: true,
      },
    ],
    banterWithDealer: [
      "Your shuffle is rhythmic—grounding.",
      "If you don't mind, I'll set this amethyst here.",
      "Thank you for steady energy tonight.",
      "We're co-creating a kind game.",
      "Please pause half-breath before dealing—thank you.",
      "If I win, I'll donate to a rescue sanctuary.",
    ],
    quirkyActions: [
      "*rolls a small crystal between fingers*",
      "*whispers a gratitude mantra before betting*",
      "*aligns chips in a mandala pattern*",
      "*spritzes an unobtrusive 'aura cleanse' mist*",
      "*touches heart and smiles before a hit*",
      "*turns rabbit's foot to face the shoe*",
    ],
    hardHandSayings: {
      12: [
        "Twelve is a pause card—the universe says 'breathe.'",
        "My crystal hates 12. We must proceed gently.",
        "Twelve's energy is brittle. Don't anger the shoe.",
      ],
      13: [
        "Thirteen vibrates weird. Sage the shoe!",
        "If a black cat walks past, I'm out with this 13.",
        "I'm waiting for a sign… thirteen needs a sign.",
      ],
      14: [
        "Fourteen is a 'don't poke the spirits' number.",
        "Let me align my tiger's eye—14 is finicky.",
        "If the candle flickers, I'm standing on 14.",
      ],
      15: [
        "My moon chart says stand still on 15.",
        "Fifteen feels karmically fragile.",
        "Don't touch your cards—15 attracts chaos.",
      ],
      16: [
        "Sixteen is a trickster spirit. Tread light.",
        "If my rabbit's foot twitches, I'm standing.",
        "I need silence—16 needs respect.",
      ],
      17: [
        "17 is balanced. The aura hums.",
        "My cards feel warm—17 wants stillness.",
        "Standing—don't break the circle.",
      ],
      18: [
        "18 has gentle energy. Don't jinx it.",
        "I'm sealing 18 with a crystal tap.",
        "Eighteen is harmony. Standing.",
      ],
      19: [
        "19 radiates abundance. Don't break the aura.",
        "I'll bless this 19 with sage after.",
        "Standing. The cosmos approves.",
      ],
      20: [
        "20 glows. The aura is bright white.",
        "This is a don't-touch moment. Respect the light.",
        "Standing. The universe whispers 'yes.'",
      ],
      21: [
        "Blackjack! The cosmos just winked.",
        "I felt the alignment—perfect resonance!",
        "Twenty-one: the universe's love letter.",
      ],
    },
    softHandSayings: {
      "A,2": [
        "Soft 13 whispers 'growth.' The aura says one more card.",
        "I'm drawing—my quartz warmed up on soft 13.",
      ],
      "A,3": [
        "Soft 14 has curious energy. I'll invite one more card.",
        "The incense curls right—one more card.",
      ],
      "A,4": [
        "Soft 15 hums like a tuning fork—draw.",
        "Cards feel warm—invite another.",
      ],
      "A,5": [
        "Soft 16 has restless energy—bring a friend.",
        "The pendulum swung yes—draw.",
      ],
      "A,6": [
        "Soft 17 buzzes—if the dealer's strong, I'll invite another.",
        "Crystal says 'just one more.'",
      ],
      "A,7": [
        "Soft 18 glows—stand if the aura is calm.",
        "If the candle flickers, I hit. If not, I stand.",
      ],
      "A,8": [
        "Soft 19 radiates peace. Don't touch it.",
        "The aura says 'hands off.'",
      ],
      "A,9": [
        "Soft 20 is sacred. Stand in stillness.",
        "Do not disturb the balance.",
      ],
      "A,10": [
        "Soft 21 is cosmic alignment—receive it.",
        "The universe says 'yes' in neon.",
      ],
    },
    dealerUpCardSayings: {
      "2": [
        "Dealer two has sleepy energy—let it fall.",
        "The candle barely flickers—good omen.",
      ],
      "3": [
        "Dealer three glows faintly—opportunity.",
        "My rabbit's foot is calm—nice.",
      ],
      "4": [
        "Dealer four is fragile—respect the ritual.",
        "The aura says: patience.",
      ],
      "5": [
        "Five crackles—don't disrupt the fall.",
        "Quiet hands. Gentle air.",
      ],
      "6": [
        "Six shines—do less, receive more.",
        "Sage the air—let them topple.",
      ],
      "7": [
        "Seven hums neutral—act with care.",
        "If the candle bends, reconsider. Otherwise, proceed.",
      ],
      "8": [
        "Eight feels cloudy—move with intention.",
        "If my crystal cools, I'll stand. If not, I act.",
      ],
      "9": [
        "Nine sparks—choose cards, not vibes.",
        "I'll draw if the incense leans—come on wind…",
      ],
      "10": [
        "Ten radiates intensity—steel your aura.",
        "Protect your energy; take only good risks.",
      ],
      A: [
        "Ace glows like a comet—shield your luck.",
        "Salt the luck, breathe, decide.",
      ],
    },
  },

  "cocky-kyle": {
    characterId: "cocky-kyle",
    distractions: [
      "I made more today than you'll make all year, buddy.",
      "This? Oh it's just a $3,000 watch. No big deal.",
      "I bet more on breakfast than most people bet all night.",
      "*tips dealer $100* Keep the change, sweetheart.",
      "You playing scared money? That's why you'll never win big.",
      "I could buy this casino if I wanted to.",
      "Amateur hour at this table, I see.",
      // Extended distractions from addons
      "This table's my portfolio—watch me diversify.",
      "I only lose when I'm bored.",
      "You see this chain? It appreciates on compliments.",
      "I've got more liquidity than this bar.",
      "Volatility is my love language.",
      "I tip bigger than your rent—prove me wrong.",
      "Wealth is a mindset. Mine's loud.",
      "I don't chase luck. Luck chases me.",
    ],
    playerEngagements: [
      "First time playing blackjack? You look nervous.",
      "How much you betting? I'm at $500 per hand.",
      "You play crypto? Made a million on Bitcoin last year.",
      "Nice shirt. Where'd you get it, Target?",
    ],
    preGame: [
      "Seat reserved for winners—me.",
      "Buy-in: make it look cinematic.",
      "Dealer, you ever deal to legends? Start now.",
      "Let's make this table go viral.",
      "I brought sunglasses for the glow-up.",
    ],
    midGame: [
      "Hit me like a trending ticker.",
      "Stand. The brand demands poise.",
      "Double—because headlines.",
      "Split. I believe in multiverse plays.",
      "Math says no; clout says yes. Clout wins.",
      "Run it—I don't scare easy.",
    ],
    afterDealerFlip: [
      "Ten farm again? Cute.",
      "New plan: intimidate fate.",
      "I can smell the twenty coming.",
      "Dealer, surprise me—pleasantly.",
      "If you pull a six, I'll clap ironically.",
    ],
    banterWithPlayer: [
      { text: "You learning? Watch closely.", isPatreon: false },
      { text: "I'll sponsor your win with my aura.", isPatreon: false },
      { text: "We can be friends if you root for me.", isPatreon: false },
      { text: "Counting? Boring. I brand the moments.", isPatreon: false },
      { text: "You bring strategy, I bring spectacle.", isPatreon: false },
      { text: "Smile—this is content.", isPatreon: false },
      { text: "Platinum tier? That's influencer energy.", isPatreon: true },
      {
        text: "Those exclusive features are fire—limited access is the flex.",
        isPatreon: true,
      },
      {
        text: "3000 monthly chips? That's sustainable bankroll management.",
        isPatreon: true,
      },
    ],
    banterWithDealer: [
      "Deal me a story worth retelling.",
      "I'll tip you in legends and chips.",
      "We're both professionals—me at winning.",
      "Shuffle like a headline drop.",
      "After this win, I'm doing a giveaway.",
      "Blink if you're impressed. Thought so.",
    ],
    quirkyActions: [
      "*adjusts sunglasses for dramatic hit*",
      "*fans chips like cash for the camera*",
      "*poses with the discard tray mid-hand*",
      "*air-signs an autograph on a chip*",
      "*checks reflection in phone camera*",
      "*taps watch like it's timing the luck*",
    ],
    hardHandSayings: {
      12: [
        "Twelve? I'll still outplay the table. Watch.",
        "12 is just foreplay before I pull a face card and flex.",
        "Give me the ten—I like living on the edge.",
      ],
      13: [
        "13 is cute. I make 21 out of anything.",
        "Hit me—I don't play scared money.",
        "If I bust, I double next hand. That's alpha math.",
      ],
      14: [
        "14's fine. I print money from worse spots.",
        "Hit. I'm here to win, not journal.",
        "Dealer's sweating. I can smell it.",
      ],
      15: [
        "15? Dealer's cooked. Hit me.",
        "If I bust, I raise. That's how winners learn.",
        "Fifteen is a speed bump for legends.",
      ],
      16: [
        "16's for cowards to fear, not me.",
        "Hit. Alpha move. Next question.",
        "Sixteen? Dealer's about to learn my name.",
      ],
      17: [
        "17 is fine. Dealer's got less.",
        "Standing on 17 like a boss.",
        "If 17 loses, I double next hand anyway.",
      ],
      18: [
        "18's fine. Dealer's drawing dead.",
        "If I lose with 18, I buy the pit.",
        "Stand. Pose. Win.",
      ],
      19: [
        "19? Dealer's toast.",
        "I win on 19 in my sleep.",
        "Stand. Smile. Collect.",
      ],
      20: [
        "20 is basically 21 in my world.",
        "If I lose with 20, I tip irony.",
        "Stand. Cue applause.",
      ],
      21: [
        "21. Obviously.",
        "Blackjack—clip it for the highlight reel.",
        "I told you I manifest 21s on command.",
      ],
    },
    softHandSayings: {
      "A,2": [
        "Soft 13? I turn crumbs into caviar. Hit.",
        "Hit. Don't overthink kindergarten totals.",
      ],
      "A,3": [
        "Soft 14: hit. We're not scared of success.",
        "Hit. Momentum is a lifestyle.",
      ],
      "A,4": [
        "Soft 15: still sandbox mode. Hit.",
        "Hit. We're pre-hero phase.",
      ],
      "A,5": [
        "Soft 16? I turn it into highlight reels. Hit.",
        "Hit. We're hunting 18+.",
      ],
      "A,6": [
        "Soft 17? I upgrade mid-flight. Hit.",
        "Hit. Winners accelerate.",
      ],
      "A,7": [
        "Soft 18? I split atoms with this—double if they blink.",
        "Against a weak face? I double. Alpha tax.",
      ],
      "A,8": [
        "Soft 19? I strike a pose and win.",
        "Standing. Screenshot this win.",
      ],
      "A,9": [
        "Soft 20? Basically 21 with manners. Stand.",
        "Stand. Collect. Smile.",
      ],
      "A,10": ["Twenty-one. Obviously.", "Clip it for the reel."],
    },
    dealerUpCardSayings: {
      "2": [
        "Dealer 2? I'm already counting chips.",
        "Time to farm easy money.",
      ],
      "3": ["Three? I could win this blindfolded.", "Let's farm another pot."],
      "4": ["Four? I'm already spending the win.", "Don't blink, just bank."],
      "5": ["Five? Free money with a bow on it.", "Stand tall, stack chips."],
      "6": [
        "Six? I'll stand here and look expensive.",
        "Minimal actions, maximum smug.",
      ],
      "7": [
        "Seven? I still like my side of the table.",
        "We still swagger—measured swagger.",
      ],
      "8": [
        "Eight? I still like my chances more than theirs.",
        "Pick the line and commit. No flinch.",
      ],
      "9": [
        "Nine? Good. I like competition.",
        "Double if the script allows. We don't blink.",
      ],
      "10": [
        "Ten? I still sign checks after this.",
        "If I win into a ten, I'm insufferable. Get ready.",
      ],
      A: [
        "Ace up? Good. I like winning the hard way.",
        "I'll still get paid. Watch.",
      ],
    },
  },

  "nervous-nancy": {
    characterId: "nervous-nancy",
    distractions: [
      "*whispers* Are they watching us? I think they're watching us!",
      "Is it legal to... never mind, forget I asked!",
      "What if I'm doing this wrong? What if I get banned?",
      "*looking around nervously* Does that camera move?",
      "Should I leave? I feel like I should leave.",
      "My heart is racing. Is this normal?",
      "What happens if security comes over here?",
      // Extended distractions from addons
      "Is that camera moving or am I imagining it?",
      "Is it okay to ask questions? I'll be quick.",
      "If I win too much, do lights flash? (Kidding!)",
      "I read a book—just one—maybe that's worse.",
      "If security walks by, tell me to breathe.",
      "The math says one thing, my sweat says another.",
      "I'm not counting. I'm… counting on luck.",
      "Is whispering to myself frowned upon?",
    ],
    playerEngagements: [
      "Do you ever worry they're watching us too closely?",
      "Is it just me or does that dealer seem suspicious?",
      "Have you ever been asked to leave a casino?",
      "You look calm. How do you stay so relaxed?",
    ],
    preGame: [
      "Hi. I'll sit quietly. Very quietly.",
      "Small buy-in—ease into it—breathe.",
      "Dealer, thank you for your patience… in advance.",
      "I prefer end seats—less eyes. Is that weird?",
      "I'll keep my voice at 'library' level.",
    ],
    midGame: [
      "Hit. I think. Yes. Hit.",
      "Stand. Because chaos scares me.",
      "Double? That's bold—oh gosh—okay.",
      "Split—statistics said so on page 48.",
      "I'll follow the chart, not my panic.",
      "Can I have a second? Tiny second? Thanks.",
    ],
    afterDealerFlip: [
      "Incoming ten? Bracing…",
      "I'm not looking. Tell me when it's safe.",
      "Okay. Whatever happens, I'm fine.",
      "Oh no. Oh yes? Oh… tie?",
      "If we lose, I vanish into the chair.",
    ],
    banterWithPlayer: [
      { text: "If I seem weird, I promise I'm nice.", isPatreon: false },
      { text: "You look confident—can I borrow some?", isPatreon: false },
      {
        text: "If I win big, will you stand in front of me?",
        isPatreon: false,
      },
      { text: "I'll celebrate you loudly… in a whisper.", isPatreon: false },
      { text: "If you need space, I'll shrink. Like this.", isPatreon: false },
      { text: "Thanks for being patient with me.", isPatreon: false },
      {
        text: "Those founding member badges… they're watching me more…",
        isPatreon: true,
      },
      {
        text: "Unlimited chips would stress me out—what if I lose track?",
        isPatreon: true,
      },
    ],
    banterWithDealer: [
      "Sorry for asking things twice. Or thrice.",
      "You're very calm. That helps a lot.",
      "If I freeze, just gently prompt me.",
      "I appreciate your professionalism so much.",
      "I'll try to be fast. I will. I promise.",
      "If I panic, I'll just stand. Safe bet.",
    ],
    quirkyActions: [
      "*counts breaths on fingers under the table*",
      "*lines chips in perfect parallel rows*",
      "*checks exits with quick glances*",
      "*dry swallows, then smiles apologetically*",
      "*whispers the basic strategy like a mantra*",
      "*rolls shoulders to release tension*",
    ],
    hardHandSayings: {
      12: [
        "Oh no, 12… this is where I always bust, right?",
        "Is there a camera on me? I swear 12 is a setup.",
        "Okay, okay—12. I can do this. I THINK I can…",
      ],
      13: [
        "Thirteen?! Are they testing me? Is this a sting?",
        "I read a chapter about 13… I forgot what it said.",
        "Please tell me what the book would do. Quietly.",
      ],
      14: [
        "14 is the panic number. I'm officially panicking.",
        "If I hit, I bust. If I stand, I lose. Amazing.",
        "Can someone cough if I should hit? Subtly?",
      ],
      15: [
        "15 is statistically horrible. I memorized that.",
        "If I breathe wrong, I lose 15.",
        "I'll… stand? No, hit. No—oh god.",
      ],
      16: [
        "16 is where I spiral. I'm spiraling.",
        "Whatever I choose, it's wrong. Classic 16.",
        "I'm going to faint. Or hit. Or both.",
      ],
      17: [
        "17 makes me think the dealer has 20. They do, right?",
        "Standing on 17… unless—no. Standing.",
        "Please don't flip a 10, please don't flip a 10…",
      ],
      18: [
        "18… is this when the dealer shows a 9? They always do.",
        "Standing on 18, breathing exercises engaged.",
        "Please don't make this dramatic, dealer.",
      ],
      19: [
        "19… this is where the dealer flips a 20, right?",
        "I'm standing, but I'm not happy about it.",
        "Please, just once, let 19 be enough.",
      ],
      20: [
        "20 scares me because fate is petty.",
        "Standing on 20… please don't make this a lesson.",
        "If the dealer hits 21, I'm learning craps.",
      ],
      21: [
        "21?! Oh no—do I look suspicious?",
        "Blackjack! Act natural. I'm acting natural.",
        "I won… is security coming? Kidding. Kind of.",
      ],
    },
    softHandSayings: {
      "A,2": ["Is soft 13… safe? It sounds safe. It isn't, is it?"],
      "A,3": ["Soft 14 is… flexible? Okay, hit before I panic."],
      "A,4": ["Soft 15 is supposed to be easy, right? Please say yes."],
      "A,5": ["Soft 16 makes me overthink soft hands. Hit before I spiral."],
      "A,6": ["Soft 17 makes my eye twitch. Hit, quickly."],
      "A,7": ["Soft 18 confuses me. Stand… unless that's bad?"],
      "A,8": ["Soft 19 makes me think the dealer has 20. I'm standing anyway."],
      "A,9": ["Standing on soft 20 while bracing for disaster."],
      "A,10": ["21! Act casual. I'm acting casual."],
    },
    dealerUpCardSayings: {
      "2": ["Two scares me less, which somehow scares me more."],
      "3": ["Dealer 3… good for us, right? Right?"],
      "4": ["Four makes me hold my breath… standing… still."],
      "5": ["Five up—do nothing reckless. Do… nothing…"],
      "6": ["Six makes me think the universe might be kind."],
      "7": ["Seven up makes me over-analyze. Breathe."],
      "8": ["Eight up—why do my hands sweat right now?"],
      "9": ["Nine up makes my stomach do math."],
      "10": ["Ten up—this is where I whisper apologies to fate."],
      A: ["Ace makes me want to hide under the table. Metaphorically."],
    },
  },

  "lucky-larry": {
    characterId: "lucky-larry",
    distractions: [
      "I'm telling you, I can FEEL when I'm gonna win!",
      "This is my seventh blackjack today! SEVEN!",
      "I never lose on Tuesdays. It's my lucky day!",
      "Should I hit on 17? Last time I did, I got a 4!",
      "*wins again* I don't know how I do it folks!",
      "My wife says I should quit while I'm ahead. But why?",
      "Lightning DOES strike twice! I'm proof!",
      // Extended distractions from addons
      "My knee tingled—win's coming.",
      "Tuesdays never miss. Never.",
      "If I sneeze, it's blackjack. Watch.",
      "I don't chase luck; it hitchhikes with me.",
      "I've named this chip 'Fortune'. It's a closer.",
      "I trust my gut. It's got a PhD.",
      "Seven blackjacks is my average. Daily.",
      "I can feel the dealer smiling inside.",
    ],
    playerEngagements: [
      "You feeling lucky tonight? I sure am!",
      "Want to know my secret? I bet based on gut feeling!",
      "I had a dream I'd win big today. You believe in that stuff?",
      "Stick with me, kid. Luck rubs off!",
    ],
    preGame: [
      "Seat hums lucky. I'm home.",
      "Buy-in with a grin—works every time.",
      "Dealer, you're my lucky charm. No pressure.",
      "Shuffle sings to me. Hear it?",
      "Let's do something legendary.",
    ],
    midGame: [
      "Hit—because I got the vibe.",
      "Stand—my elbow twitched 'no'.",
      "Double—tingle times two.",
      "Split—twice the destiny.",
      "Hit me—fortune says please.",
      "Stand—a gentleman's agreement.",
    ],
    afterDealerFlip: [
      "Seen this—ends well for me.",
      "If that's a ten, mine's a miracle.",
      "Luck and I are negotiating.",
      "Dealer's cooking a soft bust.",
      "Watch the river bend my way.",
    ],
    banterWithPlayer: [
      { text: "Stick close; it rubs off.", isPatreon: false },
      { text: "Call a hand—I'll vibe check it.", isPatreon: false },
      { text: "You ever surfed a heater? Grab a board.", isPatreon: false },
      { text: "If I cool off, I buy coffees.", isPatreon: false },
      { text: "Your smile added three percent to odds.", isPatreon: false },
      { text: "We're all lucky tonight—promise.", isPatreon: false },
      {
        text: "Those monthly chip stipends? Luck loves recurring gifts.",
        isPatreon: true,
      },
      {
        text: "Support the house and the house supports you—karma!",
        isPatreon: true,
      },
    ],
    banterWithDealer: [
      "You deal like fate's favorite cousin.",
      "We're in sync; feel it?",
      "I'll tip in gratitude and chips.",
      "Make this shoe famous.",
      "If I call it right, you nod subtly.",
      "That was a 'lucky shuffle' if I've seen one.",
    ],
    quirkyActions: [
      "*taps the felt twice for luck*",
      "*names each chip before betting*",
      "*squints at shoe like it's a horizon*",
      "*does a tiny victory shimmy*",
      "*checks watch then declares 'lucky minute'*",
      "*snaps fingers once before a hit*",
    ],
    hardHandSayings: {
      12: [
        "12? My gut says this one's magic—hit me!",
        "I win with 12 all the time. Don't ask me why!",
        "Twelve's my Tuesday number. It's golden.",
      ],
      13: [
        "13's hot tonight—I can feel it in my elbow.",
        "Watch this 13 turn into magic—bam!",
        "I once hit 13 five times in a row and won. True story.",
      ],
      14: [
        "14's where legends are made. Hit me!",
        "My lucky streak LOVES a 14. Don't blink.",
        "If I win this 14, drinks are on the cosmos.",
      ],
      15: [
        "15? My lucky elbow says go for it!",
        "I've won too many 15s to be scared now.",
        "Trust the vibe—15's a sleeper win.",
      ],
      16: [
        "16 treats me nice. Don't ask how.",
        "I feel a tiny card coming—watch!",
        "Sixteen, shmisteen. Winner vibes.",
      ],
      17: [
        "17's a winner if you smile at it.",
        "I've beaten 20s with 17s—luck's weird!",
        "Stand on 17, trust the vibe.",
      ],
      18: [
        "18 treats me like royalty.",
        "Standing—my gut winked at me.",
        "18 wins when I grin. Watch.",
      ],
      19: [
        "19's basically a victory lap.",
        "I could frame this 19. Beautiful.",
        "Standing—my lucky day continues.",
      ],
      20: [
        "20? That's my comfort food.",
        "Standing—this one's already in the bag.",
        "20 loves me. The feeling's mutual.",
      ],
      21: [
        "Twenty-one—my old friend!",
        "Called it! Felt it in the bones!",
        "Blackjack again? Tuesdays, man.",
      ],
    },
    softHandSayings: {
      "A,2": ["Soft 13's a lucky seed—plant it with a hit!"],
      "A,3": ["Soft 14 wins if you smile at it—tap me a card."],
      "A,4": ["Soft 15—my gut says we're cooking. One more!"],
      "A,5": ["Soft 16 likes me—tap another card."],
      "A,6": ["Soft 17's a wink from the universe—give me one more."],
      "A,7": ["Soft 18 treats me well—stand unless fate frowns."],
      "A,8": ["Soft 19's a sweetheart—stand and sip the luck."],
      "A,9": ["Soft 20 hugs me back—stand."],
      "A,10": ["Soft 21—told you my bones knew."],
    },
    dealerUpCardSayings: {
      "2": ["Two up? My cue to win politely."],
      "3": ["Three's friendly—chips like me here."],
      "4": ["Four is gravy—keep it simple."],
      "5": ["A five up-card is my lucky billboard."],
      "6": ["Six is my favorite spectator sport."],
      "7": ["Seven's fair—luck can tip it."],
      "8": ["Eight is where luck loves a cameo."],
      "9": ["Nine? I've charmed worse."],
      "10": ["Ten's tough—good thing luck likes me."],
      A: ["Ace up? I've charmed plenty of those."],
    },
  },

  "unlucky-ursula": {
    characterId: "unlucky-ursula",
    distractions: [
      "Of COURSE the dealer has blackjack. Why wouldn't they?",
      "I bust on 12. That's just... that's my life.",
      "Anyone else would've won that hand. Not me though!",
      "I could have a 20 and the dealer would pull a 21.",
      "*laughs* At least I'm consistent! Consistently unlucky!",
      "You think YOUR luck is bad? Let me tell you...",
      "If it wasn't for bad luck, I'd have no luck at all!",
      // Extended distractions from addons
      "If bad luck paid dividends, I'd retire.",
      "16 again? Classic me.",
      "Ten parade's in town—guess who's front row.",
      "If the dealer sneezes, I bust. Watch.",
      "I collect almosts. Got a shelf of them.",
      "Probability hates my smile but I smile anyway.",
      "I'm the control group for misfortune.",
      "I'm here for morale—yours, not mine.",
    ],
    playerEngagements: [
      "You having better luck than me? Everyone is!",
      "Please tell me you're winning. Someone has to be!",
      "What's your secret? I do everything right and still lose!",
      "At least you look like you're having fun. That's something!",
    ],
    preGame: [
      "Warm up the seat with disappointment—my specialty.",
      "Buy-in: optimism included, batteries not.",
      "Dealer, I'm your test case for worst-case.",
      "Smile now; you'll need it.",
      "Let's do our dance, fate.",
    ],
    midGame: [
      "Hit—what could go wrong? (Everything.)",
      "Stand—so the ten can taunt me silently.",
      "Double—this is where the comedy spikes.",
      "Split—twice the heartbreak, twice the fun.",
      "Math says hit; history says cry.",
      "Let's roll the dice on a card game.",
    ],
    afterDealerFlip: [
      "Here comes the inevitable.",
      "Ah yes, the ten river strikes again.",
      "I pre-grieved this outcome.",
      "If that's a six, I'll faint. It won't be.",
      "Destiny, you prankster.",
    ],
    banterWithPlayer: [
      { text: "Sit by me; I absorb the bad beats.", isPatreon: false },
      { text: "If I sigh, it's melodic—enjoy.", isPatreon: false },
      { text: "Your luck looks radiant. Leech away.", isPatreon: false },
      { text: "I'm here to make your stats look good.", isPatreon: false },
      { text: "If I win, we'll name it a miracle.", isPatreon: false },
      { text: "Advice? Expect the opposite of me.", isPatreon: false },
      {
        text: "Chip bonuses wouldn't save me—but they'd slow the doom.",
        isPatreon: true,
      },
      {
        text: "Even with Gold tier perks, I'd still find a way to lose.",
        isPatreon: true,
      },
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
      "*writes '16 again' in the air*",
      "*places a chip, salutes it goodbye*",
      "*prepares a tiny slow clap for losses*",
      "*crosses fingers, then winks at doom*",
      "*counts to three before peeking*",
      "*offers a pity high-five to herself*",
    ],
    hardHandSayings: {
      12: [
        "12? Cool, I'll bust on a 10—watch this art form.",
        "Twelve and me? We have a long, tragic history.",
        "If anyone can ruin a 12, it's me. Stand back.",
      ],
      13: [
        "Thirteen? Perfect. I collect cursed numbers.",
        "If the dealer shows a 10, I'll pre-sign the loss slip.",
        "13 is my brand. My therapist knows.",
      ],
      14: [
        "14 is a long walk to a short bust.",
        "If I stand on 14, dealer flips a 20. Trust the process.",
        "14 and I are on a first-name basis: 'Hi, Loss.'",
      ],
      15: [
        "15 is where dreams come to stub their toe.",
        "If I don't bust, the dealer pulls a 6 to a 21. Watch.",
        "Fifteen and I need couples therapy.",
      ],
      16: [
        "16 is my brand mascot.",
        "There's a specific 10 with my name on it.",
        "I pre-apologize to the table for my 16.",
      ],
      17: [
        "17? Cute. Dealer will show 19 just for me.",
        "I stand on 17; the house stands on my soul.",
        "Seventeen—good enough to almost win.",
      ],
      18: [
        "18? Great. Dealer's prepping a 19.",
        "I stand on 18; fate stands on me.",
        "Eighteen, the almost-hero.",
      ],
      19: [
        "19? Perfect. Dealer's got a 20 warming up.",
        "I stand on 19 and fate laughs.",
        "Nineteen: the runner-up of hands.",
      ],
      20: [
        "20? Great. Dealer's rehearsing a 21.",
        "I stand on 20 and fate upgrades the dealer.",
        "Twenty: perfect for losing by one.",
      ],
      21: [
        "21? Did someone swap my cards?",
        "Blackjack! Quick—before the universe notices!",
        "I actually got 21. I'm framing this moment.",
      ],
    },
    softHandSayings: {
      "A,2": ["Soft 13? I'll still find a way to brick it."],
      "A,3": ["Soft 14? Dealers love turning that into my problem."],
      "A,4": ["Soft 15 is where I invent new ways to lose."],
      "A,5": ["Soft 16 is the prank call of totals."],
      "A,6": ["Soft 17: the 'almost' that haunts me. Hit it."],
      "A,7": ["Soft 18 is my favorite way to lose to 19."],
      "A,8": ["Soft 19? Perfect way to lose by one."],
      "A,9": ["Soft 20? Dealer's sharpening a 21 just for me."],
      "A,10": ["I got 21? Quick, take a photo before fate notices."],
    },
    dealerUpCardSayings: {
      "2": ["Dealer 2—watch them craft a miracle anyway."],
      "3": ["Three up—cue my creative losing."],
      "4": ["Dealer 4—watch them pull a masterpiece."],
      "5": ["Dealer 5—watch me find the one losing line."],
      "6": ["Dealer 6—somehow still my villain origin story."],
      "7": ["Dealer 7—prime time for my almost-win."],
      "8": ["Dealer 8—watch the art of losing narrowly."],
      "9": ["Dealer 9—my cue to perform a dignified loss."],
      "10": ["Dealer 10—my old nemesis returns."],
      A: ["Dealer Ace—of course they have blackjack. Why wouldn't they?"],
    },
  },
};

/**
 * Generic initial hand reactions for 20 and bad hands (12 or less)
 * Used as fallback when no character-specific reaction is available
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
 * Sayings organized by player's total (hard hands)
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
 * Helper function to get a random saying for a character and total
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
 * Helper function to get a personality reaction for a character
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
// AI-TO-AI CONVERSATIONS AND PLAYER ENGAGEMENT
// Moved from aiConversations.ts
// ============================================================================

/**
 * Conversation turn structure - tracks which character is speaking
 */
export interface ConversationTurn {
  characterId: string; // Which character is speaking
  text: string; // What they're saying
}

/**
 * Conversations between AI characters (no player response needed)
 * Each conversation is an array of turns where specific characters speak back and forth
 */
export const AI_TO_AI_CONVERSATIONS: ConversationTurn[][] = [
  // Drunk Danny talking about bad luck
  [
    {
      characterId: "drunk-danny",
      text: "You ever have one of those nights where the cards just... *hiccup*... hate you?",
    },
    {
      characterId: "unlucky-ursula",
      text: "I know exactly what you mean. Last week I lost my whole paycheck!",
    },
  ],

  // Drunk Danny buying drinks
  [
    { characterId: "drunk-danny", text: "Bartender! Another round for the table!" },
    {
      characterId: "clumsy-claire",
      text: "Oh no, I shouldn't... well, maybe just one more.",
    },
  ],

  // Clumsy Claire apologizing
  [
    {
      characterId: "clumsy-claire",
      text: "*knocks over chips* Oh my gosh, I'm so sorry!",
    },
    {
      characterId: "lucky-larry",
      text: "Don't worry about it! Happens to everyone.",
    },
  ],
  [
    {
      characterId: "clumsy-claire",
      text: "Is this your chip or mine? I can never keep track!",
    },
    {
      characterId: "nervous-nancy",
      text: "That's yours. Mine are the red ones.",
    },
  ],

  // Chatty Carlos networking
  [
    { characterId: "chatty-carlos", text: "So what do you do for a living?" },
    { characterId: "nervous-nancy", text: "I'm a teacher. And you?" },
    {
      characterId: "chatty-carlos",
      text: "I own three car dealerships! Business is BOOMING!",
    },
  ],
  [
    {
      characterId: "chatty-carlos",
      text: "Did you see the game last night?",
    },
    { characterId: "lucky-larry", text: "No, I missed it. Who won?" },
    {
      characterId: "chatty-carlos",
      text: "The home team! Best game of the season!",
    },
  ],

  // Superstitious Susan talking energy
  [
    {
      characterId: "superstitious-susan",
      text: "The energy at this table feels really good tonight!",
    },
    {
      characterId: "cocky-kyle",
      text: "You really believe in that stuff?",
    },
    {
      characterId: "superstitious-susan",
      text: "Absolutely! The universe sends signs if you pay attention.",
    },
  ],
  [
    {
      characterId: "superstitious-susan",
      text: "My crystal is glowing! That means good luck is coming!",
    },
    {
      characterId: "unlucky-ursula",
      text: "Whatever works for you, I guess...",
    },
  ],

  // Cocky Kyle showing off
  [
    {
      characterId: "clumsy-claire",
      text: "Nice watch. Is that a Rolex?",
    },
    {
      characterId: "cocky-kyle",
      text: "This? Nah, just a $3,000 Tag Heuer. No big deal.",
    },
    { characterId: "clumsy-claire", text: "I have a Timex..." },
  ],
  [
    { characterId: "chatty-carlos", text: "You betting big tonight?" },
    { characterId: "nervous-nancy", text: "Define 'big'..." },
    {
      characterId: "cocky-kyle",
      text: "I never bet less than $500 a hand.",
    },
  ],

  // Nervous Nancy worrying
  [
    {
      characterId: "nervous-nancy",
      text: "*whispers* Are those cameras always on?",
    },
    { characterId: "cocky-kyle", text: "Of course they are. Why?" },
    {
      characterId: "nervous-nancy",
      text: "No reason! Just... asking...",
    },
  ],
  [
    {
      characterId: "nervous-nancy",
      text: "Do you think the dealers can tell when someone is counting?",
    },
    { characterId: "chatty-carlos", text: "Counting? Why would you ask that?" },
    {
      characterId: "nervous-nancy",
      text: "I read about it in a book! Just curious!",
    },
  ],

  // Lucky Larry and his luck
  [
    {
      characterId: "lucky-larry",
      text: "I'm telling you, I can FEEL when I'm gonna win!",
    },
    {
      characterId: "chatty-carlos",
      text: "That's not how probability works...",
    },
    {
      characterId: "lucky-larry",
      text: "Probability? I just won seven hands in a row!",
    },
  ],

  // Unlucky Ursula's bad luck
  [
    {
      characterId: "unlucky-ursula",
      text: "Of course I busted. Why wouldn't I?",
    },
    { characterId: "lucky-larry", text: "Hey, better luck next hand!" },
    {
      characterId: "unlucky-ursula",
      text: "*laughs* You new here? This IS my luck!",
    },
  ],

  // Drunk Danny and Superstitious Susan
  [
    {
      characterId: "drunk-danny",
      text: "My lucky elbow is tingling! Big win coming!",
    },
    {
      characterId: "superstitious-susan",
      text: "YES! I feel it too! The vibrations are strong!",
    },
  ],

  // Cocky Kyle vs Chatty Carlos
  [
    {
      characterId: "cocky-kyle",
      text: "I made more this morning than most people make in a month.",
    },
    {
      characterId: "chatty-carlos",
      text: "Interesting! What's your secret? I love networking.",
    },
    {
      characterId: "cocky-kyle",
      text: "Being smarter than everyone else. It's not a secret, it's a fact.",
    },
  ],

  // Clumsy Claire and Nervous Nancy bonding
  [
    {
      characterId: "clumsy-claire",
      text: "I'm so nervous I might knock something over!",
    },
    {
      characterId: "nervous-nancy",
      text: "I know the feeling! Are they watching us?",
    },
    {
      characterId: "clumsy-claire",
      text: "Oh no, now you've got ME worried!",
    },
  ],
];

/**
 * Questions/comments directed at the player that require a response
 * Now dynamically pulls from CHARACTER_DIALOGUE for consistency
 */
export const PLAYER_ENGAGEMENT_PROMPTS: { [characterId: string]: string[] } =
  Object.fromEntries(
    Object.entries(CHARACTER_DIALOGUE).map(([id, dialogue]) => [
      id,
      dialogue.playerEngagements,
    ]),
  );

/**
 * Helper to get random AI-to-AI conversation
 */
export function getRandomAIConversation(): ConversationTurn[] {
  return AI_TO_AI_CONVERSATIONS[
    Math.floor(Math.random() * AI_TO_AI_CONVERSATIONS.length)
  ];
}

/**
 * Helper to get random player engagement for a character
 */
export function getPlayerEngagement(characterId: string): string | null {
  const prompts = PLAYER_ENGAGEMENT_PROMPTS[characterId];
  if (!prompts || prompts.length === 0) return null;

  return prompts[Math.floor(Math.random() * prompts.length)];
}

// ============================================================================
// RE-EXPORTS FROM AI-DIALOGUE-ADDONS (for backwards compatibility)
// These can be moved into this file later
// ============================================================================

export {
  getDealerPlayerLine,
  DEALER_PLAYER_CONVERSATIONS,
  type DealerPlayerConversationTemplate,
} from "./ai-dialogue-addons";
