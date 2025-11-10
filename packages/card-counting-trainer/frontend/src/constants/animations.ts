// Animation timing constants (single source of truth)
export const CARD_ANIMATION_DURATION = 800;
export const CARD_APPEAR_TIME = 700; // Slightly before animation completes for smooth transition

// Card size constants
export const CARD_WIDTH = 70; // px
export const CARD_HEIGHT = 98; // px
export const CARD_SPACING = 15; // px between cards

// Table positions for all 8 seats [left%, top%]
// Seats are numbered right-to-left from dealer's perspective (0=far right/first base, 7=far left/third base)
// Note: Moved down 35px (~4%), compressed horizontally for edge clearance
export const TABLE_POSITIONS: readonly [number, number][] = [
  [92, 59], // Seat 0 - Far right (first base)
  [80, 66], // Seat 1 - Right
  [68, 72], // Seat 2 - Center-right
  [56, 76], // Seat 3 - Center
  [43, 76], // Seat 4 - Center
  [31, 72], // Seat 5 - Center-left
  [19, 66], // Seat 6 - Left
  [7, 59], // Seat 7 - Far left (third base)
] as const;
