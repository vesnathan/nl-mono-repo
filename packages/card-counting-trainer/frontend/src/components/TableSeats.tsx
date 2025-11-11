import React from "react";
import { debugLog } from "@/utils/debug";
import { AIPlayer, PlayerHand, GamePhase } from "@/types/gameState";
import { TABLE_POSITIONS } from "@/constants/animations";
import PlayingCard from "@/components/PlayingCard";
import TurnIndicator from "@/components/TurnIndicator";
import ActionBubble from "@/components/ActionBubble";
import { getAIAvatarPath } from "@/data/aiCharacters";

type PlayerAction = "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "BUST" | "BLACKJACK";

interface TableSeatsProps {
  aiPlayers: AIPlayer[];
  playerSeat: number | null;
  playerHand: PlayerHand;
  phase: GamePhase;
  activePlayerIndex: number | null;
  playerActions: Map<number, PlayerAction>;
  onSeatClick: (seatIndex: number) => void;
  registerTimeout: (callback: () => void, delay: number) => NodeJS.Timeout;
}

export default function TableSeats({
  aiPlayers,
  playerSeat,
  playerHand,
  phase,
  activePlayerIndex,
  playerActions,
  onSeatClick,
  registerTimeout,
}: TableSeatsProps) {
  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
      }}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7].map((seatIndex) => {
        const [x, y] = TABLE_POSITIONS[seatIndex];
        // Find if this seat is occupied by an AI player
        const aiPlayer = aiPlayers.find((ai) => ai.position === seatIndex);
        const isPlayerSeat = playerSeat === seatIndex;
        const isEmpty = !aiPlayer && !isPlayerSeat;

        return (
          <div
            key={seatIndex}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, 0)",
              textAlign: "center",
            }}
          >
            {/* Empty Seat - Clickable */}
            {isEmpty && (
              <div
                onClick={() => {
                  if (playerSeat === null) {
                    debugLog(
                      "gamePhases",
                      `=== PLAYER SITTING AT SEAT ${seatIndex} ===`,
                    );
                    debugLog("gamePhases", `Phase before sitting: ${phase}`);
                    onSeatClick(seatIndex);
                  } else {
                    debugLog(
                      "gamePhases",
                      `Cannot sit - player already seated at ${playerSeat}`,
                    );
                  }
                }}
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  border: "3px solid rgba(255, 215, 0, 0.3)",
                  backgroundColor: "rgba(26, 71, 42, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: playerSeat === null ? "pointer" : "default",
                  transition: "all 0.3s ease",
                  boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.4)",
                }}
                onMouseEnter={(e) => {
                  if (playerSeat === null) {
                    e.currentTarget.style.border =
                      "3px solid rgba(255, 215, 0, 0.9)";
                    e.currentTarget.style.backgroundColor =
                      "rgba(26, 71, 42, 0.7)";
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow =
                      "0 0 20px rgba(255, 215, 0, 0.5)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (playerSeat === null) {
                    e.currentTarget.style.border =
                      "3px solid rgba(255, 215, 0, 0.3)";
                    e.currentTarget.style.backgroundColor =
                      "rgba(26, 71, 42, 0.4)";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "inset 0 2px 8px rgba(0, 0, 0, 0.4)";
                  }
                }}
              >
                <span
                  style={{
                    color: "rgba(255, 215, 0, 0.6)",
                    fontSize: "11px",
                    fontWeight: "bold",
                    letterSpacing: "1px",
                  }}
                >
                  {playerSeat === null ? "OPEN" : ""}
                </span>
              </div>
            )}

            {/* AI Player */}
            {aiPlayer &&
              (() => {
                // Find the index of this AI player in the aiPlayers array
                const aiPlayerIndex = aiPlayers.findIndex(
                  (ai) => ai.position === seatIndex,
                );

                return (
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    {/* Cards positioned absolutely above - fixed positions */}
                    {aiPlayer.hand.cards.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "calc(100% + 54px)", // 50px higher (was 4px, now 54px above avatar)
                          left: "50%",
                          transform: "translate(-50%, 0)", // Center horizontally, anchor to bottom
                          width: "230px", // 3 cards * 70px + 2 gaps * 4px
                          height: "210px", // Reserve space for 2 rows
                        }}
                      >
                        {/* Render each card in a fixed position - first row at bottom */}
                        {aiPlayer.hand.cards.map((card, cardIdx) => {
                          // Calculate row and column for this card (3 cards per row)
                          const row = Math.floor(cardIdx / 3); // Row 0 = first 3 cards, Row 1 = next 3, etc
                          const col = cardIdx % 3;
                          // Position from bottom: row 0 at bottom, row 1 above it, etc
                          // Fixed positions: left = col * (70px + 4px gap)
                          //                  bottom = row * (98px + 4px gap) - anchor from bottom
                          return (
                            <div
                              key={cardIdx}
                              style={{
                                position: "absolute",
                                left: `${col * 74}px`,
                                bottom: `${row * 102}px`, // Row 0 at bottom, higher rows stack above
                                width: "70px",
                                height: "98px",
                                zIndex: 10,
                              }}
                            >
                              <PlayingCard card={card} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* Avatar with indicators */}
                    <div
                      style={{
                        position: "relative",
                        width: "150px",
                        height: "150px",
                        marginBottom: "6px",
                      }}
                    >
                      {/* Turn Indicator */}
                      <TurnIndicator
                        isActive={activePlayerIndex === aiPlayerIndex}
                      />

                      {/* Action Bubble */}
                      {playerActions.has(aiPlayerIndex) && (
                        <ActionBubble
                          action={
                            playerActions.get(aiPlayerIndex)! as
                              | "HIT"
                              | "STAND"
                              | "DOUBLE"
                              | "SPLIT"
                              | "BUST"
                              | "BLACKJACK"
                          }
                          registerTimeout={registerTimeout}
                        />
                      )}

                      <div
                        style={{
                          width: "150px",
                          height: "150px",
                          borderRadius: "50%",
                          border: "4px solid #FFD700",
                          overflow: "hidden",
                          backgroundColor: "#333",
                        }}
                      >
                        <img
                          src={getAIAvatarPath(aiPlayer.character)}
                          alt={aiPlayer.character.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML =
                                '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:60px;color:#FFD700">?</div>';
                            }
                          }}
                        />
                      </div>
                    </div>
                    {/* Name */}
                    <div
                      className="text-white text-sm"
                      style={{
                        fontWeight: "bold",
                        textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                      }}
                    >
                      {aiPlayer.character.name}
                    </div>
                  </div>
                );
              })()}

            {/* Human Player */}
            {isPlayerSeat && (
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {/* Cards positioned absolutely above - fixed positions */}
                {playerHand.cards.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 54px)", // 50px higher (was 4px, now 54px above avatar)
                      left: "50%",
                      transform: "translate(-50%, 0)", // Center horizontally, anchor to bottom
                      width: "230px", // 3 cards * 70px + 2 gaps * 4px
                      height: "210px", // Reserve space for 2 rows
                    }}
                  >
                    {/* Render each card in a fixed position - first row at bottom */}
                    {playerHand.cards.map((card, cardIdx) => {
                      // Calculate row and column for this card (3 cards per row)
                      const row = Math.floor(cardIdx / 3); // Row 0 = first 3 cards, Row 1 = next 3, etc
                      const col = cardIdx % 3;
                      // Position from bottom: row 0 at bottom, row 1 above it, etc
                      // Fixed positions: left = col * (70px + 4px gap)
                      //                  bottom = row * (98px + 4px gap) - anchor from bottom
                      return (
                        <div
                          key={cardIdx}
                          style={{
                            position: "absolute",
                            left: `${col * 74}px`,
                            bottom: `${row * 102}px`, // Row 0 at bottom, higher rows stack above
                            width: "70px",
                            height: "98px",
                            zIndex: 10,
                          }}
                        >
                          <PlayingCard card={card} />
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Avatar with indicators */}
                <div
                  style={{
                    position: "relative",
                    width: "150px",
                    height: "150px",
                    marginBottom: "6px",
                  }}
                >
                  {/* Turn Indicator - active during PLAYER_TURN phase */}
                  <TurnIndicator isActive={phase === "PLAYER_TURN"} />

                  {/* Action Bubble - shows player actions (HIT, STAND, BUST, BLACKJACK) */}
                  {playerActions.has(-1) && (
                    <ActionBubble
                      action={
                        playerActions.get(-1)! as
                          | "HIT"
                          | "STAND"
                          | "DOUBLE"
                          | "SPLIT"
                          | "BUST"
                          | "BLACKJACK"
                      }
                      registerTimeout={registerTimeout}
                    />
                  )}

                  <div
                    style={{
                      width: "150px",
                      height: "150px",
                      borderRadius: "50%",
                      border: "4px solid #FFD700",
                      backgroundColor: "#1a472a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "48px",
                      color: "#FFD700",
                      fontWeight: "bold",
                      boxShadow: "0 0 20px rgba(255, 215, 0, 0.5)",
                    }}
                  >
                    YOU
                  </div>
                </div>
                {/* Name */}
                <div
                  className="text-white text-sm"
                  style={{
                    fontWeight: "bold",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                  }}
                >
                  You
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
