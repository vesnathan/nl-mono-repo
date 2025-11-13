/* eslint-disable sonarjs/cognitive-complexity */
import React from "react";
import { debugLog } from "@/utils/debug";
import { TABLE_POSITIONS } from "@/constants/animations";
import PlayingCard from "@/components/PlayingCard";
import TurnIndicator from "@/components/TurnIndicator";
import ActionBubble from "@/components/ActionBubble";
import PlayerDecisionInfo from "@/components/PlayerDecisionInfo";
import AIDecisionInfo from "@/components/AIDecisionInfo";
import { getAIAvatarPath } from "@/data/aiCharacters";
import { useGameState } from "@/contexts/GameStateContext";
import { useGameActions } from "@/contexts/GameActionsContext";
import { useUIState } from "@/contexts/UIStateContext";
import { getBasicStrategyAction } from "@/lib/basicStrategy";

export default function TableSeats() {
  const {
    aiPlayers,
    playerSeat,
    playerHand,
    dealerHand,
    phase,
    activePlayerIndex,
    playerActions,
    gameSettings,
  } = useGameState();
  const { setPlayerSeat, registerTimeout } = useGameActions();
  const { devTestingMode, selectedTestScenario } = useUIState();

  // Determine which AI player is being tested (has forced cards in test scenario)
  const getTestedAIIndex = () => {
    if (!selectedTestScenario?.aiHands) return null;

    // Find the first AI player position that has forced cards
    const testedPositions = Object.keys(selectedTestScenario.aiHands).map(
      Number,
    );
    if (testedPositions.length === 0) return null;

    const testedPosition = testedPositions[0]; // Use first tested position
    const aiIndex = aiPlayers.findIndex((ai) => ai.position === testedPosition);
    return aiIndex >= 0 ? aiIndex : null;
  };

  const testedAIIndex = getTestedAIIndex();
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
              // eslint-disable-next-line sonarjs/no-duplicate-string
              transform: "translate(-50%, 0)",
              textAlign: "center",
            }}
          >
            {/* Empty Seat - Clickable */}
            {isEmpty && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (playerSeat === null) {
                    debugLog(
                      "gamePhases",
                      `=== PLAYER SITTING AT SEAT ${seatIndex} ===`,
                    );
                    debugLog("gamePhases", `Phase before sitting: ${phase}`);
                    setPlayerSeat(seatIndex);
                  } else {
                    debugLog(
                      "gamePhases",
                      `Cannot sit - player already seated at ${playerSeat}`,
                    );
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === " ") &&
                    playerSeat === null
                  ) {
                    setPlayerSeat(seatIndex);
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
                    {/* Cards positioned absolutely above - handle both regular and split hands */}
                    {(aiPlayer.hand.cards.length > 0 ||
                      (aiPlayer.hand.splitHands &&
                        aiPlayer.hand.splitHands.length > 0)) && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "calc(100% + 54px)",
                          left: "50%",
                          transform: "translate(-50%, 0)",
                          display: "flex",
                          gap: "20px",
                          justifyContent: "center",
                        }}
                      >
                        {/* Regular hand (not split) */}
                        {!aiPlayer.hand.splitHands &&
                          aiPlayer.hand.cards.length > 0 && (
                            <div
                              style={{
                                position: "relative",
                                width: "230px",
                                height: "210px",
                              }}
                            >
                              {aiPlayer.hand.cards.map((card, cardIdx) => {
                                const row = Math.floor(cardIdx / 3);
                                const col = cardIdx % 3;
                                return (
                                  <div
                                    key={`${card.rank}${card.suit}-${cardIdx}`}
                                    style={{
                                      position: "absolute",
                                      left: `${col * 74}px`,
                                      bottom: `${row * 102}px`,
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

                        {/* Split hands - render side by side */}
                        {aiPlayer.hand.splitHands &&
                          aiPlayer.hand.splitHands.map((splitHand, handIdx) => (
                            <div
                              key={`split-${handIdx}`}
                              style={{
                                position: "relative",
                                width: "150px",
                                height: "210px",
                                opacity:
                                  aiPlayer.hand.activeSplitHandIndex === handIdx
                                    ? 1
                                    : 0.6,
                                border:
                                  aiPlayer.hand.activeSplitHandIndex === handIdx
                                    ? "2px solid #FFD700"
                                    : "2px solid transparent",
                                borderRadius: "8px",
                                padding: "4px",
                              }}
                            >
                              {/* Hand number label */}
                              <div
                                style={{
                                  position: "absolute",
                                  top: "-20px",
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  fontSize: "12px",
                                  color: "#FFD700",
                                  fontWeight: "bold",
                                }}
                              >
                                Hand {handIdx + 1}
                              </div>
                              {splitHand.cards.map((card, cardIdx) => {
                                const row = Math.floor(cardIdx / 2);
                                const col = cardIdx % 2;
                                return (
                                  <div
                                    key={`${card.rank}${card.suit}-${cardIdx}`}
                                    style={{
                                      position: "absolute",
                                      left: `${col * 74}px`,
                                      bottom: `${row * 102}px`,
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
                          ))}
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
                      {/* AI Decision Info - shows decision stats in dev mode for tested AI only */}
                      {devTestingMode &&
                        phase === "AI_TURNS" &&
                        activePlayerIndex === aiPlayerIndex &&
                        aiPlayerIndex === testedAIIndex &&
                        aiPlayer.hand.cards.length >= 2 &&
                        dealerHand.cards.length > 0 &&
                        !aiPlayer.hand.splitHands && (
                          <AIDecisionInfo
                            character={aiPlayer.character}
                            playerCards={aiPlayer.hand.cards}
                            dealerUpCard={dealerHand.cards[0]}
                            basicStrategyAction={getBasicStrategyAction(
                              aiPlayer.hand.cards,
                              dealerHand.cards[0],
                              gameSettings,
                              aiPlayer.hand.cards.length === 2 &&
                                aiPlayer.hand.cards[0].rank ===
                                  aiPlayer.hand.cards[1].rank,
                              aiPlayer.hand.cards.length === 2,
                            )}
                            canSplit={
                              aiPlayer.hand.cards.length === 2 &&
                              aiPlayer.hand.cards[0].rank ===
                                aiPlayer.hand.cards[1].rank
                            }
                            canDouble={aiPlayer.hand.cards.length === 2}
                            canSurrender={gameSettings.lateSurrenderAllowed}
                          />
                        )}

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
                {/* Cards positioned absolutely above - handle both regular and split hands */}
                {(playerHand.cards.length > 0 ||
                  (playerHand.splitHands &&
                    playerHand.splitHands.length > 0)) && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 54px)",
                      left: "50%",
                      transform: "translate(-50%, 0)",
                      display: "flex",
                      gap: "20px",
                      justifyContent: "center",
                    }}
                  >
                    {/* Regular hand (not split) */}
                    {!playerHand.splitHands && playerHand.cards.length > 0 && (
                      <div
                        style={{
                          position: "relative",
                          width: "230px",
                          height: "210px",
                        }}
                      >
                        {playerHand.cards.map((card, cardIdx) => {
                          const row = Math.floor(cardIdx / 3);
                          const col = cardIdx % 3;
                          return (
                            <div
                              key={`${card.rank}${card.suit}-${cardIdx}`}
                              style={{
                                position: "absolute",
                                left: `${col * 74}px`,
                                bottom: `${row * 102}px`,
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

                    {/* Split hands - render side by side */}
                    {playerHand.splitHands &&
                      playerHand.splitHands.map((splitHand, handIdx) => (
                        <div
                          key={`split-${handIdx}`}
                          style={{
                            position: "relative",
                            width: "150px",
                            height: "210px",
                            opacity:
                              playerHand.activeSplitHandIndex === handIdx
                                ? 1
                                : 0.6,
                            border:
                              playerHand.activeSplitHandIndex === handIdx
                                ? "2px solid #FFD700"
                                : "2px solid transparent",
                            borderRadius: "8px",
                            padding: "4px",
                          }}
                        >
                          {/* Hand number label */}
                          <div
                            style={{
                              position: "absolute",
                              top: "-20px",
                              left: "50%",
                              transform: "translateX(-50%)",
                              fontSize: "12px",
                              color: "#FFD700",
                              fontWeight: "bold",
                            }}
                          >
                            Hand {handIdx + 1}
                          </div>
                          {splitHand.cards.map((card, cardIdx) => {
                            const row = Math.floor(cardIdx / 2);
                            const col = cardIdx % 2;
                            return (
                              <div
                                key={`${card.rank}${card.suit}-${cardIdx}`}
                                style={{
                                  position: "absolute",
                                  left: `${col * 74}px`,
                                  bottom: `${row * 102}px`,
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
                      ))}
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
                  {/* Player Decision Info - shows basic strategy recommendation in dev mode */}
                  {devTestingMode &&
                    phase === "PLAYER_TURN" &&
                    playerHand.cards.length >= 2 &&
                    dealerHand.cards.length > 0 && (
                      <PlayerDecisionInfo
                        playerCards={playerHand.cards}
                        dealerUpCard={dealerHand.cards[0]}
                        basicStrategyAction={getBasicStrategyAction(
                          playerHand.cards,
                          dealerHand.cards[0],
                          gameSettings,
                          playerHand.cards.length === 2 &&
                            playerHand.cards[0].rank ===
                              playerHand.cards[1].rank,
                          playerHand.cards.length === 2,
                        )}
                        canSplit={
                          playerHand.cards.length === 2 &&
                          playerHand.cards[0].rank === playerHand.cards[1].rank
                        }
                        canDouble={playerHand.cards.length === 2}
                        canSurrender={gameSettings.lateSurrenderAllowed}
                      />
                    )}

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
