import { CharacterDialogue } from "../types";

export const drunkDanny: CharacterDialogue = {
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
  decisionCommentary: {
    shouldHit: [
      "Hit me... what's the worst that happens?",
      "One more card won't hurt... probably",
      "My gut says hit. And my gut's always right!",
      "Dealer's strong... gotta chase it",
      "Hit! Fortune favors the... *hiccup*... brave!",
      "Can't win if I don't hit, right?",
      "Another card please! Living dangerously!",
      "What would my ex-wife do? Opposite of that—hit!",
    ],
    shouldStand: [
      "Standing pat. Don't get greedy, Danny",
      "I'll stay here... safe and sound",
      "Stand! Like a statue... a wobbly statue",
      "Good enough for me! I'm standing",
      "Not touching this hand. Standing!",
      "Better stop while I'm... well, standing",
      "Stand. My lucky number!",
    ],
    confident: [
      "Easy! My lucky hand!",
      "This one's a no-brainer",
      "Clear as day... er, clear as whiskey",
      "I know this one! Hit!",
      "Stand! Even I can't mess this up",
      "Textbook! Hit it!",
    ],
    uncertain: [
      "Oh boy... what do I do here?",
      "Should I hit? Or stand? Or... *hiccup*",
      "This is a tough one...",
      "Dealer's got me worried here",
      "I don't like this hand...",
      "Hmm... what would a sober person do?",
      "Help me out here, cards...",
      "Is this a hit? Feels like a hit... maybe?",
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
    "9": ["Dealer 9—now it's a real fight.", "Nine up? Time to earn my drink."],
    "10": [
      "Dealer 10—assume pain, hope for comedy.",
      "Ten up? I'll need a braver drink.",
    ],
    A: [
      "Dealer Ace—now I'm sober. Briefly.",
      "Ace up? Alright, deal me courage or mercy.",
    ],
  },
};
