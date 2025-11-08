export interface DealerCharacter {
  id: string;
  name: string;
  nickname: string;
  personality: "counter" | "friendly" | "strict" | "oblivious" | "veteran" | "rookie";
  backstory: string;
  bio: string; // Short bio shown to player (doesn't reveal exact detection skill)
  detectionSkill: number; // 0-100: How good they are at spotting counters
  dealSpeed: number; // 0.8-1.5: Multiplier for dealing animation speed (1.0 = normal)
  onYourSide: boolean; // If true, they won't call pit boss even if they know
  avatar?: string;
}

export const DEALER_CHARACTERS: DealerCharacter[] = [
  {
    id: "maria-counter",
    name: "Maria Santos",
    nickname: "Sharp Maria",
    personality: "counter",
    dealSpeed: 1.0,
    detectionSkill: 95,
    onYourSide: true,
    bio: "Former card counter from Atlantic City. She knows every trick in the book and can read players like a newspaper. Has a soft spot for skilled players and might even help you out. Don't worry - she'll never rat you out to management.",
    backstory: "Maria is a former card counter herself who got caught in Atlantic City 10 years ago. Now she deals to pay the bills, but she secretly roots for skilled players. She can spot a counter from a mile away - the bet spreads, the perfect basic strategy, the way their eyes track every card. When she recognizes a skilled counter, she'll give subtle nods of approval and deal at a steady pace to help them. She'll never rat you out to the pit boss, but she might whisper 'bet more on this one' when the count is high.",
  },
  {
    id: "rookie-jenny",
    name: "Jennifer 'Jenny' Park",
    nickname: "Rookie Jenny",
    personality: "rookie",
    dealSpeed: 0.8, // Slow dealer
    detectionSkill: 15,
    onYourSide: false,
    bio: "Brand new dealer, only two months on the job. She's so focused on not making mistakes that she barely notices what players are doing. Deals slowly and methodically. Sweet kid, but completely oblivious to advantage play.",
    backstory: "Jenny just started dealing two months ago and is still figuring everything out. She focuses so hard on not making mistakes that she barely notices what players are doing. She deals slowly and methodically, double-checking every hand total. The pit boss gets frustrated with her pace, but she's trying her best. She has no idea what card counting even looks like - you could bet $10 then $500 and she'd just smile and deal the cards.",
  },
  {
    id: "strict-harold",
    name: "Harold Morrison",
    nickname: "Hardass Harold",
    personality: "strict",
    dealSpeed: 1.3, // Fast dealer
    detectionSkill: 85,
    onYourSide: false,
    bio: "30-year veteran who takes his job VERY seriously. Hates advantage players with a passion and has backed off dozens of counters over the years. Watches bet spreads like a hawk and deals fast to make counting harder. Stay on your toes with this one.",
    backstory: "Harold has been dealing for 30 years and takes his job VERY seriously. He sees card counters as cheaters trying to steal from the casino, and he takes it personally. He's memorized every tell, every betting pattern, every sign of a skilled player. He deals fast to make counting harder and watches bet spreads like a hawk. If he suspects you're counting, he'll immediately call the pit boss over. He's gotten dozens of counters backed off over the years and he's proud of it.",
  },
  {
    id: "friendly-marcus",
    name: "Marcus Thompson",
    nickname: "Friendly Marcus",
    personality: "friendly",
    dealSpeed: 1.1,
    detectionSkill: 40,
    onYourSide: true,
    bio: "Everyone's favorite dealer. Former bartender who's more interested in telling jokes and making people laugh than policing the game. Philosophy: 'If you're smart enough to beat the house, more power to ya!' Chill vibes all around.",
    backstory: "Marcus is everyone's favorite dealer. He's a former bartender who loves chatting with players, telling jokes, and making sure everyone has a good time. He's not particularly observant when it comes to advantage play - he's too busy making people laugh. Even if he did notice someone counting, he probably wouldn't care. 'Hey, if you're smart enough to beat the house, more power to ya!' is his philosophy. He might deal a bit faster when the pit boss is watching just to look professional, but otherwise he's just here for the vibes.",
  },
  {
    id: "oblivious-frank",
    name: "Frank O'Brien",
    nickname: "Oblivious Frank",
    personality: "oblivious",
    dealSpeed: 0.9,
    detectionSkill: 10,
    onYourSide: false,
    bio: "40-year veteran counting down to retirement. Deals on complete autopilot while daydreaming about his fishing boat. Barely makes eye contact and his mind wanders constantly. You could wear a 'I COUNT CARDS' t-shirt and he wouldn't notice.",
    backstory: "Frank is counting down the days to retirement. He's been dealing for 40 years and has completely checked out mentally. He deals on autopilot, barely makes eye contact, and spends most of his time thinking about his fishing boat. He couldn't spot a card counter if they were wearing a t-shirt that said 'I COUNT CARDS.' His mind wanders so much that he sometimes forgets the count on his own hand. The casino keeps him around because he's reliable and shows up on time, but he's not catching anyone.",
  },
  {
    id: "veteran-lisa",
    name: "Lisa Chen",
    nickname: "The Veteran",
    personality: "veteran",
    dealSpeed: 1.2,
    detectionSkill: 70,
    onYourSide: false,
    bio: "25 years of experience, she's seen it all. Knows the math of the game and can usually tell when something's off. Not paranoid like Harold, but she's competent. Only calls pit boss if she's absolutely certain AND you're being obvious. Stay subtle and you'll be fine.",
    backstory: "Lisa has 25 years of experience and has seen it all. She's good at her job, knows the math of the game, and can usually tell when something's off. She watches for betting patterns and strategy deviations, but she's not paranoid about it like Harold. She'll only call the pit boss if she's absolutely certain someone is counting AND they're being obvious about it. If you're subtle and keep your bet spread reasonable, she'll let it slide. She figures the casino makes enough money from the other players anyway.",
  },
];

// Helper to get a random dealer
export function getRandomDealer(excludeIds: string[] = []): DealerCharacter {
  const availableDealers = DEALER_CHARACTERS.filter(
    dealer => !excludeIds.includes(dealer.id)
  );

  if (availableDealers.length === 0) {
    return DEALER_CHARACTERS[Math.floor(Math.random() * DEALER_CHARACTERS.length)];
  }

  return availableDealers[Math.floor(Math.random() * availableDealers.length)];
}

// Helper to determine if dealer notices counting behavior
export function doesDealerNotice(
  dealer: DealerCharacter,
  suspicionLevel: number,
  betSpread: number, // Ratio of max bet to min bet this shoe
  strategyAccuracy: number // % of perfect strategy plays
): boolean {
  // If dealer is on your side, they never report you
  if (dealer.onYourSide) return false;

  // Calculate detection chance based on dealer skill and player behavior
  const baseSuspicion = suspicionLevel / 100; // 0-1
  const betSpreadFactor = Math.min(betSpread / 10, 1); // Spread of 10:1 or more = max
  const strategyFactor = strategyAccuracy / 100; // Perfect strategy = 1.0

  // Weighted detection score
  const detectionScore = (
    baseSuspicion * 0.4 +
    betSpreadFactor * 0.4 +
    strategyFactor * 0.2
  ) * dealer.detectionSkill;

  // Threshold: need 50+ detection score to call pit boss
  return detectionScore >= 50;
}
