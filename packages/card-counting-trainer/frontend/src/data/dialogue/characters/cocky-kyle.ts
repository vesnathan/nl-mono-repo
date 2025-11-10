import { CharacterDialogue } from "../types";

export const cockyKyle: CharacterDialogue = {
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
    "A,4": ["Soft 15: still sandbox mode. Hit.", "Hit. We're pre-hero phase."],
    "A,5": [
      "Soft 16? I turn it into highlight reels. Hit.",
      "Hit. We're hunting 18+.",
    ],
    "A,6": ["Soft 17? I upgrade mid-flight. Hit.", "Hit. Winners accelerate."],
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
    "2": ["Dealer 2? I'm already counting chips.", "Time to farm easy money."],
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
};
