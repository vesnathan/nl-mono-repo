import { Rank, Suit } from "./game";

/**
 * Test scenario for forcing specific hands to test AI decision-making
 */
export interface TestScenario {
  id: string;
  name: string;
  description: string;
  category:
    | "basic"
    | "split"
    | "double"
    | "surrender"
    | "insurance"
    | "soft-hands";

  // Dealer upcard
  dealerUpCard: { rank: Rank; suit: Suit };

  // Player/AI hands (null = any random cards)
  playerHands?: Array<{ rank: Rank; suit: Suit }>;

  // AI player hands (indexed by position, null = random)
  aiHands?: Record<number, Array<{ rank: Rank; suit: Suit }>>;

  // Expected basic strategy action
  expectedAction?: "H" | "S" | "D" | "SP" | "SU";

  // Game settings overrides for this scenario
  settingsOverride?: {
    lateSurrenderAllowed?: boolean;
    maxResplits?: number;
    resplitAces?: boolean;
    hitSplitAces?: boolean;
  };
}

// Predefined test scenarios
export const TEST_SCENARIOS: TestScenario[] = [
  // === BASIC STRATEGY SCENARIOS ===
  {
    id: "hard-16-vs-10",
    name: "Hard 16 vs Dealer 10",
    description: "Classic surrender scenario - player should surrender or hit",
    category: "surrender",
    dealerUpCard: { rank: "K", suit: "S" },
    playerHands: [
      { rank: "9", suit: "H" },
      { rank: "7", suit: "D" },
    ],
    expectedAction: "SU",
    settingsOverride: { lateSurrenderAllowed: true },
  },
  {
    id: "hard-12-vs-2",
    name: "Hard 12 vs Dealer 2",
    description: "Borderline case - should hit vs 2-3 or 7+",
    category: "basic",
    dealerUpCard: { rank: "2", suit: "H" },
    playerHands: [
      { rank: "10", suit: "S" },
      { rank: "2", suit: "C" },
    ],
    expectedAction: "H",
  },
  {
    id: "hard-13-vs-dealer-bust",
    name: "Hard 13 vs Dealer 5",
    description: "Stand against dealer bust cards (2-6)",
    category: "basic",
    dealerUpCard: { rank: "5", suit: "D" },
    playerHands: [
      { rank: "10", suit: "H" },
      { rank: "3", suit: "S" },
    ],
    expectedAction: "S",
  },

  // === SPLIT SCENARIOS ===
  {
    id: "split-8s-vs-10",
    name: "Split 8s vs Dealer 10",
    description: "Always split 8s - even against dealer 10",
    category: "split",
    dealerUpCard: { rank: "10", suit: "S" },
    playerHands: [
      { rank: "8", suit: "H" },
      { rank: "8", suit: "D" },
    ],
    aiHands: {
      2: [
        { rank: "8", suit: "C" },
        { rank: "8", suit: "S" },
      ],
    },
    expectedAction: "SP",
  },
  {
    id: "split-aces",
    name: "Split Aces vs Dealer 6",
    description: "Always split aces",
    category: "split",
    dealerUpCard: { rank: "6", suit: "H" },
    playerHands: [
      { rank: "A", suit: "S" },
      { rank: "A", suit: "H" },
    ],
    expectedAction: "SP",
  },
  {
    id: "split-10s-no",
    name: "Don't Split 10s",
    description: "Never split 10s - already have 20",
    category: "split",
    dealerUpCard: { rank: "5", suit: "D" },
    playerHands: [
      { rank: "K", suit: "S" },
      { rank: "Q", suit: "H" },
    ],
    expectedAction: "S",
  },

  // === DOUBLE DOWN SCENARIOS ===
  {
    id: "double-11-vs-6",
    name: "Double 11 vs Dealer 6",
    description: "Always double on 11",
    category: "double",
    dealerUpCard: { rank: "6", suit: "C" },
    playerHands: [
      { rank: "7", suit: "H" },
      { rank: "4", suit: "D" },
    ],
    expectedAction: "D",
  },
  {
    id: "double-soft-18",
    name: "Double Soft 18 vs Dealer 6",
    description: "Double soft 18 against dealer 3-6",
    category: "soft-hands",
    dealerUpCard: { rank: "6", suit: "S" },
    playerHands: [
      { rank: "A", suit: "H" },
      { rank: "7", suit: "D" },
    ],
    expectedAction: "D",
  },

  // === SOFT HAND SCENARIOS ===
  {
    id: "soft-17-hit",
    name: "Soft 17 - Always Hit",
    description: "Always hit soft 17 or less",
    category: "soft-hands",
    dealerUpCard: { rank: "9", suit: "H" },
    playerHands: [
      { rank: "A", suit: "S" },
      { rank: "6", suit: "C" },
    ],
    expectedAction: "H",
  },
  {
    id: "soft-18-vs-9",
    name: "Soft 18 vs Dealer 9",
    description: "Hit soft 18 against dealer 9, 10, or A",
    category: "soft-hands",
    dealerUpCard: { rank: "9", suit: "D" },
    playerHands: [
      { rank: "A", suit: "H" },
      { rank: "7", suit: "S" },
    ],
    expectedAction: "H",
  },
  {
    id: "soft-19-stand",
    name: "Soft 19 - Always Stand",
    description: "Always stand on soft 19+",
    category: "soft-hands",
    dealerUpCard: { rank: "K", suit: "S" },
    playerHands: [
      { rank: "A", suit: "D" },
      { rank: "8", suit: "C" },
    ],
    expectedAction: "S",
  },

  // === SURRENDER SCENARIOS ===
  {
    id: "surrender-16-vs-ace",
    name: "Surrender 16 vs Dealer Ace",
    description: "Surrender 16 against dealer Ace",
    category: "surrender",
    dealerUpCard: { rank: "A", suit: "H" },
    playerHands: [
      { rank: "10", suit: "S" },
      { rank: "6", suit: "D" },
    ],
    aiHands: {
      4: [
        { rank: "9", suit: "C" },
        { rank: "7", suit: "H" },
      ],
    },
    expectedAction: "SU",
    settingsOverride: { lateSurrenderAllowed: true },
  },
  {
    id: "surrender-15-vs-10",
    name: "Surrender 15 vs Dealer 10",
    description: "Surrender 15 against dealer 10",
    category: "surrender",
    dealerUpCard: { rank: "10", suit: "C" },
    playerHands: [
      { rank: "9", suit: "H" },
      { rank: "6", suit: "S" },
    ],
    expectedAction: "SU",
    settingsOverride: { lateSurrenderAllowed: true },
  },

  // === INSURANCE SCENARIOS ===
  {
    id: "insurance-decision",
    name: "Dealer Shows Ace",
    description: "Test insurance decision (usually decline unless counting)",
    category: "insurance",
    dealerUpCard: { rank: "A", suit: "S" },
    playerHands: [
      { rank: "K", suit: "H" },
      { rank: "9", suit: "D" },
    ],
  },
];

// Helper function to get scenarios by category
export function getScenariosByCategory(
  category: TestScenario["category"],
): TestScenario[] {
  return TEST_SCENARIOS.filter((s) => s.category === category);
}

// Helper function to get all categories
export function getScenarioCategories(): TestScenario["category"][] {
  return Array.from(new Set(TEST_SCENARIOS.map((s) => s.category)));
}
