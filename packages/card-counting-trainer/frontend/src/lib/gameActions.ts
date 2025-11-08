import { Card, GameState, Hand, Player } from "@/types/game";
import { createAndShuffleShoe } from "@/lib/deck";

/**
 * Deal a card from the shoe
 * If shoe is empty mid-hand, creates a new shuffled shoe (emergency reshuffle)
 * @param shoe The current shoe
 * @param numDecks Number of decks (required if shoe might be empty, defaults to 6)
 * @returns The dealt card, updated shoe, and whether a reshuffle occurred
 */
export function dealCard(
  shoe: Card[],
  numDecks: number = 6
): {
  card: Card;
  remainingShoe: Card[];
  reshuffled: boolean;
} {
  let currentShoe = shoe;
  let reshuffled = false;

  // Emergency reshuffle if shoe is depleted mid-hand
  if (currentShoe.length === 0) {
    console.warn("⚠️ Emergency reshuffle: Shoe depleted mid-hand! Creating new shoe...");
    currentShoe = createAndShuffleShoe(numDecks);
    reshuffled = true;
  }

  const [card, ...remainingShoe] = currentShoe;
  return { card, remainingShoe, reshuffled };
}

/**
 * Calculate the value of a hand
 * Handles soft/hard Ace values automatically
 * @param cards Array of cards in the hand
 * @returns The best hand value (21 or under if possible)
 */
export function calculateHandValue(cards: Card[]): number {
  let total = 0;
  let aces = 0;

  // First pass: add all values and count aces
  for (const card of cards) {
    total += card.value;
    if (card.rank === "A") {
      aces++;
    }
  }

  // Convert Aces from 11 to 1 if busting
  while (total > 21 && aces > 0) {
    total -= 10; // Convert one Ace from 11 to 1
    aces--;
  }

  return total;
}

/**
 * Check if a hand is a blackjack (Ace + 10-value card)
 * @param cards Array of cards in the hand
 * @returns True if natural blackjack
 */
export function isBlackjack(cards: Card[]): boolean {
  if (cards.length !== 2) return false;

  const hasAce = cards.some((c) => c.rank === "A");
  const hasTen = cards.some((c) => ["10", "J", "Q", "K"].includes(c.rank));

  return hasAce && hasTen;
}

/**
 * Check if a hand is busted (over 21)
 * @param cards Array of cards in the hand
 * @returns True if busted
 */
export function isBusted(cards: Card[]): boolean {
  return calculateHandValue(cards) > 21;
}

/**
 * Check if a hand is soft (has an Ace counted as 11)
 * @param cards Array of cards in the hand
 * @returns True if soft hand
 */
export function isSoftHand(cards: Card[]): boolean {
  let total = 0;
  let hasAce = false;

  for (const card of cards) {
    total += card.value;
    if (card.rank === "A") {
      hasAce = true;
    }
  }

  // If total is <= 21 and has an Ace, it's soft
  return hasAce && total <= 21;
}

/**
 * Check if a hand can be split (two cards of same rank)
 * @param cards Array of cards in the hand
 * @returns True if hand can be split
 */
export function canSplit(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  return cards[0].rank === cards[1].rank;
}

/**
 * Check if a hand can be doubled
 * @param cards Array of cards in the hand
 * @param chips Available chips
 * @param bet Current bet amount
 * @returns True if hand can be doubled
 */
export function canDouble(cards: Card[], chips: number, bet: number): boolean {
  // Can only double on first two cards
  if (cards.length !== 2) return false;

  // Must have enough chips to double the bet
  return chips >= bet;
}

/**
 * Deal initial cards for a new hand
 * Deals 2 cards to each player, then 2 to dealer
 * @param gameState Current game state
 * @param playerIndices Indices of players to deal to
 * @returns Updated game state with dealt cards
 */
export function dealInitialCards(
  gameState: GameState,
  playerIndices: number[]
): GameState {
  let { shoe } = gameState;
  const updatedPlayers = [...gameState.players];
  let cardsDealt = gameState.cardsDealt;
  let runningCount = gameState.runningCount;

  // First card to each player (face up)
  for (const playerIndex of playerIndices) {
    const { card, remainingShoe, reshuffled } = dealCard(shoe, gameState.numDecks);
    shoe = remainingShoe;
    cardsDealt++;

    // Reset count if reshuffled mid-hand
    if (reshuffled) {
      runningCount = 0;
      cardsDealt = 1; // Reset cards dealt counter
    }

    if (updatedPlayers[playerIndex].hands.length === 0) {
      updatedPlayers[playerIndex].hands = [{ cards: [card], bet: 0 }];
    } else {
      updatedPlayers[playerIndex].hands[0].cards.push(card);
    }

    // Update running count for visible cards
    if (!updatedPlayers[playerIndex].isDealer) {
      runningCount += card.count;
    }
  }

  // Second card to each player (face up)
  for (const playerIndex of playerIndices) {
    const { card, remainingShoe, reshuffled } = dealCard(shoe, gameState.numDecks);
    shoe = remainingShoe;
    cardsDealt++;

    // Reset count if reshuffled mid-hand
    if (reshuffled) {
      runningCount = 0;
      cardsDealt = 1;
    }

    updatedPlayers[playerIndex].hands[0].cards.push(card);

    // Update running count for visible cards
    // For dealer, only count the first (face-up) card
    if (!updatedPlayers[playerIndex].isDealer) {
      runningCount += card.count;
    } else if (updatedPlayers[playerIndex].hands[0].cards.length === 1) {
      runningCount += card.count;
    }
  }

  return {
    ...gameState,
    shoe,
    cardsDealt,
    runningCount,
    players: updatedPlayers,
  };
}

