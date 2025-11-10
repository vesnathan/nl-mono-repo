"use client";

import { Card } from "@/types/game";

interface SplitHandsModalProps {
  isOpen: boolean;
  hands: Array<{
    cards: Card[];
    bet: number;
    finished: boolean;
    busted: boolean;
  }>;
  activeHandIndex: number;
  onHit: () => void;
  onStand: () => void;
  onClose: () => void;
  canMinimize: boolean; // Can minimize when it's not player's turn
}

export default function SplitHandsModal({
  isOpen,
  hands,
  activeHandIndex,
  onHit,
  onStand,
  onClose,
  canMinimize,
}: SplitHandsModalProps) {
  if (!isOpen) return null;

  const calculateHandValue = (cards: Card[]) => {
    let value = 0;
    let aces = 0;

    for (const card of cards) {
      value += card.value;
      if (card.rank === "A") aces++;
    }

    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }

    return value;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10000,
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        border: "3px solid #FFD700",
        borderRadius: "16px",
        padding: "32px",
        minWidth: "600px",
        maxWidth: "800px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            color: "#FFD700",
            margin: 0,
          }}
        >
          Split Hands
        </h2>
        {canMinimize && (
          <button
            onClick={onClose}
            style={{
              backgroundColor: "transparent",
              color: "#FFD700",
              border: "2px solid #FFD700",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 215, 0, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Minimize
          </button>
        )}
      </div>

      {/* Display both hands */}
      <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
        {hands.map((hand, index) => {
          const handValue = calculateHandValue(hand.cards);
          const isActive = index === activeHandIndex;
          const isBusted = hand.busted || handValue > 21;

          return (
            <div
              key={index}
              style={{
                flex: 1,
                border: `3px solid ${isActive ? "#FFD700" : isBusted ? "#FF0000" : "#666"}`,
                borderRadius: "12px",
                padding: "16px",
                backgroundColor: isActive
                  ? "rgba(255, 215, 0, 0.1)"
                  : isBusted
                    ? "rgba(255, 0, 0, 0.1)"
                    : "rgba(255, 255, 255, 0.05)",
                opacity: hand.finished && !isActive ? 0.6 : 1,
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: isActive ? "#FFD700" : "#FFF",
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Hand {index + 1}</span>
                {isActive && !hand.finished && (
                  <span
                    style={{
                      fontSize: "14px",
                      backgroundColor: "#FFD700",
                      color: "#000",
                      padding: "4px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    ACTIVE
                  </span>
                )}
                {hand.finished && !isBusted && (
                  <span
                    style={{
                      fontSize: "14px",
                      backgroundColor: "#4CAF50",
                      color: "#FFF",
                      padding: "4px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    DONE
                  </span>
                )}
                {isBusted && (
                  <span
                    style={{
                      fontSize: "14px",
                      backgroundColor: "#FF0000",
                      color: "#FFF",
                      padding: "4px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    BUST
                  </span>
                )}
              </div>

              {/* Cards */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginBottom: "12px",
                  minHeight: "80px",
                }}
              >
                {hand.cards.map((card, cardIndex) => (
                  <div
                    key={cardIndex}
                    style={{
                      width: "50px",
                      height: "70px",
                      backgroundColor: "#FFF",
                      border: "2px solid #000",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      fontWeight: "bold",
                      color:
                        card.suit === "H" || card.suit === "D"
                          ? "#FF0000"
                          : "#000",
                    }}
                  >
                    {card.rank}
                    {card.suit === "H" ? "♥" : card.suit === "D" ? "♦" : card.suit === "C" ? "♣" : "♠"}
                  </div>
                ))}
              </div>

              {/* Hand info */}
              <div style={{ color: "#FFF", fontSize: "14px" }}>
                <div>Value: {handValue}</div>
                <div>Bet: ${hand.bet}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons - only shown for active hand */}
      {!hands[activeHandIndex]?.finished &&
        !hands[activeHandIndex]?.busted &&
        calculateHandValue(hands[activeHandIndex]?.cards || []) <= 21 && (
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={onStand}
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#FFF",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "8px",
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.borderColor = "#FFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
              }}
            >
              STAND
            </button>

            <button
              onClick={onHit}
              style={{
                flex: 1,
                backgroundColor: "#4CAF50",
                color: "#FFF",
                border: "none",
                borderRadius: "8px",
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#45a049";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#4CAF50";
              }}
            >
              HIT
            </button>
          </div>
        )}
    </div>
  );
}
