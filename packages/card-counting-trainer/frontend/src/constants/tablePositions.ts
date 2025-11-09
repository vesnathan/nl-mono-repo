/**
 * Table seat positions as [left%, top%] for all 8 seats
 * Seats are numbered 0-7, left to right around the table
 */
export const TABLE_POSITIONS: readonly [number, number][] = [
  [5, 55], // Seat 0 - Far left
  [16, 62], // Seat 1 - Left
  [29, 68], // Seat 2 - Center-left
  [42, 72], // Seat 3 - Center
  [56, 72], // Seat 4 - Center
  [69, 68], // Seat 5 - Center-right
  [82, 62], // Seat 6 - Right
  [93, 55], // Seat 7 - Far right
] as const;
