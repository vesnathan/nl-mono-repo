import { ConversationTurn } from "./types";

/**
 * AI-to-AI conversations between specific characters
 * Each conversation is an array of turns tracking which character is speaking
 */
export const AI_TO_AI_CONVERSATIONS: ConversationTurn[][] = [
  // Drunk Danny talking about bad luck
  [
    {
      characterId: "drunk-danny",
      text: "You ever have one of those nights where the cards just... *hiccup*... hate you?",
    },
    {
      characterId: "unlucky-ursula",
      text: "I know exactly what you mean. Last week I lost my whole paycheck!",
    },
  ],

  // Drunk Danny buying drinks
  [
    {
      characterId: "drunk-danny",
      text: "Bartender! Another round for the table!",
    },
    {
      characterId: "clumsy-claire",
      text: "Oh no, I shouldn't... well, maybe just one more.",
    },
  ],

  // Clumsy Claire apologizing
  [
    {
      characterId: "clumsy-claire",
      text: "*knocks over chips* Oh my gosh, I'm so sorry!",
    },
    {
      characterId: "lucky-larry",
      text: "Don't worry about it! Happens to everyone.",
    },
  ],
  [
    {
      characterId: "clumsy-claire",
      text: "Is this your chip or mine? I can never keep track!",
    },
    {
      characterId: "nervous-nancy",
      text: "That's yours. Mine are the red ones.",
    },
  ],

  // Chatty Carlos networking
  [
    { characterId: "chatty-carlos", text: "So what do you do for a living?" },
    { characterId: "nervous-nancy", text: "I'm a teacher. And you?" },
    {
      characterId: "chatty-carlos",
      text: "I own three car dealerships! Business is BOOMING!",
    },
  ],
  [
    {
      characterId: "chatty-carlos",
      text: "Did you see the game last night?",
    },
    { characterId: "lucky-larry", text: "No, I missed it. Who won?" },
    {
      characterId: "chatty-carlos",
      text: "The home team! Best game of the season!",
    },
  ],

  // Superstitious Susan talking energy
  [
    {
      characterId: "superstitious-susan",
      text: "The energy at this table feels really good tonight!",
    },
    {
      characterId: "cocky-kyle",
      text: "You really believe in that stuff?",
    },
    {
      characterId: "superstitious-susan",
      text: "Absolutely! The universe sends signs if you pay attention.",
    },
  ],
  [
    {
      characterId: "superstitious-susan",
      text: "My crystal is glowing! That means good luck is coming!",
    },
    {
      characterId: "unlucky-ursula",
      text: "Whatever works for you, I guess...",
    },
  ],

  // Cocky Kyle showing off
  [
    {
      characterId: "clumsy-claire",
      text: "Nice watch. Is that a Rolex?",
    },
    {
      characterId: "cocky-kyle",
      text: "This? Nah, just a $3,000 Tag Heuer. No big deal.",
    },
    { characterId: "clumsy-claire", text: "I have a Timex..." },
  ],
  [
    { characterId: "chatty-carlos", text: "You betting big tonight?" },
    { characterId: "nervous-nancy", text: "Define 'big'..." },
    {
      characterId: "cocky-kyle",
      text: "I never bet less than $500 a hand.",
    },
  ],

  // Nervous Nancy worrying
  [
    {
      characterId: "nervous-nancy",
      text: "*whispers* Are those cameras always on?",
    },
    { characterId: "cocky-kyle", text: "Of course they are. Why?" },
    {
      characterId: "nervous-nancy",
      text: "No reason! Just... asking...",
    },
  ],
  [
    {
      characterId: "nervous-nancy",
      text: "Do you think the dealers can tell when someone is counting?",
    },
    { characterId: "chatty-carlos", text: "Counting? Why would you ask that?" },
    {
      characterId: "nervous-nancy",
      text: "I read about it in a book! Just curious!",
    },
  ],

  // Lucky Larry and his luck
  [
    {
      characterId: "lucky-larry",
      text: "I'm telling you, I can FEEL when I'm gonna win!",
    },
    {
      characterId: "chatty-carlos",
      text: "That's not how probability works...",
    },
    {
      characterId: "lucky-larry",
      text: "Probability? I just won seven hands in a row!",
    },
  ],

  // Unlucky Ursula's bad luck
  [
    {
      characterId: "unlucky-ursula",
      text: "Of course I busted. Why wouldn't I?",
    },
    { characterId: "lucky-larry", text: "Hey, better luck next hand!" },
    {
      characterId: "unlucky-ursula",
      text: "*laughs* You new here? This IS my luck!",
    },
  ],

  // Drunk Danny and Superstitious Susan
  [
    {
      characterId: "drunk-danny",
      text: "My lucky elbow is tingling! Big win coming!",
    },
    {
      characterId: "superstitious-susan",
      text: "YES! I feel it too! The vibrations are strong!",
    },
  ],

  // Cocky Kyle vs Chatty Carlos
  [
    {
      characterId: "cocky-kyle",
      text: "I made more this morning than most people make in a month.",
    },
    {
      characterId: "chatty-carlos",
      text: "Interesting! What's your secret? I love networking.",
    },
    {
      characterId: "cocky-kyle",
      text: "Being smarter than everyone else. It's not a secret, it's a fact.",
    },
  ],

  // Clumsy Claire and Nervous Nancy bonding
  [
    {
      characterId: "clumsy-claire",
      text: "I'm so nervous I might knock something over!",
    },
    {
      characterId: "nervous-nancy",
      text: "I know the feeling! Are they watching us?",
    },
    {
      characterId: "clumsy-claire",
      text: "Oh no, now you've got ME worried!",
    },
  ],
];

/**
 * Helper to get random AI-to-AI conversation
 */
export function getRandomAIConversation(): ConversationTurn[] {
  return AI_TO_AI_CONVERSATIONS[
    Math.floor(Math.random() * AI_TO_AI_CONVERSATIONS.length)
  ];
}
