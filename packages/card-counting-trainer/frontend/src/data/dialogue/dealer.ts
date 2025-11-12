// ==============================
// Conversations: Players ↔ Dealers
// ==============================

/** Utility to safely pick a random item */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

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
      "Evening folks, let's keep it friendly and fun.",
    ],
    dealerQuestions: [
      "Insurance anyone?",
      // eslint-disable-next-line sonarjs/no-duplicate-string
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
      "Let's keep the table moving, folks.",
      "I'll need to spread that bet in one spot, please.",
      "Try to keep hands visible on the felt.",
      "Eye in the sky says hello.",
      "No phones on the layout, thanks.",
      "Let's not coach other players, please.",
    ],
    exits: [
      "Good luck on your next table.",
      "Color up? I'll get you greens for those reds.",
      "Be right back after the break; new dealer coming in.",
      "Thanks for playing; appreciate the good energy.",
      "Shoes changing—grab a drink if you like.",
      "My relief's here—play nice for them.",
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
      "Do I need to declare 'lucky elbow'?",
      "What time do blackjacks usually arrive?",
      "Can I split… my attention? Kidding. Mostly.",
    ],
    smallTalk: [
      "You deal smoother than my bartender pours.",
      "I've seen you turn disasters into wins—do that again?",
      "My grandkids say I should 'chill'. This is chilling.",
      "What's the bar's best snack for luck?",
      "I beat the house once. Might've been Monopoly.",
      "This chair hugs me. That's a tell.",
    ],
    heatMoments: [
      "Hands on the felt, Danny, not the drink.",
      "Let's keep the chips in one spot, please.",
      "One player to a hand, thanks.",
      "Let's slow the jokes for a second—hit or stand?",
      "No touching the discard, please.",
      "Eyes up here, sir—decision time.",
    ],
    exits: [
      "I'll color up when the room stops whispering.",
      "If I wander off, tell me I was legendary.",
      "I'm off to tip the bartender and my future.",
      "New dealer? I'll toast to that.",
      "I'll cash out before I start telling pirate stories.",
      "Bathroom break—don't let my chair get sober.",
    ],
  },

  "clumsy-claire": {
    id: "clumsy-claire",
    openers: [
      "Hi! I brought napkins—just in case.",
      "I'll try not to knock anything tonight.",
      "Light buy-in—lighter hands.",
    ],
    dealerQuestions: [
      "Cut the deck, Claire?",
      "Want me to square your chips up?",
      // eslint-disable-next-line sonarjs/no-duplicate-string
      "Insurance?",
      // eslint-disable-next-line sonarjs/no-duplicate-string
      "Would you like change for that?",
      // eslint-disable-next-line sonarjs/no-duplicate-string
      "Are you comfortable placing chips closer in?",
      "Need a second to decide?",
    ],
    playerQuestions: [
      "Is it okay if I move this drink back a bit?",
      "Do you mind if I stack in tiny piles?",
      "What's the polite word for 'oops' in casinos?",
      "Could I get a felt wipe if I spill? I hope not!",
      "Do you re-cut if I drop the card? Hypothetically.",
      "Is there a 'clumsy lane' at the table edge?",
    ],
    smallTalk: [
      "You shuffle like a ballet—it's lovely.",
      "I come once a month with friends—book club night.",
      "Do dealers prefer neat stacks? I'm practicing.",
      "What's your favorite lucky story?",
      "Your patience is a superpower.",
      "This table feels friendly. I like that.",
    ],
    heatMoments: [
      "Let's keep beverages off the rail, please.",
      "No touching the cards after your decision, thanks.",
      "We'll need chips in one tidy stack.",
      "Careful with hands near the layout.",
      "Phone away on the layout, please.",
      "Let's keep the game moving—hit or stand?",
    ],
    exits: [
      "I'll color up before gravity finds me again.",
      "Break time—I owe the bar some napkin duty.",
      "New dealer? I'll reorganize while you swap.",
      "Thanks for being kind—I'm learning!",
      "I'll be back. With fewer oopses.",
      "Gonna check on my friends—be right back.",
    ],
  },

  "chatty-carlos": {
    id: "chatty-carlos",
    openers: [
      "Great to see a pro behind the shoe.",
      "Let's make some Q4 magic right here.",
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
      "Is there a 'dealer of the month' board?",
      "What's your favorite twist ending hand?",
    ],
    smallTalk: [
      "I tell my team: trust the process—like shuffles.",
      "You've got showmanship—that matters.",
      "Good tables are communities; this one's growing.",
      "I'll celebrate any player who hits a heater.",
      "I love a fair game—it's good business.",
      "We're all here to leave with a story.",
    ],
    heatMoments: [
      "Let's keep side commentary minimal, please.",
      "Phones off the rail, thanks.",
      "One player to a hand.",
      "Please don't coach decisions.",
      "Keep bets in the circle, sir.",
      "Decision please—hit, stand, double, or split?",
    ],
    exits: [
      "Color up—closing the daily ledger.",
      "New dealer—new KPI.",
      "Break time; I'll network the bar.",
      "I'll be back with a testimonial.",
      "Great dealing—genuinely.",
      "Story secured. See you next shoe.",
    ],
  },

  "superstitious-susan": {
    id: "superstitious-susan",
    openers: [
      "May I bless my chips before we start?",
      "I'll wait for the air to settle… now.",
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
      "Do you mind if my rabbit's foot faces the shoe?",
      "How do you feel about sage—just a mist?",
      "Is today a soft-17 house?",
      "Could we pause one breath before dealing?",
      "Do you mind if I align chips symmetrically?",
      "Any superstition you've seen that actually works?",
    ],
    smallTalk: [
      "Your shuffle rhythm is grounding.",
      "I donate a win portion to animal rescues.",
      "People laugh, but rituals calm the mind.",
      "The shoe's energy changed after that cut.",
      "I once saw a table sing to reverse a slump.",
      "Thank you for holding a kind space.",
    ],
    heatMoments: [
      "Crystals can stay on the rail, not the felt—thanks.",
      "Let's keep the game moving, Susan.",
      "No blowing on the cards, please.",
      "Hands flat on the felt, thank you.",
      "We can't pause every deal—sorry.",
      "Decision time: hit or stand?",
    ],
    exits: [
      "I'll cleanse and return with new energy.",
      "Time to ground—be right back.",
      "New dealer—new aura, lovely.",
      "I'll color up with gratitude.",
      "Blessings to this table till I return.",
      "When the wind shifts, I'll be back.",
    ],
  },

  "cocky-kyle": {
    id: "cocky-kyle",
    openers: [
      "Make this cinematic, dealer.",
      "I'm here for the headline hand.",
      "Buy-in: let's make it photogenic.",
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
      "What's the record win at this table?",
      "You ever deal five blackjacks in a row?",
      "Policy on sunglasses at night? For…the brand.",
      "Are side bets worth the spectacle?",
      "How many decks? I'm optimizing my clip.",
      "Do you call hot streaks 'content moments'?",
    ],
    smallTalk: [
      "You've got dealer swagger—I respect it.",
      "If I hit a heater, I'll tip like a hurricane.",
      "This pit feels premium.",
      "We should name this shoe 'Viral'.",
      "I collect wins and reactions.",
      "You run the cleanest game I've seen.",
    ],
    heatMoments: [
      "Eyes on the layout, please.",
      "Cool the commentary a bit, sir.",
      "One hand per player.",
      "Let's not touch the discard tray.",
      "Decision now, please.",
      "Keep it respectful—thank you.",
    ],
    exits: [
      "Color up; I've got a meet-and-greet with destiny.",
      "New dealer? New content arc.",
      "Break. I'll autograph a chip out there.",
      "I'll be back when the soundtrack swells.",
      "You were solid—respect.",
      "Off to spread the legend.",
    ],
  },

  "nervous-nancy": {
    id: "nervous-nancy",
    openers: [
      "Hi—small buy-in—quiet seat, please.",
      "End spot if possible—thank you.",
      "I'm friendly, just… jumpy.",
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
      "How strict are phone rules? I'll put it away!",
      "What's the table etiquette for questions?",
      "Is it okay if I take one deep breath first?",
      "How long is a shoe usually?",
    ],
    smallTalk: [
      "You're very calm—that helps me.",
      "I read one book; it made me more nervous.",
      "I'm here to have fun. Quietly.",
      "I like when people cheer… softly.",
      "Thanks for explaining with patience.",
      "Nice table energy tonight.",
    ],
    heatMoments: [
      "Hands flat on the felt, please.",
      "Let's keep the decisions moving.",
      "No signaling other players, thanks.",
      "Phones off the rail.",
      "Take your time, but we do need a decision.",
      "Stay seated during the deal, please.",
    ],
    exits: [
      "I'll color up and exhale outside.",
      "Break—my heart needs tea.",
      "New dealer—okay, new start.",
      "Thank you for being kind to me.",
      "I'll be back when my hands stop shaking.",
      "Appreciate the table—truly.",
    ],
  },

  "lucky-larry": {
    id: "lucky-larry",
    openers: [
      "Dealer! The streak followed me in.",
      "Make a note—today's a heater.",
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
      "Can I name this shoe 'Larry's Lane'?",
    ],
    smallTalk: [
      "Your deal has a rhythm—luck loves rhythm.",
      "I tip in streak energy and chips.",
      "I promise to share the glow.",
      "This shoe has good bones.",
      "Let the heater feed the whole table.",
      "I'm allergic to cold streaks—achoo!",
    ],
    heatMoments: [
      "Keep the celebration modest, please.",
      "Hands on the felt during the deal.",
      "No tapping the shoe, thanks.",
      "Let's not coach outcomes.",
      "We'll keep it fair and fun.",
      "Decision, please.",
    ],
    exits: [
      "Color up while the aura's high.",
      "Break—luck's grabbing a coffee.",
      "New dealer—new chapter.",
      "I'll be back before the streak cools.",
      "Thanks for riding the wave, dealer.",
      "Cashing and dashing—politely.",
    ],
  },

  "unlucky-ursula": {
    id: "unlucky-ursula",
    openers: [
      "Hello doom, my old friend—deal me in.",
      "I'm here to lower the average.",
      "Buy-in with optimism I can't afford.",
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
      "What's the statistically least cursed chair?",
      "Do you name ten runs or just endure them?",
      "Are side bets luckier for the unlucky?",
      "Can I borrow the house's optimism?",
      "If I win once, do we ring a bell?",
    ],
    smallTalk: [
      "If I push, I celebrate.",
      "You deal fair—my luck is the villain.",
      "I keep coming back; I'm charming like that.",
      "This table deserves better outcomes—watch me try.",
      "I tip with gallows humor.",
      "If I win, I'll frame the chip.",
    ],
    heatMoments: [
      "Let's keep comments light, please.",
      "Try not to touch your cards after the decision.",
      "No table slaps, thanks.",
      "Phones off the layout.",
      "Decision time—let's keep it moving.",
      "We're all good—just a reminder on etiquette.",
    ],
    exits: [
      "I'll color up before fate gets bored.",
      "Break time—recalibrating expectations.",
      "New dealer—maybe new destiny.",
      "Thanks for the fair dealing.",
      "I'll be back; doom loves a sequel.",
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
