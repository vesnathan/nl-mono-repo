"use client";

import { Card as GameCard } from "@/types/game";

interface PlayerDecisionInfoProps {
  playerCards: GameCard[];
  dealerUpCard: GameCard;
  basicStrategyAction: "H" | "S" | "D" | "SP" | "SU";
  canSplit: boolean;
  canDouble: boolean;
  canSurrender: boolean;
}

export default function PlayerDecisionInfo({
  playerCards,
  dealerUpCard,
  basicStrategyAction,
  canSplit,
  canDouble,
  canSurrender,
}: PlayerDecisionInfoProps) {
  // Calculate hand value
  const handValue = playerCards.reduce((sum, card) => sum + card.value, 0);

  const getActionLabel = (action: string): string => {
    switch (action) {
      case "H":
        return "HIT";
      case "S":
        return "STAND";
      case "D":
        return "DOUBLE";
      case "SP":
        return "SPLIT";
      case "SU":
        return "SURRENDER";
      default:
        return action;
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case "H":
        return "#4CAF50"; // Green
      case "S":
        return "#2196F3"; // Blue
      case "D":
        return "#FF9800"; // Orange
      case "SP":
        return "#9C27B0"; // Purple
      case "SU":
        return "#F44336"; // Red
      default:
        return "#FFF";
    }
  };

  // Determine recommended action based on what's available
  let recommendedAction = basicStrategyAction;
  let note = "";

  // Handle double down conversion
  if (basicStrategyAction === "D" && !canDouble) {
    recommendedAction = "H";
    note = "Double not available - Hit instead";
  }

  // Handle split availability
  if (basicStrategyAction === "SP" && !canSplit) {
    recommendedAction = "H";
    note = "Split not available - Hit instead";
  }

  // Handle surrender conversion
  if (basicStrategyAction === "SU") {
    if (!canSurrender) {
      recommendedAction = "H";
      note = "Surrender not available - Hit instead";
    } else {
      note = "Surrender available";
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "-180px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        border: "3px solid #4CAF50",
        borderRadius: "16px",
        padding: "16px",
        minWidth: "280px",
        maxWidth: "320px",
        zIndex: 1000,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.9)",
        pointerEvents: "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: "16px",
          fontWeight: "bold",
          color: "#4CAF50",
          marginBottom: "12px",
          textAlign: "center",
        }}
      >
        📊 Basic Strategy Recommendation
      </div>

      {/* Hand info */}
      <div
        style={{
          fontSize: "13px",
          color: "#AAA",
          marginBottom: "12px",
          textAlign: "center",
        }}
      >
        Your {handValue} vs Dealer {dealerUpCard.rank}
      </div>

      {/* Recommended action */}
      <div
        style={{
          backgroundColor: "rgba(76, 175, 80, 0.15)",
          border: `2px solid ${getActionColor(recommendedAction)}`,
          borderRadius: "12px",
          padding: "12px",
          marginBottom: note ? "12px" : "0px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "14px", color: "#AAA" }}>Recommended:</span>
          <span
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: getActionColor(recommendedAction),
            }}
          >
            {getActionLabel(recommendedAction)}
          </span>
        </div>
      </div>

      {/* Note about conversions */}
      {note && (
        <div
          style={{
            fontSize: "12px",
            color: "#FF9800",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          ⚠️ {note}
        </div>
      )}

      {/* Available actions summary */}
      <div
        style={{
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            color: "#666",
            textAlign: "center",
            marginBottom: "6px",
          }}
        >
          Available Actions:
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {["H", "S"].map((action) => (
            <span
              key={action}
              style={{
                fontSize: "10px",
                padding: "4px 8px",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#AAA",
              }}
            >
              {getActionLabel(action)}
            </span>
          ))}
          {canDouble && (
            <span
              style={{
                fontSize: "10px",
                padding: "4px 8px",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 152, 0, 0.2)",
                color: "#FF9800",
              }}
            >
              DOUBLE
            </span>
          )}
          {canSplit && (
            <span
              style={{
                fontSize: "10px",
                padding: "4px 8px",
                borderRadius: "4px",
                backgroundColor: "rgba(156, 39, 176, 0.2)",
                color: "#9C27B0",
              }}
            >
              SPLIT
            </span>
          )}
          {canSurrender && (
            <span
              style={{
                fontSize: "10px",
                padding: "4px 8px",
                borderRadius: "4px",
                backgroundColor: "rgba(244, 67, 54, 0.2)",
                color: "#F44336",
              }}
            >
              SURRENDER
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
