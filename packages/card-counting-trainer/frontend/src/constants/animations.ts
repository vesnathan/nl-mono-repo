// Animation timing constants (single source of truth)
export const CARD_ANIMATION_DURATION = 1500; // SLOWED DOWN FOR TESTING - was 800ms
export const CARD_APPEAR_TIME = 1400; // Slightly before animation completes for smooth transition

// Card size constants
export const CARD_WIDTH = 70; // px
export const CARD_HEIGHT = 98; // px
export const CARD_SPACING = 15; // px between cards

// Table positions for all 8 seats [left%, top%]
// Seats are numbered right-to-left from dealer's perspective (0=first base, 7=third base)
export const TABLE_POSITIONS: readonly [number, number][] = [
  [93, 55], // Seat 0 - Far right (first base)
  [82, 62], // Seat 1 - Right
  [69, 68], // Seat 2 - Center-right
  [56, 72], // Seat 3 - Center
  [42, 72], // Seat 4 - Center
  [29, 68], // Seat 5 - Center-left
  [16, 62], // Seat 6 - Left
  [5, 55], // Seat 7 - Far left (third base)
] as const;
