// Animation timing constants (single source of truth)
export const CARD_ANIMATION_DURATION = 1500; // SLOWED DOWN FOR TESTING - was 800ms
export const CARD_APPEAR_TIME = 1400; // Slightly before animation completes for smooth transition

// Card size constants
export const CARD_WIDTH = 70; // px
export const CARD_HEIGHT = 98; // px
export const CARD_SPACING = 15; // px between cards

// Table positions for all 8 seats [left%, top%]
// Seats are numbered left-to-right (0=far left, 7=far right)
export const TABLE_POSITIONS: readonly [number, number][] = [
  [5, 55],  // Seat 0 - Far left
  [16, 62], // Seat 1 - Left
  [29, 68], // Seat 2 - Center-left
  [42, 72], // Seat 3 - Center
  [56, 72], // Seat 4 - Center
  [69, 68], // Seat 5 - Center-right
  [82, 62], // Seat 6 - Right
  [93, 55], // Seat 7 - Far right
] as const;
