export interface AICharacter {
  id: string;
  name: string;
  nickname: string;
  personality: "drunk" | "clumsy" | "chatty" | "superstitious" | "cocky" | "nervous" | "lucky" | "unlucky";
  backstory: string;
  distractions: string[]; // Things they might say/do to distract the counter
  skillLevel: number; // 0-70% chance they follow basic strategy correctly
  avatar?: string; // Path to avatar image (to be added)
  reactions: {
    bigWin: string[]; // Blackjack or big hand
    smallWin: string[]; // Regular win
    push: string[]; // Tie
    smallLoss: string[]; // Regular loss
    bigLoss: string[]; // Bust or dealer blackjack
  };
}

export const AI_CHARACTERS: AICharacter[] = [
  {
    id: "drunk-danny",
    name: "Danny Martinez",
    nickname: "Drunk Danny",
    personality: "drunk",
    skillLevel: 15, // Terrible player - drunk decisions
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
        "BLACKJACK BABY! *hiccup* Drinks are on me!",
        "I TOLD YOU! I got the magic touch tonight!",
        "Twenty-one! *slams table* THIS is how you do it!"
      ],
      smallWin: [
        "Haha! Still got it! *hiccup*",
        "Not too shabby for a drunk old man, huh?",
        "I'll drink to that! Another win!"
      ],
      push: [
        "Tie? Shit, I'll take it I guess...",
        "*squints at cards* Wait... is that good or bad?",
        "Eh, at least I didn't lose!"
      ],
      smallLoss: [
        "Ah hell... where'd my chips go?",
        "Son of a... *hiccup* ...I had that!",
        "Dammit. Dealer got lucky that time."
      ],
      bigLoss: [
        "BUSTED! Story of my damn life!",
        "Fuck! How did I... *looks at cards confused*",
        "Well THAT was stupid. Bartender! Another round!"
      ]
    }
  },
  {
    id: "clumsy-claire",
    name: "Claire Thompson",
    nickname: "Clumsy Claire",
    personality: "clumsy",
    skillLevel: 35, // Below average - distracted by her own clumsiness
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
        "OH MY GOSH! I WON! *knocks over chips* Oops!",
        "Blackjack?! Did I really get blackjack?!",
        "I can't believe it! *spills drink in excitement*"
      ],
      smallWin: [
        "Oh! I won? That's wonderful!",
        "Yay! *accidentally bumps table*",
        "I did it! Without messing up this time!"
      ],
      push: [
        "A tie? Is that okay? Did I do something wrong?",
        "Oh... so nobody wins? Interesting!",
        "Well, at least I didn't lose!"
      ],
      smallLoss: [
        "Oh no... I thought I had that...",
        "*sighs* I really need to focus better.",
        "Darn it! Sorry, sorry everyone!"
      ],
      bigLoss: [
        "Busted?! Oh shoot! *drops cards*",
        "No no no! How did that happen?!",
        "Ugh! I'm so bad at this! *knocks over chip stack*"
      ]
    }
  },
  {
    id: "chatty-carlos",
    name: "Carlos Rodriguez",
    nickname: "Chatty Carlos",
    personality: "chatty",
    skillLevel: 50, // Average - knows basics but talks too much to focus
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
        "BLACKJACK! That's how it's DONE! Let me tell you about the time I won $5000!",
        "Twenty-one baby! This reminds me of my biggest sale!",
        "Oh YEAH! Now THIS is what I'm talking about!"
      ],
      smallWin: [
        "Nice! Reminds me of this deal I closed last week...",
        "That's what I'm talking about! Hard work pays off!",
        "See? You play smart, you win smart! Like in business!"
      ],
      push: [
        "Tie? Well, not losing is still winning in my book!",
        "Hey, at least we didn't lose! That's what I tell my salesmen!",
        "Push? Interesting. Did I ever tell you about..."
      ],
      smallLoss: [
        "Eh, you win some you lose some. Like my Q3 numbers!",
        "Dealer got lucky. Happens in business too!",
        "Well shit. Can't win 'em all I suppose."
      ],
      bigLoss: [
        "BUSTED! Dammit! That's like losing a $50k sale!",
        "Oh come ON! The dealer always wins when it counts!",
        "Fuck! Okay okay, I'm not tilting. Deep breaths..."
      ]
    }
  },
  {
    id: "superstitious-susan",
    name: "Susan Chen",
    nickname: "Lucky Susan",
    personality: "superstitious",
    skillLevel: 40, // Poor - plays based on "signs" not strategy
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
        "BLACKJACK! The universe REWARDS those who align with positive energy!",
        "I KNEW IT! My rose quartz was glowing! The signs were all there!",
        "Twenty-one! *clutches crystals* The cosmic energy is PERFECT tonight!"
      ],
      smallWin: [
        "Yes! My rabbit's foot never lies!",
        "The energy is flowing my way! I can feel it!",
        "See? When you trust the universe, good things happen!"
      ],
      push: [
        "A tie... the universe is telling me to be patient.",
        "Interesting. The cosmic balance is maintaining equilibrium.",
        "Neither win nor loss... the energy is neutral here."
      ],
      smallLoss: [
        "Hmm... my aura must be slightly off today.",
        "The cards were clouded... I should have cleansed my crystals first.",
        "Not aligned with the universe on that hand."
      ],
      bigLoss: [
        "BUSTED! Mercury retrograde strikes again! I KNEW I should've stayed home!",
        "This table has bad energy! Someone walked through my aura!",
        "Fuck! The universe is testing me... I need to realign my chakras!"
      ]
    }
  },
  {
    id: "cocky-kyle",
    name: "Kyle 'Big K' Morrison",
    nickname: "Big K",
    personality: "cocky",
    skillLevel: 25, // Bad - overconfident and reckless
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
        "BLACKJACK BABY! *throws $500 chip to dealer* That's how the BIG players do it!",
        "Twenty-one! Too easy! I make this much in my SLEEP!",
        "Oh YEAH! This is what happens when you bet BIG! You amateurs taking notes?"
      ],
      smallWin: [
        "Money in the bank! Like I needed MORE though!",
        "Easiest win of my life. That's $2000 I'll never miss.",
        "Told you! Big K doesn't lose! *adjusts designer sunglasses*"
      ],
      push: [
        "A push? Whatever. I wipe my ass with this bet amount.",
        "Tie? Fine. At least none of you peasants beat me.",
        "Meh. Break even. I make more than this in interest every hour."
      ],
      smallLoss: [
        "Dealer got lucky. Doesn't matter, I'll make it back in one hand.",
        "Eh, pocket change. I lose more in my couch cushions.",
        "Whatever. That's like 0.001% of my portfolio."
      ],
      bigLoss: [
        "BUSTED?! How the FUCK?! This dealer is clearly rigging it!",
        "Oh come on! I've lost more on a bad NFT trade but still!",
        "Fuck this! *throws chips* You know what? I don't even care! Dealer! Double my bet!"
      ]
    }
  },
  {
    id: "nervous-nancy",
    name: "Nancy Park",
    nickname: "Nervous Nancy",
    personality: "nervous",
    skillLevel: 60, // Above average - studied the game but second-guesses herself
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
        "Blackjack?! Oh god, oh god! *looks around nervously* Is this suspicious? Am I being too lucky?!",
        "I WON?! Wait, did I win legally? I didn't do anything wrong, right?!",
        "Twenty-one! *sweating* Why is everyone looking at me? Do they think I'm cheating?!"
      ],
      smallWin: [
        "I won! *glances at cameras* But not TOO much, right? That's okay?",
        "Oh thank goodness! A small win. Not suspicious at all!",
        "Yes! *nervous laugh* I mean... is this normal? Am I winning too often?"
      ],
      push: [
        "A tie? Is that... is that legal? Of course it is, why wouldn't it be?",
        "Oh good. Nobody won. Nobody lost. I'm safe. We're all safe.",
        "Push... *breathes* Okay. That's fine. That's totally normal and fine."
      ],
      smallLoss: [
        "I lost. That's... actually that's good! Now they won't suspect me!",
        "Damn it. But also... *nervous relief* ...at least I'm not winning TOO much.",
        "Well, there goes that hand. *looking around* See? I'm losing! I'm not counting!"
      ],
      bigLoss: [
        "BUSTED! Oh no! *panicking* Wait, is it bad that I busted? Do they think I'm bad at this?!",
        "Fuck! No wait, sorry! *to dealer* I didn't mean to swear! Please don't call security!",
        "I KNEW I should've stood! *sweating profusely* Why do I second-guess everything?!"
      ]
    }
  },
  {
    id: "lucky-larry",
    name: "Larry 'Lucky' Goldman",
    nickname: "Lucky Larry",
    personality: "lucky",
    skillLevel: 20, // Terrible - plays on pure gut feeling
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
        "BLACKJACK AGAIN?! I called it! I FELT it in my bones! My lucky streak continues!",
        "Twenty-one! I don't even know HOW I keep doing this! It's like magic!",
        "YES! My gut said 'this is the one Larry' and my gut is NEVER wrong!"
      ],
      smallWin: [
        "Another win! Folks, I'm telling you, it's all about the FEELING!",
        "Ha! I knew I'd win that one! Don't ask me how, I just KNEW!",
        "That's what I'm talking about! Lucky Larry strikes again!"
      ],
      push: [
        "A tie? Hmm... my gut didn't say anything about THIS!",
        "Well, at least I didn't lose! Still lucky in my book!",
        "Push? Interesting! My lucky streak took a little break there!"
      ],
      smallLoss: [
        "Aw man! My first loss in... what, twenty minutes?",
        "Lost that one. But you know what? I FEEL a big win coming!",
        "Eh, you can't win 'em all! Wait, yes I can! Watch this next hand!"
      ],
      bigLoss: [
        "BUSTED?! That's... that's the first time in HOURS! What the hell?!",
        "No way! My gut was WRONG?! That never happens!",
        "Well shit! Even a lucky man loses sometimes! But just you wait!"
      ]
    }
  },
  {
    id: "unlucky-ursula",
    name: "Ursula Kowalski",
    nickname: "Unlucky Ursula",
    personality: "unlucky",
    skillLevel: 55, // Slightly above average - knows strategy but bad luck affects decisions
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
        "BLACKJACK?! Did I... did I actually GET a blackjack?! Is this real life?!",
        "Wait, I WON?! Twenty-one?! Someone check the cards, this can't be right!",
        "Holy shit! I got blackjack! *laughs* Quick! Someone take a picture before my luck runs out!"
      ],
      smallWin: [
        "I won? I actually won?! *checks cards twice* Nobody switched these?",
        "A win! For ME! Mark this day on the calendar folks!",
        "Well I'll be damned! Unlucky Ursula wins one! Hell must've frozen over!"
      ],
      push: [
        "A tie. Of course. Not lucky enough to win, not unlucky enough to lose. Story of my life!",
        "*laughs* A push? That's almost like winning for me!",
        "Tie? I'll take it! At least I didn't lose for once!"
      ],
      smallLoss: [
        "And there it is. Back to normal! *laughs*",
        "Ah well, that brief moment of hope was nice while it lasted!",
        "Lost. Yep. The universe is balanced again!"
      ],
      bigLoss: [
        "BUSTED! *laughs* Of COURSE I busted! You could've bet your house on it!",
        "There we go! NOW it feels right! I was worried I was turning lucky there!",
        "Fuck! Busted AGAIN! You know what? At this point it's almost impressive!"
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

// Helper function to get a character's reaction based on outcome
export function getCharacterReaction(
  character: AICharacter,
  outcome: "bigWin" | "smallWin" | "push" | "smallLoss" | "bigLoss"
): string {
  const reactions = character.reactions[outcome];
  return reactions[Math.floor(Math.random() * reactions.length)];
}
