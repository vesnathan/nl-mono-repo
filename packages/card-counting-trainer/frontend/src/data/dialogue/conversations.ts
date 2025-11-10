import { ConversationTurn } from "./types";

/**
 * AI-to-AI conversations between specific characters
 * Each conversation is an array of turns tracking which character is speaking
 */
const SUPERSTITIOUS_SUSAN = "superstitious-susan";
const DRUNK_DANNY = "drunk-danny";
const COCKY_KYLE = "cocky-kyle";
const CHATTY_CARLOS = "chatty-carlos";
const NERVOUS_NANCY = "nervous-nancy";
const LUCKY_LARRY = "lucky-larry";
const UNLUCKY_URSULA = "unlucky-ursula";
const CLUMSY_CLAIRE = "clumsy-claire";

export const AI_TO_AI_CONVERSATIONS: ConversationTurn[][] = [
  // Drunk Danny talking about bad luck
  [
    {
      characterId: DRUNK_DANNY,
      text: "You ever have one of those nights where the cards just... *hiccup*... hate you?",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "I know exactly what you mean. Last week I lost my whole paycheck!",
    },
  ],

  // Drunk Danny buying drinks
  [
    {
      characterId: DRUNK_DANNY,
      text: "Bartender! Another round for the table!",
    },
    {
      characterId: CLUMSY_CLAIRE,
      text: "Oh no, I shouldn't... well, maybe just one more.",
    },
  ],
  [
    // Clumsy Claire apologizing
    {
      characterId: CLUMSY_CLAIRE,
      text: "*knocks over chips* Oh my gosh, I'm so sorry!",
    },
    {
      characterId: LUCKY_LARRY,
      text: "Don't worry about it! Happens to everyone.",
    },
  ],
  [
    {
      characterId: CLUMSY_CLAIRE,
      text: "Is this your chip or mine? I can never keep track!",
    },
    {
      characterId: NERVOUS_NANCY,
      text: "That's yours. Mine are the red ones.",
    },
  ],

  // Chatty Carlos networking
  [
    { characterId: NERVOUS_NANCY, text: "I'm a teacher. And you?" },
    {
      characterId: CHATTY_CARLOS,
      text: "I own three car dealerships! Business is BOOMING!",
    },
  ],
  [
    {
      characterId: CHATTY_CARLOS,
      text: "Did you see the game last night?",
    },
    { characterId: LUCKY_LARRY, text: "No, I missed it. Who won?" },
    {
      characterId: CHATTY_CARLOS,
      text: "The home team! Best game of the season!",
    },
  ],

  // Superstitious Susan talking energy
  [
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "The energy at this table feels really good tonight!",
    },
    {
      characterId: COCKY_KYLE,
      text: "You really believe in that stuff?",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "Absolutely! The universe sends signs if you pay attention.",
    },
  ],
  [
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "My crystal is glowing! That means good luck is coming!",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "Whatever works for you, I guess...",
    },
  ],

  // Cocky Kyle showing off
  [
    {
      characterId: CLUMSY_CLAIRE,
      text: "Nice watch. Is that a Rolex?",
    },
    {
      characterId: COCKY_KYLE,
      text: "This? Nah, just a $3,000 Tag Heuer. No big deal.",
    },
    { characterId: CLUMSY_CLAIRE, text: "I have a Timex..." },
  ],
  [
    { characterId: NERVOUS_NANCY, text: "Define 'big'..." },
    {
      characterId: COCKY_KYLE,
      text: "I never bet less than $500 a hand.",
    },
  ],
  [
    // Nervous Nancy worrying
    {
      characterId: NERVOUS_NANCY,
      text: "*whispers* Are those cameras always on?",
    },
    { characterId: COCKY_KYLE, text: "Of course they are. Why?" },
    {
      characterId: NERVOUS_NANCY,
      text: "No reason! Just... asking...",
    },
  ],
  [
    {
      characterId: NERVOUS_NANCY,
      text: "Do you think the dealers can tell when someone is counting?",
    },
    {
      characterId: NERVOUS_NANCY,
      text: "I read about it in a book! Just curious!",
    },
  ],

  // Lucky Larry and his luck
  [
    {
      characterId: LUCKY_LARRY,
      text: "I'm telling you, I can FEEL when I'm gonna win!",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "That's not how probability works...",
    },
    {
      characterId: LUCKY_LARRY,
      text: "Probability? I just won seven hands in a row!",
    },
  ],

  // Unlucky Ursula's bad luck
  [
    {
      characterId: UNLUCKY_URSULA,
      text: "Of course I busted. Why wouldn't I?",
    },
    { characterId: LUCKY_LARRY, text: "Hey, better luck next hand!" },
    {
      characterId: UNLUCKY_URSULA,
      text: "*laughs* You new here? This IS my luck!",
    },
  ],

  // Drunk Danny and Superstitious Susan
  [
    {
      characterId: DRUNK_DANNY,
      text: "My lucky elbow is tingling! Big win coming!",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "YES! I feel it too! The vibrations are strong!",
    },
  ],

  // Cocky Kyle vs Chatty Carlos
  [
    {
      characterId: COCKY_KYLE,
      text: "I made more this morning than most people make in a month.",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "Interesting! What's your secret? I love networking.",
    },
    {
      characterId: COCKY_KYLE,
      text: "Being smarter than everyone else. It's not a secret, it's a fact.",
    },
  ],

  // Clumsy Claire and Nervous Nancy bonding
  [
    {
      characterId: CLUMSY_CLAIRE,
      text: "I'm so nervous I might knock something over!",
    },

    {
      characterId: NERVOUS_NANCY,
      text: "I know the feeling! Are they watching us?",
    },
    {
      characterId: CLUMSY_CLAIRE,
      text: "Oh no, now you've got ME worried!",
    },
  ],
];

/**
 * Helper to get random AI-to-AI conversation that includes only characters currently at the table
 * @param aiPlayers - Array of AI players currently seated at the table
 * @returns A random conversation where all participants are at the table, or null if none available
 */
export function getRandomAIConversation(
  aiPlayers?: Array<{ character: { id: string } }>,
): ConversationTurn[] | null {
  // If no aiPlayers provided, return random conversation (for backward compatibility)
  if (!aiPlayers) {
    return AI_TO_AI_CONVERSATIONS[
      Math.floor(Math.random() * AI_TO_AI_CONVERSATIONS.length)
    ];
  }

  // Get set of character IDs currently at the table
  const seatedCharacterIds = new Set(aiPlayers.map((ai) => ai.character.id));

  // Filter conversations where ALL participants are at the table
  const availableConversations = AI_TO_AI_CONVERSATIONS.filter(
    (conversation) => {
      const participantIds = new Set(
        conversation.map((turn) => turn.characterId),
      );
      // Check if all participants are seated
      return Array.from(participantIds).every((id) =>
        seatedCharacterIds.has(id),
      );
    },
  );

  // Return null if no valid conversations
  if (availableConversations.length === 0) {
    return null;
  }

  // Return random conversation from available ones
  return availableConversations[
    Math.floor(Math.random() * availableConversations.length)
  ];
}
