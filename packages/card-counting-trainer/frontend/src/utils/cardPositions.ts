import { AIPlayer } from "@/types/gameState";
import { TABLE_POSITIONS } from "@/constants/animations";

/**
 * Calculate the position for a flying card animation
 * Returns CSS position values (left, top) for the card's destination
 *
 * @param type - Type of card position: "ai", "player", "dealer", or "shoe"
 * @param aiPlayers - Array of AI players (needed for AI player positions)
 * @param playerSeat - Player's seat number (0-7) or null if not seated
 * @param index - AI player index (for type="ai")
 * @param cardIndex - Card index in hand (for calculating grid position)
 * @returns Position object with left and top CSS values
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export function getCardPosition(
  type: "ai" | "player" | "dealer" | "shoe",
  aiPlayers: AIPlayer[],
  playerSeat: number | null,
  index?: number,
  cardIndex?: number,
): { left: string; top: string } {
  if (type === "shoe") {
    // Flying card animation start position - offset from actual shoe for better visibility
    // Shoe component is at right: 7% (left: 93%), top: 20px
    // Cards start 20px left and 20px down from there
    return { left: "calc(93% - 20px)", top: "40px" };
  }

  if (type === "dealer") {
    // Dealer cards: rendered at idx * 74px in a 370px centered container
    // Container is at left: calc(50% - 185px), cards are at left: idx * 74px within container
    // So absolute position is: calc(50% - 185px + idx * 74px)
    const containerOffset = -185; // 370px / 2
    const cardOffset = cardIndex !== undefined ? cardIndex * 74 : 0;
    return {
      left: `calc(50% + ${containerOffset + cardOffset}px)`,
      top: "calc(3% + 162px + 4px)",
    };
  }

  if (type === "player" && playerSeat !== null) {
    const [x, y] = TABLE_POSITIONS[playerSeat];
    // Player cards: rendered in 230px centered container with col * 74px, row * 102px
    // Cards use grid: 3 per row, positioned from BOTTOM (row 0 at bottom, row 1 above it)
    const cardsPerRow = 3;
    const col = cardIndex !== undefined ? cardIndex % cardsPerRow : 0;
    const row =
      cardIndex !== undefined ? Math.floor(cardIndex / cardsPerRow) : 0;
    const containerOffset = -115; // 230px / 2
    const cardLeft = col * 74;
    const cardBottomOffset = row * 102; // Higher rows need LOWER top values (subtract)
    return {
      left: `calc(${x}% + ${containerOffset + cardLeft}px)`,
      top: `calc(${y}% - 151px - ${cardBottomOffset}px)`, // 150px avatar + 54px gap - 98px card height - 45px adjustment - row offset
    };
  }

  if (type === "ai" && index !== undefined) {
    const aiPlayer = aiPlayers[index];
    if (aiPlayer) {
      const [x, y] = TABLE_POSITIONS[aiPlayer.position];
      // AI cards: same as player - rendered in 230px centered container with col * 74px, row * 102px
      // Cards positioned from BOTTOM (row 0 at bottom, row 1 above it)
      const cardsPerRow = 3;
      const col = cardIndex !== undefined ? cardIndex % cardsPerRow : 0;
      const row =
        cardIndex !== undefined ? Math.floor(cardIndex / cardsPerRow) : 0;
      const containerOffset = -115; // 230px / 2
      const cardLeft = col * 74;
      const cardBottomOffset = row * 102; // Higher rows need LOWER top values (subtract)
      return {
        left: `calc(${x}% + ${containerOffset + cardLeft}px)`,
        top: `calc(${y}% - 151px - ${cardBottomOffset}px)`, // 150px avatar + 54px gap - 98px card height - 45px adjustment - row offset
      };
    }
  }

  // Default fallback
  return { left: "50%", top: "50%" };
}
