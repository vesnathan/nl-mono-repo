import { CharacterDialogue } from "../types";

export const superstitiousSusan: CharacterDialogue = {
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
      "Ace and a 2 whispers 'growth.' The aura says one more card.",
      "I'm drawing—my quartz warmed up with this Ace-deuce.",
    ],
    "A,3": [
      "Ace-three has curious energy. I'll invite one more card.",
      "The incense curls right—one more card.",
    ],
    "A,4": [
      "Ace with a 4 hums like a tuning fork—draw.",
      "Cards feel warm—invite another.",
    ],
    "A,5": [
      "Ace-five has restless energy—bring a friend.",
      "The pendulum swung yes—draw.",
    ],
    "A,6": [
      "Ace with a 6 buzzes—if the dealer's strong, I'll invite another.",
      "Crystal says 'just one more.'",
    ],
    "A,7": [
      "Ace-seven glows—stand if the aura is calm.",
      "If the candle flickers, I hit. If not, I stand.",
    ],
    "A,8": [
      "Ace and an 8 radiates peace. Don't touch it.",
      "The aura says 'hands off.'",
    ],
    "A,9": [
      "Ace-nine is sacred. Stand in stillness.",
      "Do not disturb the balance.",
    ],
    "A,10": [
      "Twenty-one is cosmic alignment—receive it.",
      "The universe says 'yes' in neon.",
    ],
  },
  decisionCommentary: {
    shouldHit: [
      "The cards are telling me to hit...",
      "My crystal is warm—that means hit!",
      "Hit... the universe whispers 'one more'",
      "Another card—the energy flows that way",
      "I feel it in my aura—hit!",
      "The signs point to hitting...",
      "Hit! My pendulum swung 'yes'!",
      "One more card... the cosmos guides me...",
    ],
    shouldStand: [
      "Standing... the energy says 'enough'",
      "I'll stay here—my crystal cooled down",
      "Stand! The universe says stop!",
      "The aura is complete—standing",
      "I'm standing... the signs are clear",
      "Stand here. Don't disturb the balance.",
      "Staying put—cosmic alignment achieved!",
    ],
    confident: [
      "Clear message from the universe! Hit!",
      "The cards speak clearly! Stand!",
      "My crystal is glowing—I know this one!",
      "The signs are obvious! Hit!",
      "Stand! The energy is unmistakable!",
      "Easy reading—the cosmos agrees!",
    ],
    uncertain: [
      "The energy is... unclear here...",
      "Should I hit? My crystal isn't saying...",
      "The signs are mixed... what does this mean?",
      "I can't read the aura on this one...",
      "Help me, universe... what do I do?",
      "The cards feel conflicted here...",
      "My pendulum is swinging both ways...",
      "This energy is confusing... let me center myself...",
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
    "5": ["Five crackles—don't disrupt the fall.", "Quiet hands. Gentle air."],
    "6": ["Six shines—do less, receive more.", "Sage the air—let them topple."],
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
};
