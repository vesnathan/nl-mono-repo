import { AICharacter } from "./aiCharacters";

export interface Conversation {
  speaker: string; // character ID or "player"
  message: string;
  requiresPlayerResponse?: boolean; // If true, player must acknowledge
  targetPlayer?: boolean; // If true, directed at the player
}

// Conversations between AI characters (no player response needed)
export const AI_TO_AI_CONVERSATIONS: string[][] = [
  // Drunk Danny to anyone
  [
    "You ever have one of those nights where the cards just... *hiccup*... hate you?",
    "I know exactly what you mean. Last week I lost my whole paycheck!",
  ],
  [
    "Bartender! Another round for the table!",
    "Oh no, I shouldn't... well, maybe just one more.",
  ],

  // Clumsy Claire interactions
  [
    "*knocks over chips* Oh my gosh, I'm so sorry!",
    "Don't worry about it! Happens to everyone.",
  ],
  [
    "Is this your chip or mine? I can never keep track!",
    "That's yours. Mine are the red ones.",
  ],

  // Chatty Carlos to others
  [
    "So what do you do for a living?",
    "I'm a teacher. And you?",
    "I own three car dealerships! Business is BOOMING!",
  ],
  [
    "Did you see the game last night?",
    "No, I missed it. Who won?",
    "The home team! Best game of the season!",
  ],

  // Superstitious Susan
  [
    "The energy at this table feels really good tonight!",
    "You really believe in that stuff?",
    "Absolutely! The universe sends signs if you pay attention.",
  ],
  [
    "My crystal is glowing! That means good luck is coming!",
    "Whatever works for you, I guess...",
  ],

  // Big K showing off
  [
    "Nice watch. Is that a Rolex?",
    "This? Nah, just a $3,000 Tag Heuer. No big deal.",
    "I have a Timex...",
  ],
  [
    "You betting big tonight?",
    "Define 'big'...",
    "I never bet less than $500 a hand.",
  ],

  // Nervous Nancy
  [
    "*whispers* Are those cameras always on?",
    "Of course they are. Why?",
    "No reason! Just... asking...",
  ],
  [
    "Do you think the dealers can tell when someone is counting?",
    "Counting? Why would you ask that?",
    "I read about it in a book! Just curious!",
  ],

  // Lucky Larry
  [
    "I'm telling you, I can FEEL when I'm gonna win!",
    "That's not how probability works...",
    "Probability? I just won seven hands in a row!",
  ],

  // Unlucky Ursula
  [
    "Of course I busted. Why wouldn't I?",
    "Hey, better luck next hand!",
    "*laughs* You new here? This IS my luck!",
  ],
];

// Questions/comments directed at the player that require a response
export const PLAYER_ENGAGEMENT_PROMPTS: { [characterId: string]: string[] } = {
  "drunk-danny": [
    "Hey buddy, you look familiar! Do I know you from somewhere?",
    "What are you drinking? Let me buy you a round!",
    "You're being awfully quiet over there. Cat got your tongue?",
    "You some kind of pro? You got that serious look about you.",
    "Wanna hear about the time I won $10,000? Or was it $1,000...",
  ],

  "clumsy-claire": [
    "Oh! Excuse me, did I bump you? I'm so sorry!",
    "Can you help me count these chips? I think I dropped some.",
    "Is this seat taken? Oh wait, you're already sitting. Sorry!",
    "Do you come here often? This is my first time at this table!",
  ],

  "chatty-carlos": [
    "So what do YOU do for a living?",
    "You look smart. Ever thought about investing in cars?",
    "Let me guess - you're in tech, right?",
    "You married? Kids? I got three boys myself!",
    "You see that game last night? What did you think?",
  ],

  "superstitious-susan": [
    "What's your zodiac sign? You have Virgo energy.",
    "Can I borrow your good luck? Mine's not working tonight!",
    "Do you feel that? The energy just shifted when you sat down!",
    "You should touch my rabbit's foot. It brings good fortune!",
  ],

  "cocky-kyle": [
    "First time playing blackjack? You look nervous.",
    "How much you betting? I'm at $500 per hand.",
    "You play crypto? Made a million on Bitcoin last year.",
    "Nice shirt. Where'd you get it, Target?",
  ],

  "nervous-nancy": [
    "Do you ever worry they're watching us too closely?",
    "Is it just me or does that dealer seem suspicious?",
    "Have you ever been asked to leave a casino?",
    "You look calm. How do you stay so relaxed?",
  ],

  "lucky-larry": [
    "You feeling lucky tonight? I sure am!",
    "Want to know my secret? I bet based on gut feeling!",
    "I had a dream I'd win big today. You believe in that stuff?",
    "Stick with me, kid. Luck rubs off!",
  ],

  "unlucky-ursula": [
    "You having better luck than me? Everyone is!",
    "Please tell me you're winning. Someone has to be!",
    "What's your secret? I do everything right and still lose!",
    "At least you look like you're having fun. That's something!",
  ],
};

