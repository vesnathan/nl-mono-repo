"use client";

import { AICharacter } from "@/data/aiCharacters";
import { Card as GameCard } from "@/types/game";

interface AIDecisionInfoProps {
  character: AICharacter;
  playerCards: GameCard[];
  dealerUpCard: GameCard;
  basicStrategyAction: "H" | "S" | "D" | "SP" | "SU";
  canSplit: boolean;
  canDouble: boolean;
  canSurrender: boolean;
}

export default function AIDecisionInfo({
  character,
  playerCards,
  dealerUpCard,
  basicStrategyAction,
  canSplit,
  canDouble: _canDouble,
  canSurrender,
}: AIDecisionInfoProps) {
  // Calculate hand value
  const handValue = playerCards.reduce((sum, card) => sum + card.value, 0);

  // Calculate probability of following basic strategy
  const followBasicStrategyChance = character.skillLevel;

  // Determine what AI will likely do
  let likelyAction = basicStrategyAction;
  let likelyActionProbability = followBasicStrategyChance;

  // AI never doubles (we don't care about their bet size)
  if (basicStrategyAction === "D") {
    likelyAction = "H";
    likelyActionProbability = 100; // Always converts to hit
  }

  // AI surrenders based on skill level and game rules
  if (basicStrategyAction === "SU") {
    if (canSurrender) {
      // Will surrender based on skill level
      likelyActionProbability = followBasicStrategyChance;
    } else {
      // Can't surrender, converts to hit
      likelyAction = "H";
      likelyActionProbability = 100;
    }
  }

  // If can't split, converts to hit or stand
  if (basicStrategyAction === "SP" && !canSplit) {
    // Basic logic: if hand value <= 16, hit; otherwise stand
    likelyAction = handValue <= 16 ? "H" : "S";
    likelyActionProbability = followBasicStrategyChance;
  }

  // Calculate random action probability
  const randomActionChance = 100 - followBasicStrategyChance;

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
        return "#AAA";
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "-90px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        border: "2px solid #FF9800",
        borderRadius: "12px",
        padding: "12px 16px",
        minWidth: "220px",
        maxWidth: "280px",
        zIndex: 100,
        pointerEvents: "none",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.8)",
      }}
    >
      {/* Character info */}
      <div
        style={{
          fontSize: "12px",
          fontWeight: "bold",
          color: "#FF9800",
          marginBottom: "8px",
          textAlign: "center",
        }}
      >
        {character.name} ({character.skillLevel}% skill)
      </div>

      {/* Hand info */}
      <div
        style={{
          fontSize: "11px",
          color: "#AAA",
          marginBottom: "8px",
          textAlign: "center",
        }}
      >
        Hand: {handValue} vs Dealer {dealerUpCard.rank}
      </div>

      {/* Likely action */}
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          borderRadius: "8px",
          padding: "8px",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            color: "#888",
            marginBottom: "4px",
          }}
        >
          Likely Action:
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              color: getActionColor(likelyAction),
            }}
          >
            {getActionLabel(likelyAction)}
          </span>
          <span
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              color: "#FFF",
            }}
          >
            {Math.round(likelyActionProbability)}%
          </span>
        </div>
      </div>

      {/* Random action probability */}
      {randomActionChance > 0 && (
        <div
          style={{
            fontSize: "10px",
            color: "#888",
            textAlign: "center",
          }}
        >
          {Math.round(randomActionChance)}% chance of random mistake
        </div>
      )}

      {/* Basic strategy note */}
      {basicStrategyAction !== likelyAction && (
        <div
          style={{
            fontSize: "9px",
            color: "#FF9800",
            marginTop: "8px",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          Note: Basic strategy says {getActionLabel(basicStrategyAction)}
          {basicStrategyAction === "D" && " (AI converts to HIT)"}
          {basicStrategyAction === "SU" &&
            !canSurrender &&
            " (surrender disabled)"}
        </div>
      )}
    </div>
  );
}
