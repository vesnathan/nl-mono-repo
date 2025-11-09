// Animation timing constants (single source of truth)
export const CARD_ANIMATION_DURATION = 1500; // SLOWED DOWN FOR TESTING - was 800ms
export const CARD_APPEAR_TIME = 1400; // Slightly before animation completes for smooth transition

// Card size constants
export const CARD_WIDTH = 70; // px
export const CARD_HEIGHT = 98; // px
export const CARD_SPACING = 15; // px between cards

// Table positions for all 8 seats [left%, top%]
// Seats are numbered right-to-left from dealer's perspective (0=far right/first base, 7=far left/third base)
// Note: Positions shifted 1% right for better visual balance
export const TABLE_POSITIONS: readonly [number, number][] = [
  [94, 55], // Seat 0 - Far right (first base)
  [83, 62], // Seat 1 - Right
  [70, 68], // Seat 2 - Center-right
  [57, 72], // Seat 3 - Center
  [43, 72], // Seat 4 - Center
  [30, 68], // Seat 5 - Center-left
  [17, 62], // Seat 6 - Left
  [6, 55],  // Seat 7 - Far left (third base)
] as const;
