export type ReactionContext = "bust" | "dealerWin" | "dealerBlackjack" | "any";

export interface Reaction {
  text: string;
  contexts: ReactionContext[]; // Which situations this reaction applies to
}

export interface AICharacter {
  id: string;
  name: string;
  nickname: string;
  personality: "drunk" | "clumsy" | "chatty" | "superstitious" | "cocky" | "nervous" | "lucky" | "unlucky";
  backstory: string;
  distractions: string[]; // Things they might say/do to distract the counter
  skillLevel: number; // 0-70% chance they follow basic strategy correctly
  playSpeed: number; // 0.6-1.5: Multiplier for decision-making speed (1.0 = normal, <1 = slow, >1 = fast)
  avatar?: string; // Path to avatar image (to be added)
  reactions: {
    bigWin: Reaction[]; // Blackjack or big hand
    smallWin: Reaction[]; // Regular win
    push: Reaction[]; // Tie
    smallLoss: Reaction[]; // Regular loss
    bigLoss: Reaction[]; // Bust or dealer blackjack/win
  };
}

export const AI_CHARACTERS: AICharacter[] = [
  {
    id: "drunk-danny",
    name: "Danny Martinez",
    nickname: "Drunk Danny",
    personality: "drunk",
    skillLevel: 15, // Terrible player - drunk decisions
    playSpeed: 0.7, // Slow - drunk and confused
    backstory: "Danny's a retired longshoreman who spends his pension checks at the casino every Friday night. He's usually three whiskeys deep by the time he sits down, slurring his words and spilling chips. Despite being drunk, he somehow always seems to win just enough to keep coming back.",
    distractions: [
      "Hey barkeep! Another round!",
      "Did I tell you about my ex-wife? She took EVERYTHING...",
      "What was I betting again?",
      "You're a counter aren't ya? I can always tell!",
      "*knocks over chip stack* Oops! My bad buddy!",
      "The room's spinning... is it hot in here?",
      "I once won $10,000 on this very table! Or was it $1,000?",
    ],
    reactions: {
      bigWin: [
        { text: "BLACKJACK BABY! *hiccup* Drinks are on me!", contexts: ["any"] },
        { text: "I TOLD YOU! I got the magic touch tonight!", contexts: ["any"] },
        { text: "Twenty-one! *slams table* THIS is how you do it!", contexts: ["any"] }
      ],
      smallWin: [
        { text: "Haha! Still got it! *hiccup*", contexts: ["any"] },
        { text: "Not too shabby for a drunk old man, huh?", contexts: ["any"] },
        { text: "I'll drink to that! Another win!", contexts: ["any"] }
      ],
      push: [
        { text: "Tie? Shit, I'll take it I guess...", contexts: ["any"] },
        { text: "*squints at cards* Wait... is that good or bad?", contexts: ["any"] },
        { text: "Eh, at least I didn't lose!", contexts: ["any"] }
      ],
      smallLoss: [
        { text: "Ah hell... where'd my chips go?", contexts: ["any"] },
        { text: "Son of a... *hiccup* ...I had that!", contexts: ["any"] },
        { text: "Dammit. Dealer got lucky that time.", contexts: ["dealerWin"] }
      ],
      bigLoss: [
        { text: "BUSTED! Story of my damn life!", contexts: ["bust"] },
        { text: "Fuck! How did I... *looks at cards confused*", contexts: ["bust"] },
        { text: "Well THAT was stupid. Bartender! Another round!", contexts: ["any"] },
        { text: "Dealer blackjack?! This night just gets worse!", contexts: ["dealerBlackjack"] },
        { text: "Of course the dealer pulls 21. OF COURSE!", contexts: ["dealerBlackjack"] }
      ]
    }
  },
  {
    id: "clumsy-claire",
    name: "Claire Thompson",
    nickname: "Clumsy Claire",
    personality: "clumsy",
    skillLevel: 35, // Below average - distracted by her own clumsiness
    playSpeed: 0.8, // Slow - keeps getting distracted
    backstory: "Claire's a sweet kindergarten teacher who comes to the casino once a month with her book club friends. She's perpetually knocking things over, dropping chips, and apologizing profusely. Her clumsiness is endearing but incredibly distracting when you're trying to count cards.",
    distractions: [
      "*drops purse spilling contents everywhere* Oh no! I'm so sorry!",
      "*knocks drink over* I am SO sorry! Does anyone have napkins?",
      "Oops! Did I just hit the wrong button?",
      "*bumps into you* Oh my goodness, excuse me!",
      "Is this chip mine or yours? I can never keep track!",
      "*drops phone* Why do I always do this?",
      "Sorry, sorry! I'm such a klutz!",
    ],
    reactions: {
      bigWin: [
        { text: "OH MY GOSH! I WON! *knocks over chips* Oops!", contexts: ["any"] },
        { text: "Blackjack?! Did I really get blackjack?!", contexts: ["any"] },
        { text: "I can't believe it! *spills drink in excitement*", contexts: ["any"] }
      ],
      smallWin: [
        { text: "Oh! I won? That's wonderful!", contexts: ["any"] },
        { text: "Yay! *accidentally bumps table*", contexts: ["any"] },
        { text: "I did it! Without messing up this time!", contexts: ["any"] }
      ],
      push: [
        { text: "A tie? Is that okay? Did I do something wrong?", contexts: ["any"] },
        { text: "Oh... so nobody wins? Interesting!", contexts: ["any"] },
        { text: "Well, at least I didn't lose!", contexts: ["any"] }
      ],
      smallLoss: [
        { text: "Oh no... I thought I had that...", contexts: ["any"] },
        { text: "*sighs* I really need to focus better.", contexts: ["any"] },
        { text: "Darn it! Sorry, sorry everyone!", contexts: ["any"] }
      ],
      bigLoss: [
        { text: "Busted?! Oh shoot! *drops cards*", contexts: ["bust"] },
        { text: "No no no! How did that happen?!", contexts: ["any"] },
        { text: "Ugh! I'm so bad at this! *knocks over chip stack*", contexts: ["any"] },
        { text: "The dealer got blackjack?! Oh my goodness!", contexts: ["dealerBlackjack"] }
      ]
    }
  },
  {
    id: "chatty-carlos",
    name: "Carlos Rodriguez",
    nickname: "Chatty Carlos",
    personality: "chatty",
    skillLevel: 50, // Average - knows basics but talks too much to focus
    playSpeed: 0.6, // Very slow - keeps talking between decisions
    backstory: "Carlos owns a chain of car dealerships and treats the blackjack table like a networking event. He never stops talking about his deals, his sales numbers, his cars, or his opinions on literally everything. He's successful, loud, and completely oblivious to the fact that nobody wants to hear his life story.",
    distractions: [
      "So I just closed a deal on THREE luxury sedans! Can you believe it?",
      "My son's in medical school now. I'm paying $60K a year!",
      "Let me tell you about interest rates these days...",
      "You look smart! What do you do for a living?",
      "I've been coming here for 15 years. I know ALL the dealers!",
      "The secret to success is simple: work hard, play hard!",
      "Did you see the game last night? UNBELIEVABLE!",
    ],
    reactions: {
      bigWin: [
        { text: "BLACKJACK! That's how it's DONE! Let me tell you about the time I won $5000!", contexts: ["any"] },
        { text: "Twenty-one baby! This reminds me of my biggest sale!", contexts: ["any"] },
        { text: "Oh YEAH! Now THIS is what I'm talking about!", contexts: ["any"] }
      ],
      smallWin: [
        { text: "Nice! Reminds me of this deal I closed last week...", contexts: ["any"] },
        { text: "That's what I'm talking about! Hard work pays off!", contexts: ["any"] },
        { text: "See? You play smart, you win smart! Like in business!", contexts: ["any"] }
      ],
      push: [
        { text: "Tie? Well, not losing is still winning in my book!", contexts: ["any"] },
        { text: "Hey, at least we didn't lose! That's what I tell my salesmen!", contexts: ["any"] },
        { text: "Push? Interesting. Did I ever tell you about...", contexts: ["any"] }
      ],
      smallLoss: [
        { text: "Eh, you win some you lose some. Like my Q3 numbers!", contexts: ["any"] },
        { text: "Dealer got lucky. Happens in business too!", contexts: ["dealerWin"] },
        { text: "Well shit. Can't win 'em all I suppose.", contexts: ["any"] }
      ],
      bigLoss: [
        { text: "BUSTED! Dammit! That's like losing a $50k sale!", contexts: ["bust"] },
        { text: "Oh come ON! The dealer always wins when it counts!", contexts: ["dealerWin", "dealerBlackjack"] },
        { text: "Fuck! Okay okay, I'm not tilting. Deep breaths...", contexts: ["any"] }
      ]
    }
  },
  {
    id: "superstitious-susan",
    name: "Susan Chen",
    nickname: "Lucky Susan",
    personality: "superstitious",
    skillLevel: 40, // Poor - plays based on "signs" not strategy
    playSpeed: 0.9, // Slow - waits for "signs" before acting
    backstory: "Susan's a yoga instructor who believes the universe sends her 'signs' about when to hit or stand. She has a lucky rabbit's foot, a collection of crystals, and refuses to play if someone joins mid-shoe. She wins often enough that other players start to believe in her rituals too.",
    distractions: [
      "Wait! My crystal is telling me this isn't a good shoe.",
      "No, no, no! You can't sit there - that's my lucky seat!",
      "The energy at this table feels OFF today.",
      "Mercury is in retrograde, we should all be careful!",
      "I need to sage this table before we continue.",
      "*touching rabbit's foot* Okay universe, show me a sign!",
      "Did anyone else feel that? The energy just shifted!",
    ],
    reactions: {
      bigWin: [
        { text: "BLACKJACK! The universe REWARDS those who align with positive energy!", contexts: ["any"] },
        { text: "I KNEW IT! My rose quartz was glowing! The signs were all there!", contexts: ["any"] },
        { text: "Twenty-one! *clutches crystals* The cosmic energy is PERFECT tonight!", contexts: ["any"] }
      ],
      smallWin: [
        { text: "Yes! My rabbit's foot never lies!", contexts: ["any"] },
        { text: "The energy is flowing my way! I can feel it!", contexts: ["any"] },
        { text: "See? When you trust the universe, good things happen!", contexts: ["any"] }
      ],
      push: [
        { text: "A tie... the universe is telling me to be patient.", contexts: ["any"] },
        { text: "Interesting. The cosmic balance is maintaining equilibrium.", contexts: ["any"] },
        { text: "Neither win nor loss... the energy is neutral here.", contexts: ["any"] }
      ],
      smallLoss: [
        { text: "Hmm... my aura must be slightly off today.", contexts: ["any"] },
        { text: "The cards were clouded... I should have cleansed my crystals first.", contexts: ["dealerWin"] },
        { text: "Not aligned with the universe on that hand.", contexts: ["any"] }
      ],
      bigLoss: [
        { text: "BUSTED! Mercury retrograde strikes again! I KNEW I should've stayed home!", contexts: ["bust"] },
        { text: "This table has bad energy! Someone walked through my aura!", contexts: ["any"] },
        { text: "Fuck! The universe is testing me... I need to realign my chakras!", contexts: ["bust"] },
        { text: "The dealer pulled blackjack?! The cosmic signs betrayed me!", contexts: ["dealerBlackjack"] }
      ]
    }
  },
  {
    id: "cocky-kyle",
    name: "Kyle 'Big K' Morrison",
    nickname: "Big K",
    personality: "cocky",
    skillLevel: 25, // Bad - overconfident and reckless
    playSpeed: 1.5, // Very fast - overconfident quick decisions
    backstory: "Kyle's a 28-year-old crypto trader who made millions on Bitcoin and won't let anyone forget it. He wears designer everything, tips big to show off, and acts like he owns every table he sits at. He's actually a terrible player but his bankroll lets him stay in the game longer than he should.",
    distractions: [
      "I made more today than you'll make all year, buddy.",
      "This? Oh it's just a $3,000 watch. No big deal.",
      "I bet more on breakfast than most people bet all night.",
      "*tips dealer $100* Keep the change, sweetheart.",
      "You playing scared money? That's why you'll never win big.",
      "I could buy this casino if I wanted to.",
      "Amateur hour at this table, I see.",
    ],
    reactions: {
      bigWin: [
        { text: "BLACKJACK BABY! *throws $500 chip to dealer* That's how the BIG players do it!", contexts: ["any"] },
        { text: "Twenty-one! Too easy! I make this much in my SLEEP!", contexts: ["any"] },
        { text: "Oh YEAH! This is what happens when you bet BIG! You amateurs taking notes?", contexts: ["any"] }
      ],
      smallWin: [
        { text: "Money in the bank! Like I needed MORE though!", contexts: ["any"] },
        { text: "Easiest win of my life. That's $2000 I'll never miss.", contexts: ["any"] },
        { text: "Told you! Big K doesn't lose! *adjusts designer sunglasses*", contexts: ["any"] }
      ],
      push: [
        { text: "A push? Whatever. I wipe my ass with this bet amount.", contexts: ["any"] },
        { text: "Tie? Fine. At least none of you peasants beat me.", contexts: ["any"] },
        { text: "Meh. Break even. I make more than this in interest every hour.", contexts: ["any"] }
      ],
      smallLoss: [
        { text: "Dealer got lucky. Doesn't matter, I'll make it back in one hand.", contexts: ["dealerWin"] },
        { text: "Eh, pocket change. I lose more in my couch cushions.", contexts: ["any"] },
        { text: "Whatever. That's like 0.001% of my portfolio.", contexts: ["any"] }
      ],
      bigLoss: [
        { text: "BUSTED?! How the FUCK?! This dealer is clearly rigging it!", contexts: ["bust"] },
        { text: "Oh come on! I've lost more on a bad NFT trade but still!", contexts: ["any"] },
        { text: "Fuck this! *throws chips* You know what? I don't even care! Dealer! Double my bet!", contexts: ["bust"] },
        { text: "Dealer blackjack?! RIGGED! This whole casino is RIGGED!", contexts: ["dealerBlackjack"] }
      ]
    }
  },
  {
    id: "nervous-nancy",
    name: "Nancy Park",
    nickname: "Nervous Nancy",
    personality: "nervous",
    skillLevel: 60, // Above average - studied the game but second-guesses herself
    playSpeed: 0.7, // Slow - overthinks every decision
    backstory: "Nancy's an accountant who read one book about card counting and thinks she's going to get kicked out any second. She's constantly looking over her shoulder, sweating, and second-guessing every decision. Her anxiety is so palpable it makes everyone else nervous too.",
    distractions: [
      "*whispers* Are they watching us? I think they're watching us!",
      "Is it legal to... never mind, forget I asked!",
      "What if I'm doing this wrong? What if I get banned?",
      "*looking around nervously* Does that camera move?",
      "Should I leave? I feel like I should leave.",
      "My heart is racing. Is this normal?",
      "What happens if security comes over here?",
    ],
    reactions: {
      bigWin: [
        { text: "Blackjack?! Oh god, oh god! *looks around nervously* Is this suspicious? Am I being too lucky?!", contexts: ["any"] },
        { text: "I WON?! Wait, did I win legally? I didn't do anything wrong, right?!", contexts: ["any"] },
        { text: "Twenty-one! *sweating* Why is everyone looking at me? Do they think I'm cheating?!", contexts: ["any"] }
      ],
      smallWin: [
        { text: "I won! *glances at cameras* But not TOO much, right? That's okay?", contexts: ["any"] },
        { text: "Oh thank goodness! A small win. Not suspicious at all!", contexts: ["any"] },
        { text: "Yes! *nervous laugh* I mean... is this normal? Am I winning too often?", contexts: ["any"] }
      ],
      push: [
        { text: "A tie? Is that... is that legal? Of course it is, why wouldn't it be?", contexts: ["any"] },
        { text: "Oh good. Nobody won. Nobody lost. I'm safe. We're all safe.", contexts: ["any"] },
        { text: "Push... *breathes* Okay. That's fine. That's totally normal and fine.", contexts: ["any"] }
      ],
      smallLoss: [
        { text: "I lost. That's... actually that's good! Now they won't suspect me!", contexts: ["any"] },
        { text: "Damn it. But also... *nervous relief* ...at least I'm not winning TOO much.", contexts: ["dealerWin"] },
        { text: "Well, there goes that hand. *looking around* See? I'm losing! I'm not counting!", contexts: ["any"] }
      ],
      bigLoss: [
        { text: "BUSTED! Oh no! *panicking* Wait, is it bad that I busted? Do they think I'm bad at this?!", contexts: ["bust"] },
        { text: "Fuck! No wait, sorry! *to dealer* I didn't mean to swear! Please don't call security!", contexts: ["any"] },
        { text: "I KNEW I should've stood! *sweating profusely* Why do I second-guess everything?!", contexts: ["bust"] },
        { text: "Dealer blackjack?! *panicking* This looks suspicious doesn't it? Me losing to blackjack?!", contexts: ["dealerBlackjack"] }
      ]
    }
  },
  {
    id: "lucky-larry",
    name: "Larry 'Lucky' Goldman",
    nickname: "Lucky Larry",
    personality: "lucky",
    skillLevel: 20, // Terrible - plays on pure gut feeling
    playSpeed: 1.2, // Fast - impulsive gut decisions
    backstory: "Larry's a retired plumber who's been on an impossible hot streak for three weeks straight. He doesn't count cards, doesn't know basic strategy, and plays completely on gut feeling - yet he keeps winning. His presence at the table makes other players wonder if luck is more important than skill.",
    distractions: [
      "I'm telling you, I can FEEL when I'm gonna win!",
      "This is my seventh blackjack today! SEVEN!",
      "I never lose on Tuesdays. It's my lucky day!",
      "Should I hit on 17? Last time I did, I got a 4!",
      "*wins again* I don't know how I do it folks!",
      "My wife says I should quit while I'm ahead. But why?",
      "Lightning DOES strike twice! I'm proof!",
    ],
    reactions: {
      bigWin: [
        { text: "BLACKJACK AGAIN?! I called it! I FELT it in my bones! My lucky streak continues!", contexts: ["any"] },
        { text: "Twenty-one! I don't even know HOW I keep doing this! It's like magic!", contexts: ["any"] },
        { text: "YES! My gut said 'this is the one Larry' and my gut is NEVER wrong!", contexts: ["any"] }
      ],
      smallWin: [
        { text: "Another win! Folks, I'm telling you, it's all about the FEELING!", contexts: ["any"] },
        { text: "Ha! I knew I'd win that one! Don't ask me how, I just KNEW!", contexts: ["any"] },
        { text: "That's what I'm talking about! Lucky Larry strikes again!", contexts: ["any"] }
      ],
      push: [
        { text: "A tie? Hmm... my gut didn't say anything about THIS!", contexts: ["any"] },
        { text: "Well, at least I didn't lose! Still lucky in my book!", contexts: ["any"] },
        { text: "Push? Interesting! My lucky streak took a little break there!", contexts: ["any"] }
      ],
      smallLoss: [
        { text: "Aw man! My first loss in... what, twenty minutes?", contexts: ["any"] },
        { text: "Lost that one. But you know what? I FEEL a big win coming!", contexts: ["dealerWin"] },
        { text: "Eh, you can't win 'em all! Wait, yes I can! Watch this next hand!", contexts: ["any"] }
      ],
      bigLoss: [
        { text: "BUSTED?! That's... that's the first time in HOURS! What the hell?!", contexts: ["bust"] },
        { text: "No way! My gut was WRONG?! That never happens!", contexts: ["bust"] },
        { text: "Well shit! Even a lucky man loses sometimes! But just you wait!", contexts: ["any"] },
        { text: "Dealer blackjack?! My lucky streak has LIMITS apparently!", contexts: ["dealerBlackjack"] }
      ]
    }
  },
  {
    id: "unlucky-ursula",
    name: "Ursula Kowalski",
    nickname: "Unlucky Ursula",
    personality: "unlucky",
    skillLevel: 55, // Slightly above average - knows strategy but bad luck affects decisions
    playSpeed: 1.0, // Normal speed
    backstory: "Ursula's a dental hygienist who has the worst luck imaginable. She gets dealt 16 constantly, busts on 20s, and loses to dealer blackjacks more than should be mathematically possible. Yet she keeps coming back with a smile, cracking jokes about her terrible luck and making everyone feel better about their own losses.",
    distractions: [
      "Of COURSE the dealer has blackjack. Why wouldn't they?",
      "I bust on 12. That's just... that's my life.",
      "Anyone else would've won that hand. Not me though!",
      "I could have a 20 and the dealer would pull a 21.",
      "*laughs* At least I'm consistent! Consistently unlucky!",
      "You think YOUR luck is bad? Let me tell you...",
      "If it wasn't for bad luck, I'd have no luck at all!",
    ],
    reactions: {
      bigWin: [
        { text: "BLACKJACK?! Did I... did I actually GET a blackjack?! Is this real life?!", contexts: ["any"] },
        { text: "Wait, I WON?! Twenty-one?! Someone check the cards, this can't be right!", contexts: ["any"] },
        { text: "Holy shit! I got blackjack! *laughs* Quick! Someone take a picture before my luck runs out!", contexts: ["any"] }
      ],
      smallWin: [
        { text: "I won? I actually won?! *checks cards twice* Nobody switched these?", contexts: ["any"] },
        { text: "A win! For ME! Mark this day on the calendar folks!", contexts: ["any"] },
        { text: "Well I'll be damned! Unlucky Ursula wins one! Hell must've frozen over!", contexts: ["any"] }
      ],
      push: [
        { text: "A tie. Of course. Not lucky enough to win, not unlucky enough to lose. Story of my life!", contexts: ["any"] },
        { text: "*laughs* A push? That's almost like winning for me!", contexts: ["any"] },
        { text: "Tie? I'll take it! At least I didn't lose for once!", contexts: ["any"] }
      ],
      smallLoss: [
        { text: "And there it is. Back to normal! *laughs*", contexts: ["any"] },
        { text: "Ah well, that brief moment of hope was nice while it lasted!", contexts: ["dealerWin"] },
        { text: "Lost. Yep. The universe is balanced again!", contexts: ["any"] }
      ],
      bigLoss: [
        { text: "BUSTED! *laughs* Of COURSE I busted! You could've bet your house on it!", contexts: ["bust"] },
        { text: "There we go! NOW it feels right! I was worried I was turning lucky there!", contexts: ["bust"] },
        { text: "Fuck! Busted AGAIN! You know what? At this point it's almost impressive!", contexts: ["bust"] },
        { text: "Dealer blackjack. Of COURSE it's blackjack! Why would it be anything else?!", contexts: ["dealerBlackjack"] }
      ]
    }
  },
];

