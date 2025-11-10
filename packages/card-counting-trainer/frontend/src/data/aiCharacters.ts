export interface AICharacter {
  id: string;
  name: string;
  nickname: string;
  personality:
    | "drunk"
    | "clumsy"
    | "chatty"
    | "superstitious"
    | "cocky"
    | "nervous"
    | "lucky"
    | "unlucky";
  backstory: string;
  distractions: string[]; // Things they might say/do to distract the counter
  skillLevel: number; // 0-70% chance they follow basic strategy correctly
  playSpeed: number; // 0.6-1.5: Multiplier for decision-making speed (1.0 = normal, <1 = slow, >1 = fast)
  avatar?: string; // Path to avatar image (to be added)
}

export const AI_CHARACTERS: AICharacter[] = [
  {
    id: "drunk-danny",
    name: "Danny Martinez",
    nickname: "Drunk Danny",
    personality: "drunk",
    skillLevel: 15, // Terrible player - drunk decisions
    playSpeed: 0.7, // Slow - drunk and confused
    backstory:
      "Danny's a retired longshoreman who spends his pension checks at the casino every Friday night. He's usually three whiskeys deep by the time he sits down, slurring his words and spilling chips. Despite being drunk, he somehow always seems to win just enough to keep coming back.",
    distractions: [
      "Hey barkeep! Another round!",
      "Did I tell you about my ex-wife? She took EVERYTHING...",
      "What was I betting again?",
      "You're a counter aren't ya? I can always tell!",
      "*knocks over chip stack* Oops! My bad buddy!",
      "The room's spinning... is it hot in here?",
      "I once won $10,000 on this very table! Or was it $1,000?",
    ],
  },
  {
    id: "clumsy-claire",
    name: "Claire Thompson",
    nickname: "Clumsy Claire",
    personality: "clumsy",
    skillLevel: 35, // Below average - distracted by her own clumsiness
    playSpeed: 0.8, // Slow - keeps getting distracted
    backstory:
      "Claire's a sweet kindergarten teacher who comes to the casino once a month with her book club friends. She's perpetually knocking things over, dropping chips, and apologizing profusely. Her clumsiness is endearing but incredibly distracting when you're trying to count cards.",
    distractions: [
      "*drops purse spilling contents everywhere* Oh no! I'm so sorry!",
      "*knocks drink over* I am SO sorry! Does anyone have napkins?",
      "Oops! Did I just hit the wrong button?",
      "*bumps into you* Oh my goodness, excuse me!",
      "Is this chip mine or yours? I can never keep track!",
      "*drops phone* Why do I always do this?",
      "Sorry, sorry! I'm such a klutz!",
    ],
  },
  {
    id: "chatty-carlos",
    name: "Carlos Rodriguez",
    nickname: "Chatty Carlos",
    personality: "chatty",
    skillLevel: 50, // Average - knows basics but talks too much to focus
    playSpeed: 0.6, // Very slow - keeps talking between decisions
    backstory:
      "Carlos owns a chain of car dealerships and treats the blackjack table like a networking event. He never stops talking about his deals, his sales numbers, his cars, or his opinions on literally everything. He's successful, loud, and completely oblivious to the fact that nobody wants to hear his life story.",
    distractions: [
      "So I just closed a deal on THREE luxury sedans! Can you believe it?",
      "My son's in medical school now. I'm paying $60K a year!",
      "Let me tell you about interest rates these days...",
      "You look smart! What do you do for a living?",
      "I've been coming here for 15 years. I know ALL the dealers!",
      "The secret to success is simple: work hard, play hard!",
      "Did you see the game last night? UNBELIEVABLE!",
    ],
  },
  {
    id: "superstitious-susan",
    name: "Susan Chen",
    nickname: "Lucky Susan",
    personality: "superstitious",
    skillLevel: 40, // Poor - plays based on "signs" not strategy
    playSpeed: 0.9, // Slow - waits for "signs" before acting
    backstory:
      "Susan's a yoga instructor who believes the universe sends her 'signs' about when to hit or stand. She has a lucky rabbit's foot, a collection of crystals, and refuses to play if someone joins mid-shoe. She wins often enough that other players start to believe in her rituals too.",
    distractions: [
      "Wait! My crystal is telling me this isn't a good shoe.",
      "No, no, no! You can't sit there - that's my lucky seat!",
      "The energy at this table feels OFF today.",
      "Mercury is in retrograde, we should all be careful!",
      "I need to sage this table before we continue.",
      "*touching rabbit's foot* Okay universe, show me a sign!",
      "Did anyone else feel that? The energy just shifted!",
    ],
  },
  {
    id: "cocky-kyle",
    name: "Kyle 'Big K' Morrison",
    nickname: "Big K",
    personality: "cocky",
    skillLevel: 25, // Bad - overconfident and reckless
    playSpeed: 1.5, // Very fast - overconfident quick decisions
    backstory:
      "Kyle's a 28-year-old crypto trader who made millions on Bitcoin and won't let anyone forget it. He wears designer everything, tips big to show off, and acts like he owns every table he sits at. He's actually a terrible player but his bankroll lets him stay in the game longer than he should.",
    distractions: [
      "I made more today than you'll make all year, buddy.",
      "This? Oh it's just a $3,000 watch. No big deal.",
      "I bet more on breakfast than most people bet all night.",
      "*tips dealer $100* Keep the change, sweetheart.",
      "You playing scared money? That's why you'll never win big.",
      "I could buy this casino if I wanted to.",
      "Amateur hour at this table, I see.",
    ],
  },
  {
    id: "nervous-nancy",
    name: "Nancy Park",
    nickname: "Nervous Nancy",
    personality: "nervous",
    skillLevel: 60, // Above average - studied the game but second-guesses herself
    playSpeed: 0.7, // Slow - overthinks every decision
    backstory:
      "Nancy's an accountant who read one book about card counting and thinks she's going to get kicked out any second. She's constantly looking over her shoulder, sweating, and second-guessing every decision. Her anxiety is so palpable it makes everyone else nervous too.",
    distractions: [
      "*whispers* Are they watching us? I think they're watching us!",
      "Is it legal to... never mind, forget I asked!",
      "What if I'm doing this wrong? What if I get banned?",
      "*looking around nervously* Does that camera move?",
      "Should I leave? I feel like I should leave.",
      "My heart is racing. Is this normal?",
      "What happens if security comes over here?",
    ],
  },
  {
    id: "lucky-larry",
    name: "Larry 'Lucky' Goldman",
    nickname: "Lucky Larry",
    personality: "lucky",
    skillLevel: 20, // Terrible - plays on pure gut feeling
    playSpeed: 1.2, // Fast - impulsive gut decisions
    backstory:
      "Larry's a retired plumber who's been on an impossible hot streak for three weeks straight. He doesn't count cards, doesn't know basic strategy, and plays completely on gut feeling - yet he keeps winning. His presence at the table makes other players wonder if luck is more important than skill.",
    distractions: [
      "I'm telling you, I can FEEL when I'm gonna win!",
      "This is my seventh blackjack today! SEVEN!",
      "I never lose on Tuesdays. It's my lucky day!",
      "Should I hit on 17? Last time I did, I got a 4!",
      "*wins again* I don't know how I do it folks!",
      "My wife says I should quit while I'm ahead. But why?",
      "Lightning DOES strike twice! I'm proof!",
    ],
  },
  {
    id: "unlucky-ursula",
    name: "Ursula Kowalski",
    nickname: "Unlucky Ursula",
    personality: "unlucky",
    skillLevel: 55, // Slightly above average - knows strategy but bad luck affects decisions
    playSpeed: 1.0, // Normal speed
    backstory:
      "Ursula's a dental hygienist who has the worst luck imaginable. She gets dealt 16 constantly, busts on 20s, and loses to dealer blackjacks more than should be mathematically possible. Yet she keeps coming back with a smile, cracking jokes about her terrible luck and making everyone feel better about their own losses.",
    distractions: [
      "Of COURSE the dealer has blackjack. Why wouldn't they?",
      "I bust on 12. That's just... that's my life.",
      "Anyone else would've won that hand. Not me though!",
      "I could have a 20 and the dealer would pull a 21.",
      "*laughs* At least I'm consistent! Consistently unlucky!",
      "You think YOUR luck is bad? Let me tell you...",
      "If it wasn't for bad luck, I'd have no luck at all!",
    ],
  },
];

// Helper function to get a random character (excluding already used ones)
export function getRandomCharacter(excludeIds: string[] = []): AICharacter {
  const availableCharacters = AI_CHARACTERS.filter(
    (char) => !excludeIds.includes(char.id),
  );

  if (availableCharacters.length === 0) {
    return AI_CHARACTERS[Math.floor(Math.random() * AI_CHARACTERS.length)];
  }

  return availableCharacters[
    Math.floor(Math.random() * availableCharacters.length)
  ];
}

// Helper function to get a random distraction for a character
// Note: Now re-exports from dialogue where all dialogue is consolidated
export { getRandomDistraction } from "./dialogue";

// Helper function to assign characters to AI positions
export function assignCharactersToPositions(
  positions: number[],
): Map<number, AICharacter> {
  const assignments = new Map<number, AICharacter>();
  const usedCharacterIds: string[] = [];

  positions.forEach((position) => {
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

export function getCharacterById(id: string): AICharacter | undefined {
  return AI_CHARACTERS.find((c) => c.id === id);
}