// Player response options (these will be buttons)
export interface ResponseOption {
  text: string;
  suspicionIncrease: number; // How much ignoring adds to suspicion (0-10)
  type: "friendly" | "neutral" | "ignore";
}

export const RESPONSE_OPTIONS: { [type: string]: ResponseOption[] } = {
  standard: [
    { text: "Yeah, absolutely!", suspicionIncrease: 0, type: "friendly" },
    { text: "Uh-huh", suspicionIncrease: 2, type: "neutral" },
    { text: "Not now", suspicionIncrease: 5, type: "neutral" },
    { text: "*Ignore*", suspicionIncrease: 8, type: "ignore" },
  ],

  question: [
    { text: "Tell me more", suspicionIncrease: 0, type: "friendly" },
    { text: "Maybe", suspicionIncrease: 2, type: "neutral" },
    { text: "I don't think so", suspicionIncrease: 3, type: "neutral" },
    { text: "*Ignore*", suspicionIncrease: 8, type: "ignore" },
  ],

  personal: [
    { text: "I'm in tech", suspicionIncrease: 0, type: "friendly" },
    { text: "Just here for fun", suspicionIncrease: 1, type: "friendly" },
    { text: "I'd rather not say", suspicionIncrease: 4, type: "neutral" },
    { text: "*Ignore*", suspicionIncrease: 8, type: "ignore" },
  ],
};

// Pit boss attention thresholds
export const SUSPICION_THRESHOLDS = {
  LOW: 0,      // 0-20: No attention
  MEDIUM: 20,  // 20-40: Dealer starts watching more carefully
  HIGH: 40,    // 40-60: Pit boss notices you
  CRITICAL: 60, // 60+: Pit boss approaches, may ask you to leave
};

// Helper to get random AI-to-AI conversation
export function getRandomAIConversation(): string[] {
  return AI_TO_AI_CONVERSATIONS[
    Math.floor(Math.random() * AI_TO_AI_CONVERSATIONS.length)
  ];
}

// Helper to get random player engagement for a character
export function getPlayerEngagement(characterId: string): string | null {
  const prompts = PLAYER_ENGAGEMENT_PROMPTS[characterId];
  if (!prompts || prompts.length === 0) return null;

  return prompts[Math.floor(Math.random() * prompts.length)];
}

// Helper to determine if conversation should happen this hand
export function shouldTriggerConversation(
  handNumber: number,
  suspicionLevel: number
): boolean {
  // More conversations when suspicion is high (trying to distract the counter)
  const baseChance = 0.3; // 30% chance per hand
  const suspicionBonus = suspicionLevel / 200; // Up to +0.5 at max suspicion
  const totalChance = Math.min(baseChance + suspicionBonus, 0.8);

  return Math.random() < totalChance;
}

// Helper to determine if it should be player-directed
export function shouldTargetPlayer(suspicionLevel: number): boolean {
  // Higher suspicion = more likely to be targeted
  const baseChance = 0.4; // 40% of conversations target player
  const suspicionBonus = suspicionLevel / 100; // Up to +1.0 at max suspicion
  const totalChance = Math.min(baseChance + suspicionBonus, 0.9);

  return Math.random() < totalChance;
}