// Helper function to get a random character (excluding already used ones)
export function getRandomCharacter(excludeIds: string[] = []): AICharacter {
  const availableCharacters = AI_CHARACTERS.filter(
    char => !excludeIds.includes(char.id)
  );

  if (availableCharacters.length === 0) {
    return AI_CHARACTERS[Math.floor(Math.random() * AI_CHARACTERS.length)];
  }

  return availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
}

// Helper function to get a random distraction for a character
export function getRandomDistraction(characterId: string): string {
  const character = AI_CHARACTERS.find(char => char.id === characterId);
  if (!character) return "";

  return character.distractions[
    Math.floor(Math.random() * character.distractions.length)
  ];
}

// Helper function to assign characters to AI positions
export function assignCharactersToPositions(positions: number[]): Map<number, AICharacter> {
  const assignments = new Map<number, AICharacter>();
  const usedCharacterIds: string[] = [];

  positions.forEach(position => {
    const character = getRandomCharacter(usedCharacterIds);
    assignments.set(position, character);
    usedCharacterIds.push(character.id);
  });

  return assignments;
}

// Helper to get AI character avatar path
export function getAIAvatarPath(character: AICharacter): string {
  // Map character names to their actual avatar filenames
  const nameMap: Record<string, string> = {
    "Danny Martinez": "Danny-Martinez",
    "Claire Thompson": "Claire-Thompson",
    "Nancy Park": "Nancy-Park",
    "Larry 'Lucky' Goldman": "Larry-Goldman",
    "Kyle 'Big K' Morrison": "Kyle-Morrison",
    "Susan Chen": "Susan-Chen",
    "Carlos Rodriguez": "Carlos-Rodriguez",
    "Ursula Kowalski": "Ursula-Kowalski",
  };

  const filename = nameMap[character.name];
  if (filename) {
    return `/avatars/${filename}.png`;
  }

  // Fallback: use name with spaces replaced by hyphens and quotes removed
  return `/avatars/${character.name.replace(/\s+/g, "-").replace(/['"]/g, "")}.png`;
}

// Helper function to get a character's reaction based on outcome
export function getCharacterReaction(
  character: AICharacter,
  outcome: "bigWin" | "smallWin" | "push" | "smallLoss" | "bigLoss"
): string {
  const reactions = character.reactions[outcome];
  const reaction = reactions[Math.floor(Math.random() * reactions.length)];
  return reaction.text;
}