/**
 * Hit - add a card to the current hand
 * @param gameState Current game state
 * @param playerIndex Index of player hitting
 * @param handIndex Index of hand to hit
 * @returns Updated game state
 */
export function hit(
  gameState: GameState,
  playerIndex: number,
  handIndex: number
): GameState {
  const { card, remainingShoe, reshuffled } = dealCard(gameState.shoe, gameState.numDecks);
  const updatedPlayers = [...gameState.players];

  updatedPlayers[playerIndex].hands[handIndex].cards.push(card);

  return {
    ...gameState,
    shoe: remainingShoe,
    cardsDealt: reshuffled ? 1 : gameState.cardsDealt + 1,
    runningCount: reshuffled ? card.count : gameState.runningCount + card.count,
    players: updatedPlayers,
  };
}

/**
 * Double down - double bet and take exactly one more card
 * @param gameState Current game state
 * @param playerIndex Index of player doubling
 * @param handIndex Index of hand to double
 * @returns Updated game state
 */
export function doubleDown(
  gameState: GameState,
  playerIndex: number,
  handIndex: number
): GameState {
  const player = gameState.players[playerIndex];
  const hand = player.hands[handIndex];

  // Double the bet
  const doubleBet = hand.bet;

  // Deal one card
  const { card, remainingShoe, reshuffled } = dealCard(gameState.shoe, gameState.numDecks);
  const updatedPlayers = [...gameState.players];

  updatedPlayers[playerIndex].hands[handIndex].cards.push(card);
  updatedPlayers[playerIndex].hands[handIndex].bet += doubleBet;
  updatedPlayers[playerIndex].chips -= doubleBet;

  return {
    ...gameState,
    shoe: remainingShoe,
    cardsDealt: reshuffled ? 1 : gameState.cardsDealt + 1,
    runningCount: reshuffled ? card.count : gameState.runningCount + card.count,
    players: updatedPlayers,
    chips: gameState.chips - doubleBet,
  };
}

/**
 * Split - split a pair into two hands
 * @param gameState Current game state
 * @param playerIndex Index of player splitting
 * @param handIndex Index of hand to split
 * @returns Updated game state
 */
export function split(
  gameState: GameState,
  playerIndex: number,
  handIndex: number
): GameState {
  const player = gameState.players[playerIndex];
  const hand = player.hands[handIndex];

  if (!canSplit(hand.cards)) {
    throw new Error("Cannot split: hand does not have matching ranks");
  }

  const [card1, card2] = hand.cards;
  const bet = hand.bet;

  // Create two new hands
  const newHand1: Hand = { cards: [card1], bet };
  const newHand2: Hand = { cards: [card2], bet };

  // Deal one card to each new hand
  const { card: newCard1, remainingShoe: shoe1, reshuffled: reshuffled1 } = dealCard(gameState.shoe, gameState.numDecks);
  const { card: newCard2, remainingShoe: shoe2, reshuffled: reshuffled2 } = dealCard(shoe1, gameState.numDecks);

  newHand1.cards.push(newCard1);
  newHand2.cards.push(newCard2);

  const updatedPlayers = [...gameState.players];
  updatedPlayers[playerIndex].hands = [
    ...updatedPlayers[playerIndex].hands.slice(0, handIndex),
    newHand1,
    newHand2,
    ...updatedPlayers[playerIndex].hands.slice(handIndex + 1),
  ];
  updatedPlayers[playerIndex].chips -= bet; // Deduct bet for second hand

  // Handle reshuffles
  let newCardsDealt = gameState.cardsDealt + 2;
  let newRunningCount = gameState.runningCount + newCard1.count + newCard2.count;

  if (reshuffled1 || reshuffled2) {
    newCardsDealt = reshuffled2 ? 1 : 2;
    newRunningCount = reshuffled1 ? newCard1.count + (reshuffled2 ? 0 : newCard2.count) : newCard2.count;
  }

  return {
    ...gameState,
    shoe: shoe2,
    cardsDealt: newCardsDealt,
    runningCount: newRunningCount,
    players: updatedPlayers,
    chips: gameState.chips - bet,
  };
}

/**
 * Place a bet for the current hand
 * @param gameState Current game state
 * @param playerIndex Index of player betting
 * @param betAmount Amount to bet
 * @returns Updated game state
 */
export function placeBet(
  gameState: GameState,
  playerIndex: number,
  betAmount: number
): GameState {
  const player = gameState.players[playerIndex];

  if (betAmount > player.chips) {
    throw new Error("Insufficient chips for bet");
  }

  const updatedPlayers = [...gameState.players];
  updatedPlayers[playerIndex].hands = [{ cards: [], bet: betAmount }];
  updatedPlayers[playerIndex].chips -= betAmount;

  return {
    ...gameState,
    players: updatedPlayers,
    chips: gameState.chips - betAmount,
  };
}
