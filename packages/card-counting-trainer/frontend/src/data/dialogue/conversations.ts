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

  // Longer conversations with more personality

  // Drunk Danny's wild story
  [
    {
      characterId: DRUNK_DANNY,
      text: "So there I was... *hiccup*... bet everything on red...",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "Wait, red? This is blackjack, not roulette!",
    },
    {
      characterId: DRUNK_DANNY,
      text: "Oh yeah! Blackjack! *laughs* Same thing, right?",
    },
    {
      characterId: LUCKY_LARRY,
      text: "Maybe you should slow down on those drinks, buddy.",
    },
    {
      characterId: DRUNK_DANNY,
      text: "Nah, alcohol makes me BETTER at math! Watch this...",
    },
  ],

  // Superstitious Susan's elaborate ritual
  [
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "Wait! Don't touch the cards yet! Mercury is still in retrograde!",
    },
    {
      characterId: COCKY_KYLE,
      text: "*rolls eyes* Here we go again...",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "I'm serious! Last time someone ignored the signs, they lost $5,000!",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "That was me. And it had nothing to do with Mercury.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "EXACTLY! You didn't listen! The universe was trying to warn you!",
    },
  ],

  // Cocky Kyle bragging session
  [
    {
      characterId: COCKY_KYLE,
      text: "My poker buddies call me 'The Shark' because I eat everyone alive.",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "That's impressive! Do you play professionally?",
    },
    {
      characterId: COCKY_KYLE,
      text: "I could if I wanted to. But I make more money day trading.",
    },
    {
      characterId: NERVOUS_NANCY,
      text: "*whispers* Day trading sounds risky...",
    },
    {
      characterId: COCKY_KYLE,
      text: "Only if you're an amateur. I've got a system.",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "I bet you do. Everyone's got a 'system' until they don't.",
    },
  ],

  // Chatty Carlos networking aggressively
  [
    {
      characterId: CHATTY_CARLOS,
      text: "So what do you all do? I'm always looking to expand my network!",
    },
    {
      characterId: CLUMSY_CLAIRE,
      text: "I'm a waitress at a—*spills water*—oh no!",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "A waitress! Do you work at any upscale restaurants? I know all the owners!",
    },
    {
      characterId: LUCKY_LARRY,
      text: "I'm retired. Won the lottery back in '08.",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "NO WAY! You have to tell me your secret! Do you invest? Real estate?",
    },
    {
      characterId: LUCKY_LARRY,
      text: "Mostly I just play blackjack. *laughs*",
    },
  ],

  // Nervous Nancy's paranoia spreading
  [
    {
      characterId: NERVOUS_NANCY,
      text: "Has anyone noticed the pit boss looking at us weird?",
    },
    {
      characterId: CLUMSY_CLAIRE,
      text: "Oh no, really? I didn't notice... should I be worried?",
    },
    {
      characterId: NERVOUS_NANCY,
      text: "And that guy at the bar... he's been watching for 20 minutes!",
    },
    {
      characterId: DRUNK_DANNY,
      text: "*looks around confused* Which guy? They're all blurry...",
    },
    {
      characterId: CLUMSY_CLAIRE,
      text: "*drops chips* Now I'M paranoid! This is too much pressure!",
    },
  ],

  // Lucky Larry's impossible luck stories
  [
    {
      characterId: LUCKY_LARRY,
      text: "Did I ever tell you about the time I hit blackjack 12 times in a row?",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "That's... mathematically almost impossible.",
    },
    {
      characterId: LUCKY_LARRY,
      text: "I know! The pit boss thought I was cheating! But it's just natural talent.",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "Incredible! You should write a book! I know a publisher!",
    },
    {
      characterId: LUCKY_LARRY,
      text: "A book? Nah, I'd rather just keep winning!",
    },
  ],

  // Unlucky Ursula's misery loves company
  [
    {
      characterId: UNLUCKY_URSULA,
      text: "I once lost 47 hands in a row. They had to check if the deck was broken.",
    },
    {
      characterId: NERVOUS_NANCY,
      text: "That's... that's terrifying. What did you do?",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "Kept playing. What else was I gonna do? Not like my luck's getting better.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "You need to cleanse your aura! I have crystals in my purse!",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "*sighs* Sure. Can't hurt. Nothing else works.",
    },
  ],

  // Clumsy Claire disaster story
  [
    {
      characterId: CLUMSY_CLAIRE,
      text: "Last week I knocked an entire tray of drinks onto a high roller.",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "Oh no! What happened?",
    },
    {
      characterId: CLUMSY_CLAIRE,
      text: "He stood up, cards went flying, chips everywhere... it was chaos!",
    },
    {
      characterId: COCKY_KYLE,
      text: "Let me guess, you got fired?",
    },
    {
      characterId: CLUMSY_CLAIRE,
      text: "No! He felt bad for me and tipped me $500! I couldn't believe it!",
    },
    {
      characterId: LUCKY_LARRY,
      text: "See? Sometimes accidents work out!",
    },
  ],

  // Drunk Danny's confused wisdom
  [
    {
      characterId: DRUNK_DANNY,
      text: "You know what they say... *hiccup*... always split aces and... and...",
    },
    {
      characterId: NERVOUS_NANCY,
      text: "And eights?",
    },
    {
      characterId: DRUNK_DANNY,
      text: "YES! Eights! But also... never split... tens? Or always split tens?",
    },
    {
      characterId: COCKY_KYLE,
      text: "NEVER split tens. That's basic strategy.",
    },
    {
      characterId: DRUNK_DANNY,
      text: "Right, right... unless you FEEL lucky... then always split everything!",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "That explains a lot about your chip stack.",
    },
  ],

  // Mixed group chaos
  [
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "Everyone blow on your cards! It changes the energy!",
    },
    {
      characterId: CLUMSY_CLAIRE,
      text: "*blows too hard* Oh no! My cards flew off the table!",
    },
    {
      characterId: DRUNK_DANNY,
      text: "*tries to help* I got 'em! *knocks over chips*",
    },
    {
      characterId: NERVOUS_NANCY,
      text: "The dealer is staring at us! We're causing a scene!",
    },
    {
      characterId: COCKY_KYLE,
      text: "You people are unbelievable. I'm surrounded by amateurs.",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "Hey, we're all friends here! That's what makes it fun!",
    },
  ],

  // MORE CONVERSATIONS - Personality-driven interactions

  // Susan tries to give everyone crystals
  [
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "I brought healing crystals for everyone! Who wants one?",
    },
    {
      characterId: LUCKY_LARRY,
      text: "Sure! Can't hurt, right? I'll take the lucky one!",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "*sighs* I'll take seven. Maybe if I combine them...",
    },
    {
      characterId: COCKY_KYLE,
      text: "I don't need rocks. I have skill and intelligence.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "That's EXACTLY why you need one! To balance your ego chakra!",
    },
  ],

  // Danny's drinking escalates
  [
    {
      characterId: DRUNK_DANNY,
      text: "*hiccup* Who ordered the flying saucer? There's two dealers!",
    },
    {
      characterId: CLUMSY_CLAIRE,
      text: "Um... there's only one dealer. Are you okay?",
    },
    {
      characterId: DRUNK_DANNY,
      text: "I'm GREAT! Never been better! *knocks over drink*",
    },
    {
      characterId: NERVOUS_NANCY,
      text: "Security is coming over! What do we do?!",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "Don't worry, I know the head of security! We're good!",
    },
    {
      characterId: DRUNK_DANNY,
      text: "Tell him I love him! *hugs Carlos*",
    },
  ],

  // Kyle vs Larry competitive showdown
  [
    {
      characterId: COCKY_KYLE,
      text: "Luck is just probability misunderstood by simple minds.",
    },
    {
      characterId: LUCKY_LARRY,
      text: "Then explain how I won three jackpots last month, genius.",
    },
    {
      characterId: COCKY_KYLE,
      text: "Variance. Pure statistical variance. It'll regress to the mean.",
    },
    {
      characterId: LUCKY_LARRY,
      text: "Been hearing that for 15 years. Still winning!",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "Can I have some of your 'variance'? Mine only goes one way.",
    },
  ],

  // Nancy's counting paranoia
  [
    {
      characterId: NERVOUS_NANCY,
      text: "*whispers* Do you think anyone here is counting cards?",
    },
    {
      characterId: COCKY_KYLE,
      text: "Counting is legal. They can't do anything about it.",
    },
    {
      characterId: NERVOUS_NANCY,
      text: "But they can ban you! What if they think I'M counting?!",
    },
    {
      characterId: DRUNK_DANNY,
      text: "You? Counting? *laughs* I can't even count my fingers!",
    },
    {
      characterId: NERVOUS_NANCY,
      text: "That's not reassuring! What if they think we're a TEAM?!",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "Relax! We're just having fun! Right, everyone?",
    },
  ],

  // Carlos's business pitch goes wrong
  [
    {
      characterId: CHATTY_CARLOS,
      text: "I have a business opportunity! Who wants to invest in crypto?",
    },
    {
      characterId: COCKY_KYLE,
      text: "Crypto is for amateurs. I'm into DeFi protocols.",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "PERFECT! You understand the market! We should partner!",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "I invested in crypto once. Lost it all in a week.",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "That's because you didn't have MY system! Let me explain—",
    },
    {
      characterId: LUCKY_LARRY,
      text: "I'll stick to blackjack, thanks.",
    },
  ],

  // Claire's workplace stories
  [
    {
      characterId: CLUMSY_CLAIRE,
      text: "My boss says one more accident and I'm fired...",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "You need a new job! I'm hiring at my dealerships!",
    },
    {
      characterId: CLUMSY_CLAIRE,
      text: "Really?! That would be amazing! What would I do?",
    },
    {
      characterId: COCKY_KYLE,
      text: "Probably not handle expensive cars...",
    },
    {
      characterId: CLUMSY_CLAIRE,
      text: "*drops chips* You're probably right...",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "Nonsense! Everyone deserves a chance! Here's my card!",
    },
  ],

  // Susan's fortune telling session
  [
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "I can read palms! Who wants to know their future?",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "I already know mine. It's bad.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "*grabs Ursula's hand* Oh my... your luck line is VERY blocked!",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "Told you.",
    },
    {
      characterId: LUCKY_LARRY,
      text: "Do mine! Bet it's super lucky!",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "WOW! Your fortune line is GLOWING! Literally!",
    },
    {
      characterId: COCKY_KYLE,
      text: "*rolls eyes* Lines don't glow. That's scientifically impossible.",
    },
  ],

  // Ursula and Nancy commiserate
  [
    {
      characterId: UNLUCKY_URSULA,
      text: "Sometimes I wonder why I even bother playing...",
    },
    {
      characterId: NERVOUS_NANCY,
      text: "Me too! Every time I win, I think 'this is suspicious'.",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "At least you WIN sometimes. I just lose creatively.",
    },
    {
      characterId: DRUNK_DANNY,
      text: "You ladies need shots! Shots fix everything!",
    },
    {
      characterId: NERVOUS_NANCY,
      text: "I shouldn't... alcohol affects judgment...",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "At this point, worse judgment might actually help.",
    },
  ],

  // Danny's 'system' revealed
  [
    {
      characterId: DRUNK_DANNY,
      text: "I got a system! Works every time! *hiccup*",
    },
    {
      characterId: COCKY_KYLE,
      text: "This should be good. What's your 'system'?",
    },
    {
      characterId: DRUNK_DANNY,
      text: "If I'm winning, keep betting! If losing... bet MORE!",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "That's... that's literally the worst strategy possible.",
    },
    {
      characterId: DRUNK_DANNY,
      text: "That's what my ex-wife said! About everything!",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "Well, you're having fun! That's what counts!",
    },
  ],

  // Kyle's origin story
  [
    {
      characterId: CHATTY_CARLOS,
      text: "So Kyle, what got you into gambling?",
    },
    {
      characterId: COCKY_KYLE,
      text: "It's not gambling when you have a statistical edge.",
    },
    {
      characterId: LUCKY_LARRY,
      text: "Come on, everyone's got a story! What's yours?",
    },
    {
      characterId: COCKY_KYLE,
      text: "MIT. Cards. Millions. Next question.",
    },
    {
      characterId: CLUMSY_CLAIRE,
      text: "You went to MIT?! That's incredible!",
    },
    {
      characterId: COCKY_KYLE,
      text: "I said I went there. Didn't say I graduated.",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "There it is.",
    },
  ],

  // Larry's impossible wins continue
  [
    {
      characterId: LUCKY_LARRY,
      text: "Just got a birthday card from the casino! They love me here!",
    },
    {
      characterId: NERVOUS_NANCY,
      text: "They send those to everyone... right?",
    },
    {
      characterId: LUCKY_LARRY,
      text: "Not with a $500 chip inside! Look!",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "I got banned from MY birthday promotion for 'unusual losses'.",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "Larry, you must share your energy! Stand next to Ursula!",
    },
    {
      characterId: LUCKY_LARRY,
      text: "Sure! *moves chairs* Everyone gets good vibes!",
    },
  ],

  // Claire causes a chain reaction
  [
    {
      characterId: CLUMSY_CLAIRE,
      text: "*reaches for chips* Oops! *bumps Danny's drink*",
    },
    {
      characterId: DRUNK_DANNY,
      text: "Whoa! *spills on Nancy*",
    },
    {
      characterId: NERVOUS_NANCY,
      text: "*jumps up* Oh no! *knocks Susan's crystals*",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "MY CRYSTALS! *dives* The energy is ESCAPING!",
    },
    {
      characterId: COCKY_KYLE,
      text: "*standing up* This table is a disaster zone.",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "Group photo! *pulls out phone* This is CONTENT!",
    },
  ],

  // Debate: luck vs skill
  [
    {
      characterId: CHATTY_CARLOS,
      text: "Serious question: is blackjack luck or skill?",
    },
    {
      characterId: COCKY_KYLE,
      text: "Skill. Objectively. Basic strategy reduces house edge to 0.5%.",
    },
    {
      characterId: LUCKY_LARRY,
      text: "Luck! I don't know basic strategy and I'm up $10k!",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "It's ENERGY! The universe decides who wins!",
    },
    {
      characterId: DRUNK_DANNY,
      text: "It's fun! *hiccup* Who cares?",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "For me, it's a character-building exercise in disappointment.",
    },
  ],

  // Susan's ritual gets out of hand
  [
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "Everyone stop! The moon just entered Capricorn!",
    },
    {
      characterId: NERVOUS_NANCY,
      text: "What does that mean?!",
    },
    {
      characterId: SUPERSTITIOUS_SUSAN,
      text: "We must all touch our left ear and spin counterclockwise!",
    },
    {
      characterId: DRUNK_DANNY,
      text: "*spins* Wheee! *falls over*",
    },
    {
      characterId: CLUMSY_CLAIRE,
      text: "*spinning* I'm dizzy! *crashes into Kyle*",
    },
    {
      characterId: COCKY_KYLE,
      text: "This is insanity. I'm requesting a table change.",
    },
  ],

  // Carlos accidentally offends everyone
  [
    {
      characterId: CHATTY_CARLOS,
      text: "You know what's great about this table? Such diverse people!",
    },
    {
      characterId: COCKY_KYLE,
      text: "By diverse you mean 'a spectrum of incompetence'?",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "No! I mean we have winners, learners, believers—",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "And losers. You can say it.",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "NO! I mean, everyone has their own style! Like, uh...",
    },
    {
      characterId: NERVOUS_NANCY,
      text: "Just stop talking. You're making it worse.",
    },
  ],

  // The group forms an unlikely bond
  [
    {
      characterId: LUCKY_LARRY,
      text: "You know what? I actually like this crazy group!",
    },
    {
      characterId: CLUMSY_CLAIRE,
      text: "Really? Even though I keep knocking things over?",
    },
    {
      characterId: LUCKY_LARRY,
      text: "Especially that! Keeps things interesting!",
    },
    {
      characterId: DRUNK_DANNY,
      text: "You guys are the best! *group hug attempt*",
    },
    {
      characterId: COCKY_KYLE,
      text: "*dodges hug* I'm not participating in this.",
    },
    {
      characterId: CHATTY_CARLOS,
      text: "Come on Kyle! Team spirit! We're a blackjack family!",
    },
    {
      characterId: UNLUCKY_URSULA,
      text: "A dysfunctional one, but sure.",
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
