import { CharacterDialogue } from "../types";

export const chattyCarlos: CharacterDialogue = {
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
    "A,9": ["Soft 20 is premium—zero changes.", "We don't fix perfect—stand."],
    "A,10": [
      "Soft 21 is final form—celebrate responsibly.",
      "Close the deal—tip and smile.",
    ],
  },
  decisionCommentary: {
    shouldHit: [
      "You know what? I think I'll hit. My uncle always said...",
      "Hit! In the car business, you gotta take calculated risks!",
      "Another card—like adding features to a deal!",
      "I'll hit. ROI on this play is solid!",
      "Hit me! You know, in Q4 we always...",
      "One more card—diversifying the portfolio!",
      "Hit! Reminds me of this time I closed three deals...",
      "I'm hitting—gotta maximize value proposition!",
    ],
    shouldStand: [
      "Standing! Smart business is knowing when to stop!",
      "I'll stand here—discipline beats impulse!",
      "Stand. You know what they say about margins...",
      "Staying put! Like a good quarterly report!",
      "Stand! In sales, we call this 'locking in the win'!",
      "I'm standing—protect the brand!",
      "Stand here! That's what I tell my team...",
    ],
    confident: [
      "Easy decision! I know exactly what to do!",
      "Clear as a sales funnel! Hit!",
      "Textbook play! Stand!",
      "This one's obvious—like closing a hot lead!",
      "No-brainer! That's what we call it in the biz!",
      "Crystal clear! The data says...",
    ],
    uncertain: [
      "Hmm... this is like choosing between two good prospects...",
      "Tough call here... let me think about the metrics...",
      "Should I hit? Or stand? Even my CRM can't help here...",
      "This one's tricky... like negotiating with...",
      "Not sure here... what would the sales manual say?",
      "Dealer's got me worried... like end-of-month pressure...",
      "This is a coin flip... like Q4 forecasting...",
      "Tough decision... reminds me of this client who...",
    ],
  },
  dealerUpCardSayings: {
    "2": [
      "Two is a weak opener—exploit, don't overextend.",
      "Press small edges—this is one.",
    ],
    "3": ["Three is soft leverage—work it smart.", "Lean in, but don't lunge."],
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
};
