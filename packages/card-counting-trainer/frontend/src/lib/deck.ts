import { Card, Rank, Suit } from "@/types/game";
import { CountingSystem } from "@/types/gameSettings";

/**
 * Get the Hi-Lo count value for a given rank
 * Hi-Lo System:
 * - 2-6: +1 (small cards favor dealer)
 * - 7-9: 0 (neutral)
 * - 10-A: -1 (high cards favor player)
 */
export function getHiLoCount(rank: Rank): number {
  if (["2", "3", "4", "5", "6"].includes(rank)) return 1;
  if (["7", "8", "9"].includes(rank)) return 0;
  return -1; // 10, J, Q, K, A
}

/**
 * Get the KO (Knock-Out) count value for a given rank
 * KO System (Unbalanced):
 * - 2-7: +1
 * - 8-9: 0
 * - 10-A: -1
 */
export function getKOCount(rank: Rank): number {
  if (["2", "3", "4", "5", "6", "7"].includes(rank)) return 1;
  if (["8", "9"].includes(rank)) return 0;
  return -1; // 10, J, Q, K, A
}

/**
 * Get the Hi-Opt I count value for a given rank
 * Hi-Opt I System:
 * - 3-6: +1
 * - 2, 7-9, A: 0
 * - 10-K: -1
 */
export function getHiOptICount(rank: Rank): number {
  if (["3", "4", "5", "6"].includes(rank)) return 1;
  if (["2", "7", "8", "9", "A"].includes(rank)) return 0;
  return -1; // 10, J, Q, K
}

/**
 * Get the Hi-Opt II count value for a given rank
 * Hi-Opt II System (Level 2):
 * - 4-5: +2
 * - 2, 3, 6, 7: +1
 * - 8, 9, A: 0
 * - 10-K: -2
 */
export function getHiOptIICount(rank: Rank): number {
  if (["4", "5"].includes(rank)) return 2;
  if (["2", "3", "6", "7"].includes(rank)) return 1;
  if (["8", "9", "A"].includes(rank)) return 0;
  return -2; // 10, J, Q, K
}

/**
 * Get the Omega II count value for a given rank
 * Omega II System (Level 2):
 * - 4, 5, 6: +2
 * - 2, 3, 7: +1
 * - 8, A: 0
 * - 9: -1
 * - 10-K: -2
 */
export function getOmegaIICount(rank: Rank): number {
  if (["4", "5", "6"].includes(rank)) return 2;
  if (["2", "3", "7"].includes(rank)) return 1;
  if (["8", "A"].includes(rank)) return 0;
  if (rank === "9") return -1;
  return -2; // 10, J, Q, K
}

/**
 * Get the count value for a card based on the selected counting system
 */
export function getCountValue(rank: Rank, system: CountingSystem): number {
  switch (system) {
    case CountingSystem.HI_LO:
      return getHiLoCount(rank);
    case CountingSystem.KO:
      return getKOCount(rank);
    case CountingSystem.HI_OPT_I:
      return getHiOptICount(rank);
    case CountingSystem.HI_OPT_II:
      return getHiOptIICount(rank);
    case CountingSystem.OMEGA_II:
      return getOmegaIICount(rank);
    default:
      return getHiLoCount(rank); // Default to Hi-Lo
  }
}

/**
 * Get the blackjack value for a given rank
 * Aces are worth 11 (soft value) by default
 * Hand calculation logic will handle converting to 1 if needed
 */
export function getCardValue(rank: Rank): number {
  if (rank === "A") return 11;
  if (["J", "Q", "K"].includes(rank)) return 10;
  return parseInt(rank, 10);
}

/**
 * Create a single deck of 52 cards
 * @param countingSystem The counting system to use for count values (defaults to Hi-Lo)
 */
export function createDeck(countingSystem: CountingSystem = CountingSystem.HI_LO): Card[] {
  const suits: Suit[] = ["H", "D", "C", "S"];
  const ranks: Rank[] = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        suit,
        rank,
        value: getCardValue(rank),
        count: getCountValue(rank, countingSystem),
      });
    }
  }

  return deck;
}

/**
 * Create a shoe with multiple decks
 * @param numDecks Number of decks (1, 2, 4, 6, or 8)
 * @param countingSystem The counting system to use for count values (defaults to Hi-Lo)
 */
export function createShoe(numDecks: number, countingSystem: CountingSystem = CountingSystem.HI_LO): Card[] {
  const shoe: Card[] = [];

  for (let i = 0; i < numDecks; i++) {
    shoe.push(...createDeck(countingSystem));
  }

  return shoe;
}

/**
 * Fisher-Yates shuffle algorithm
 * @param cards Array of cards to shuffle (mutates in place)
 */
export function shuffleCards(cards: Card[]): Card[] {
  const shuffled = [...cards]; // Create a copy to avoid mutation

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    // Swap cards[i] with cards[j]
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Create and shuffle a new shoe
 * @param numDecks Number of decks (1, 2, 4, 6, or 8)
 * @param countingSystem The counting system to use for count values (defaults to Hi-Lo)
 */
export function createAndShuffleShoe(numDecks: number, countingSystem: CountingSystem = CountingSystem.HI_LO): Card[] {
  const shoe = createShoe(numDecks, countingSystem);
  return shuffleCards(shoe);
}

/**
 * Calculate the cut card position
 * @param numDecks Number of decks in the shoe
 * @param penetration Percentage of cards to deal before shuffle (40-90)
 * @returns Number of cards from the end where cut card is placed
 */
export function calculateCutCardPosition(
  numDecks: number,
  penetration: number,
): number {
  const totalCards = numDecks * 52;
  const cardsToDeal = Math.floor(totalCards * (penetration / 100));
  return totalCards - cardsToDeal;
}

/**
 * Calculate number of decks remaining
 * @param totalCards Total cards in shoe (numDecks * 52)
 * @param cardsDealt Number of cards already dealt
 * @returns Number of decks remaining (for true count calculation)
 */
export function calculateDecksRemaining(
  totalCards: number,
  cardsDealt: number,
): number {
  const cardsRemaining = totalCards - cardsDealt;
  return Math.max(0.5, cardsRemaining / 52); // Minimum 0.5 decks for true count calculation
}

/**
 * Calculate true count from running count
 * True Count = Running Count ÷ Decks Remaining
 * @param runningCount Current running count
 * @param decksRemaining Number of decks remaining
 * @returns True count (rounded down)
 */
export function calculateTrueCount(
  runningCount: number,
  decksRemaining: number,
): number {
  return Math.floor(runningCount / decksRemaining);
}
