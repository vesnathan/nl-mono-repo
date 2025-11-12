/* eslint-disable sonarjs/no-duplicate-string */

"use client";

import { GameSettings } from "@/types/gameSettings";
import { StrategyAction, Card } from "@/types/game";
import { PlayerHand } from "@/types/gameState";
import { getBasicStrategyAction } from "@/lib/basicStrategy";
import { calculateHandValue, isSoftHand, canSplit } from "@/lib/gameActions";

interface BasicStrategyCardProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  playerHand?: PlayerHand;
  dealerUpCard?: Card;
}

export default function BasicStrategyCard({
  isOpen,
  onClose,
  settings,
  playerHand,
  dealerUpCard,
}: BasicStrategyCardProps) {
  if (!isOpen) return null;

  // Calculate recommended action if we have player hand and dealer card
  let recommendedAction: StrategyAction | null = null;
  let playerHandValue = 0;
  let isSoft = false;
  let isPair = false;
  let dealerCardValue = 0;

  if (playerHand && playerHand.cards.length > 0 && dealerUpCard) {
    playerHandValue = calculateHandValue(playerHand.cards);
    isSoft = isSoftHand(playerHand.cards);
    isPair = canSplit(playerHand.cards);
    dealerCardValue = dealerUpCard.rank === "A" ? 11 : dealerUpCard.value;

    recommendedAction = getBasicStrategyAction(
      playerHand.cards,
      dealerUpCard,
      settings,
      isPair,
      true, // canDoubleDown - assume true for now
    );
  }

  // Constants for table cell styling
  const HIGHLIGHTED_BORDER = "3px solid #FFD700";
  const HIGHLIGHTED_GLOW = "0 0 15px rgba(255, 215, 0, 0.8)";
  const NORMAL_BORDER = "1px solid #444";
  const NO_TRANSFORM = "none";

  const getActionColor = (action: StrategyAction): string => {
    switch (action) {
      case "H":
        return "#3B82F6";
      case "S":
        return "#EF4444";
      case "D":
        return "#10B981";
      case "SP":
        return "#F59E0B";
      case "SU":
        return "#8B5CF6";
      default:
        return "#6B7280";
    }
  };

  const getActionExplanation = (action: StrategyAction | null): string => {
    if (!action) return "";

    switch (action) {
      case "H":
        return "Hit - Take another card to improve your hand";
      case "S":
        return "Stand - Keep your current hand total";
      case "D":
        return "Double Down - Double your bet and receive exactly one more card";
      case "SP":
        return "Split - Separate your pair into two hands with separate bets";
      case "SU":
        return "Surrender - Forfeit half your bet and end the hand immediately";
      default:
        return "";
    }
  };

  // Helper function to check if a cell should be highlighted
  const shouldHighlightCell = (
    tableType: "hard" | "soft" | "pair",
    playerValue: string | number,
    dealerIdx: number,
    // eslint-disable-next-line sonarjs/cognitive-complexity
  ): boolean => {
    if (!playerHand || !dealerUpCard || !recommendedAction) return false;

    // Get dealer card index (2-9, 10, A)
    const dealerCardIdx = dealerCardValue === 11 ? 9 : dealerCardValue - 2;
    if (dealerCardIdx !== dealerIdx) return false;

    // Check if this is the right table and row
    if (isPair && tableType === "pair") {
      const pairValue = playerHand.cards[0].rank;
      return (
        playerValue === `${pairValue},${pairValue}` ||
        playerValue ===
          `${pairValue.replace("1", "10")},${pairValue.replace("1", "10")}`
      );
    }

    if (isSoft && tableType === "soft") {
      // For soft hands, check if the value matches
      if (typeof playerValue === "string" && playerValue.startsWith("A,")) {
        const softValue = parseInt(playerValue.split(",")[1], 10);
        const nonAceValue = playerHandValue - 11;
        return softValue === nonAceValue;
      }
      // Handle ranges like "A,2-3"
      if (typeof playerValue === "string" && playerValue.includes("-")) {
        const range = playerValue
          .split(",")[1]
          .split("-")
          .map((v) => parseInt(v, 10));
        const nonAceValue = playerHandValue - 11;
        return nonAceValue >= range[0] && nonAceValue <= range[1];
      }
    }

    if (!isSoft && !isPair && tableType === "hard") {
      // For hard hands
      if (typeof playerValue === "number") {
        return playerHandValue === playerValue;
      }
      // Handle ranges like "13-14"
      if (typeof playerValue === "string" && playerValue.includes("-")) {
        const range = playerValue.split("-").map((v) => parseInt(v, 10));
        return playerHandValue >= range[0] && playerHandValue <= range[1];
      }
      // Handle "17+"
      if (playerValue === "17+") {
        return playerHandValue >= 17;
      }
      // Handle "5-8"
      if (playerValue === "5-8") {
        return playerHandValue >= 5 && playerHandValue <= 8;
      }
    }

    return false;
  };

  const hardTotals = [
    {
      player: "17+",
      actions: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
    },
    {
      player: "16",
      actions: ["S", "S", "S", "S", "S", "H", "H", "SU", "SU", "SU"],
    },
    {
      player: "15",
      actions: ["S", "S", "S", "S", "S", "H", "H", "H", "SU", "H"],
    },
    {
      player: "13-14",
      actions: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
    },
    {
      player: "12",
      actions: ["H", "H", "S", "S", "S", "H", "H", "H", "H", "H"],
    },
    {
      player: "11",
      actions: ["D", "D", "D", "D", "D", "D", "D", "D", "D", "D"],
    },
    {
      player: "10",
      actions: ["D", "D", "D", "D", "D", "D", "D", "D", "H", "H"],
    },
    {
      player: "9",
      actions: settings.dealerHitsSoft17
        ? ["D", "D", "D", "D", "D", "H", "H", "H", "H", "H"]
        : ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"],
    },
    {
      player: "5-8",
      actions: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
    },
  ];

  const softTotals = [
    {
      player: "A,9",
      actions: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
    },
    {
      player: "A,8",
      actions: settings.dealerHitsSoft17
        ? ["S", "D", "D", "D", "D", "S", "S", "S", "S", "S"]
        : ["S", "S", "D", "D", "D", "S", "S", "S", "S", "S"],
    },
    {
      player: "A,7",
      actions: ["S", "D", "D", "D", "D", "S", "S", "H", "H", "H"],
    },
    {
      player: "A,6",
      actions: ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"],
    },
    {
      player: "A,4-5",
      actions: ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"],
    },
    {
      player: "A,2-3",
      actions: ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"],
    },
  ];

  const pairSplits = [
    {
      player: "A,A",
      actions: ["SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP"],
    },
    {
      player: "10,10",
      actions: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
    },
    {
      player: "9,9",
      actions: ["SP", "SP", "SP", "SP", "SP", "S", "SP", "SP", "S", "S"],
    },
    {
      player: "8,8",
      actions: ["SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP"],
    },
    {
      player: "7,7",
      actions: ["SP", "SP", "SP", "SP", "SP", "SP", "H", "H", "H", "H"],
    },
    {
      player: "6,6",
      actions: settings.doubleAfterSplit
        ? ["SP", "SP", "SP", "SP", "SP", "SP", "H", "H", "H", "H"]
        : ["SP", "SP", "SP", "SP", "SP", "H", "H", "H", "H", "H"],
    },
    {
      player: "5,5",
      actions: ["D", "D", "D", "D", "D", "D", "D", "D", "H", "H"],
    },
    {
      player: "4,4",
      actions: ["H", "H", "H", "SP", "SP", "H", "H", "H", "H", "H"],
    },
    {
      player: "2,2-3,3",
      actions: settings.doubleAfterSplit
        ? ["SP", "SP", "SP", "SP", "SP", "SP", "H", "H", "H", "H"]
        : ["H", "H", "SP", "SP", "SP", "SP", "H", "H", "H", "H"],
    },
  ];

  const dealerHeaders = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClose();
          }
        }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          zIndex: 9998,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "1100px",
          maxHeight: "90vh",
          backgroundColor: "#1a1a1a",
          borderRadius: "16px",
          padding: "24px",
          zIndex: 9999,
          overflowY: "auto",
          border: "2px solid #FFD700",
        }}
      >
        <div
          style={{
            marginBottom: "20px",
            borderBottom: "2px solid #333",
            paddingBottom: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#FFD700",
                margin: 0,
              }}
            >
              Basic Strategy Chart
            </h2>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: "transparent",
                color: "#AAA",
                border: "none",
                fontSize: "28px",
                cursor: "pointer",
                padding: "0 8px",
              }}
            >
              &times;
            </button>
          </div>
          <div style={{ fontSize: "13px", color: "#AAA", marginTop: "8px" }}>
            {settings.numberOfDecks} deck{settings.numberOfDecks > 1 ? "s" : ""}{" "}
            - Dealer {settings.dealerHitsSoft17 ? "hits" : "stands on"} soft 17
            - {settings.doubleAfterSplit ? "DAS allowed" : "No DAS"}
            {settings.lateSurrenderAllowed && " - Surrender allowed"}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#F59E0B",
              marginTop: "8px",
              fontWeight: "bold",
            }}
          >
            💰 Cost: 10 chips per peek
          </div>
        </div>

        {/* Recommended Action */}
        {recommendedAction && playerHand && dealerUpCard && (
          <div
            style={{
              marginBottom: "20px",
              padding: "16px",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "2px solid #10B981",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#10B981",
                marginBottom: "8px",
              }}
            >
              💡 RECOMMENDED ACTION
            </div>
            <div
              style={{
                fontSize: "16px",
                color: "#FFF",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              Your Hand: {playerHandValue}
              {isSoft && " (Soft)"}
              {isPair && ` (Pair of ${playerHand.cards[0].rank}s)`} • Dealer
              Shows: {dealerUpCard.rank}
            </div>
            <div
              style={{
                fontSize: "18px",
                color: getActionColor(recommendedAction),
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              → {getActionExplanation(recommendedAction)}
            </div>
          </div>
        )}

        <div
          style={{
            marginBottom: "20px",
            padding: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              fontSize: "13px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: getActionColor("H"),
                  borderRadius: "4px",
                }}
              />
              <span style={{ color: "#FFF" }}>Hit</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: getActionColor("S"),
                  borderRadius: "4px",
                }}
              />
              <span style={{ color: "#FFF" }}>Stand</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: getActionColor("D"),
                  borderRadius: "4px",
                }}
              />
              <span style={{ color: "#FFF" }}>Double</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: getActionColor("SP"),
                  borderRadius: "4px",
                }}
              />
              <span style={{ color: "#FFF" }}>Split</span>
            </div>
            {settings.lateSurrenderAllowed && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: getActionColor("SU"),
                    borderRadius: "4px",
                  }}
                />
                <span style={{ color: "#FFF" }}>Surrender</span>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "10px",
              }}
            >
              Hard Totals
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: "6px",
                        backgroundColor: "#2a2a2a",
                        color: "#AAA",
                        // eslint-disable-next-line sonarjs/no-duplicate-string
                        border: NORMAL_BORDER,
                      }}
                    >
                      Player
                    </th>
                    {dealerHeaders.map((header) => (
                      <th
                        key={header}
                        style={{
                          padding: "6px",
                          backgroundColor: "#2a2a2a",
                          color: "#FFD700",
                          border: NORMAL_BORDER,
                          fontSize: "11px",
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hardTotals.map((row) => (
                    <tr key={row.player}>
                      <td
                        style={{
                          padding: "6px",
                          backgroundColor: "#2a2a2a",
                          color: "#FFF",
                          fontWeight: "bold",
                          border: NORMAL_BORDER,
                          textAlign: "center",
                        }}
                      >
                        {row.player}
                      </td>
                      {row.actions.map((action, actionIdx) => {
                        const isHighlighted = shouldHighlightCell(
                          "hard",
                          row.player,
                          actionIdx,
                        );
                        return (
                          <td
                            key={dealerHeaders[actionIdx]}
                            style={{
                              padding: "6px",
                              backgroundColor: getActionColor(
                                action as StrategyAction,
                              ),
                              color: "#FFFFFF",
                              fontWeight: "bold",
                              border: isHighlighted
                                ? HIGHLIGHTED_BORDER
                                : NORMAL_BORDER,
                              textAlign: "center",
                              boxShadow: isHighlighted
                                ? HIGHLIGHTED_GLOW
                                : NO_TRANSFORM,
                              transform: isHighlighted
                                ? "scale(1.1)"
                                : NO_TRANSFORM,
                              position: "relative",
                              zIndex: isHighlighted ? 10 : 1,
                            }}
                          >
                            {action}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "10px",
              }}
            >
              Soft Totals
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: "6px",
                        backgroundColor: "#2a2a2a",
                        color: "#AAA",
                        border: NORMAL_BORDER,
                      }}
                    >
                      Player
                    </th>
                    {dealerHeaders.map((header) => (
                      <th
                        key={header}
                        style={{
                          padding: "6px",
                          backgroundColor: "#2a2a2a",
                          color: "#FFD700",
                          border: NORMAL_BORDER,
                          fontSize: "11px",
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {softTotals.map((row) => (
                    <tr key={row.player}>
                      <td
                        style={{
                          padding: "6px",
                          backgroundColor: "#2a2a2a",
                          color: "#FFF",
                          fontWeight: "bold",
                          border: NORMAL_BORDER,
                          textAlign: "center",
                        }}
                      >
                        {row.player}
                      </td>
                      {row.actions.map((action, actionIdx) => {
                        const isHighlighted = shouldHighlightCell(
                          "soft",
                          row.player,
                          actionIdx,
                        );
                        return (
                          <td
                            key={dealerHeaders[actionIdx]}
                            style={{
                              padding: "6px",
                              backgroundColor: getActionColor(
                                action as StrategyAction,
                              ),
                              color: "#FFFFFF",
                              fontWeight: "bold",
                              border: isHighlighted
                                ? HIGHLIGHTED_BORDER
                                : NORMAL_BORDER,
                              textAlign: "center",
                              boxShadow: isHighlighted
                                ? HIGHLIGHTED_GLOW
                                : NO_TRANSFORM,
                              transform: isHighlighted
                                ? "scale(1.1)"
                                : NO_TRANSFORM,
                              position: "relative",
                              zIndex: isHighlighted ? 10 : 1,
                            }}
                          >
                            {action}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: "#FFF",
              marginBottom: "10px",
            }}
          >
            Pair Splitting
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "6px",
                      backgroundColor: "#2a2a2a",
                      color: "#AAA",
                      border: NORMAL_BORDER,
                    }}
                  >
                    Pair
                  </th>
                  {dealerHeaders.map((header) => (
                    <th
                      key={header}
                      style={{
                        padding: "6px",
                        backgroundColor: "#2a2a2a",
                        color: "#FFD700",
                        border: NORMAL_BORDER,
                        fontSize: "11px",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pairSplits.map((row) => (
                  <tr key={row.player}>
                    <td
                      style={{
                        padding: "6px",
                        backgroundColor: "#2a2a2a",
                        color: "#FFF",
                        fontWeight: "bold",
                        border: NORMAL_BORDER,
                        textAlign: "center",
                      }}
                    >
                      {row.player}
                    </td>
                    {row.actions.map((action, actionIdx) => {
                      const isHighlighted = shouldHighlightCell(
                        "pair",
                        row.player,
                        actionIdx,
                      );
                      return (
                        <td
                          key={dealerHeaders[actionIdx]}
                          style={{
                            padding: "6px",
                            backgroundColor: getActionColor(
                              action as StrategyAction,
                            ),
                            color: "#FFFFFF",
                            fontWeight: "bold",
                            border: isHighlighted
                              ? HIGHLIGHTED_BORDER
                              : NORMAL_BORDER,
                            textAlign: "center",
                            boxShadow: isHighlighted
                              ? HIGHLIGHTED_GLOW
                              : NO_TRANSFORM,
                            transform: isHighlighted
                              ? "scale(1.1)"
                              : NO_TRANSFORM,
                            position: "relative",
                            zIndex: isHighlighted ? 10 : 1,
                          }}
                        >
                          {action}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: "#FFD700",
              color: "#000",
              border: "none",
              borderRadius: "8px",
              padding: "12px 32px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
