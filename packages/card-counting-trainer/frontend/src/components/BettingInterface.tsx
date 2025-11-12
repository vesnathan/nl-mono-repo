import { useState } from "react";

interface BettingInterfaceProps {
  playerChips: number;
  currentBet: number;
  minBet: number;
  maxBet: number;
  onBetChange: (newBet: number) => void;
  onConfirmBet: () => void;
  onClearBet: () => void;
}

const CHIP_VALUES = [5, 10, 25, 50, 100, 500];

const CHIP_COLORS: Record<number, string> = {
  5: "#EF4444", // Red
  10: "#3B82F6", // Blue
  25: "#10B981", // Green
  50: "#F59E0B", // Orange/Gold
  100: "#000000", // Black
  500: "#9B59B6", // Purple
};

export default function BettingInterface({
  playerChips,
  currentBet,
  minBet,
  maxBet,
  onBetChange,
  onConfirmBet,
  onClearBet,
}: BettingInterfaceProps) {
  const [selectedChipValue, setSelectedChipValue] = useState<number>(minBet);

  const handleChipClick = (value: number) => {
    setSelectedChipValue(value);
    const newBet = currentBet + value;
    if (newBet <= maxBet && newBet <= playerChips) {
      onBetChange(newBet);
    }
  };

  const canPlaceBet =
    currentBet >= minBet && currentBet <= maxBet && currentBet <= playerChips;
  const canAddChip = (value: number) => {
    const newBet = currentBet + value;
    return newBet <= maxBet && newBet <= playerChips;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        padding: "32px",
        borderRadius: "16px",
        border: "3px solid #FFD700",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8)",
        zIndex: 10000,
        minWidth: "400px",
      }}
    >
      {/* Title */}
      <h2
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          color: "#FFD700",
          marginBottom: "8px",
          textAlign: "center",
        }}
      >
        Place Your Bet
      </h2>

      {/* Current Bet Display */}
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#FFF", fontSize: "18px", marginBottom: "8px" }}>
          Current Bet
        </div>
        <div style={{ color: "#FFD700", fontSize: "32px", fontWeight: "bold" }}>
          ${currentBet}
        </div>
        <div style={{ color: "#888", fontSize: "12px", marginTop: "8px" }}>
          Min: ${minBet} | Max: ${maxBet}
        </div>
      </div>

      {/* Chip Selector */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        // eslint-disable-next-line sonarjs/cognitive-complexity //
        eslint-disable-next-line sonarjs/no-duplicate-string
        {CHIP_VALUES.map((value) => {
          const isAffordable = canAddChip(value);
          const isSelected = selectedChipValue === value;

          return (
            <button
              type="button"
              key={value}
              onClick={() => isAffordable && handleChipClick(value)}
              disabled={!isAffordable}
              style={{
                position: "relative",
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                border: isSelected ? "3px solid #FFD700" : "3px solid #333",
                backgroundColor: isAffordable ? CHIP_COLORS[value] : "#333",
                // eslint-disable-next-line sonarjs/no-duplicate-string
                cursor: isAffordable ? "pointer" : "not-allowed",
                opacity: isAffordable ? 1 : 0.4,
                // eslint-disable-next-line sonarjs/no-duplicate-string
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                boxShadow: isSelected
                  ? "0 0 20px rgba(255, 215, 0, 0.6)"
                  : "0 4px 8px rgba(0, 0, 0, 0.4)",
                transform: isSelected ? "scale(1.1)" : "scale(1)",
              }}
              onMouseEnter={(e) => {
                if (isAffordable) {
                  e.currentTarget.style.transform = "scale(1.15)";
                  e.currentTarget.style.boxShadow =
                    "0 0 20px rgba(255, 215, 0, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (isAffordable) {
                  e.currentTarget.style.transform = isSelected
                    ? "scale(1.1)"
                    : "scale(1)";
                  e.currentTarget.style.boxShadow = isSelected
                    ? "0 0 20px rgba(255, 215, 0, 0.6)"
                    : "0 4px 8px rgba(0, 0, 0, 0.4)";
                }
              }}
            >
              {/* White ring decoration */}
              <div
                style={{
                  position: "absolute",
                  width: "54px",
                  height: "54px",
                  borderRadius: "50%",
                  border: "2px solid white",
                  pointerEvents: "none",
                }}
              />

              {/* Inner colored circle */}
              <div
                style={{
                  position: "absolute",
                  width: "46px",
                  height: "46px",
                  borderRadius: "50%",
                  backgroundColor: isAffordable ? CHIP_COLORS[value] : "#333",
                  pointerEvents: "none",
                }}
              />

              {/* Chip value */}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  color: value === 100 ? "#FFD700" : "#FFF",
                  fontSize: "16px",
                  fontWeight: "bold",
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)",
                }}
              >
                ${value}
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "8px",
        }}
      >
        <button
          type="button"
          onClick={onClearBet}
          disabled={currentBet === 0}
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            border: "2px solid #EF4444",
            backgroundColor:
              currentBet > 0
                ? "rgba(239, 68, 68, 0.2)"
                : "rgba(100, 100, 100, 0.2)",
            color: currentBet > 0 ? "#EF4444" : "#666",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: currentBet > 0 ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (currentBet > 0) {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            if (currentBet > 0) {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
            }
          }}
        >
          Clear Bet
        </button>

        <button
          type="button"
          onClick={onConfirmBet}
          disabled={!canPlaceBet}
          style={{
            padding: "10px 32px",
            borderRadius: "8px",
            border: "2px solid #10B981",
            backgroundColor: canPlaceBet
              ? "rgba(16, 185, 129, 0.2)"
              : "rgba(100, 100, 100, 0.2)",
            color: canPlaceBet ? "#10B981" : "#666",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: canPlaceBet ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (canPlaceBet) {
              e.currentTarget.style.backgroundColor = "rgba(16, 185, 129, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            if (canPlaceBet) {
              e.currentTarget.style.backgroundColor = "rgba(16, 185, 129, 0.2)";
            }
          }}
        >
          Place Bet
        </button>
      </div>

      {/* Error Messages */}
      {currentBet > 0 && currentBet < minBet && (
        <div style={{ color: "#EF4444", fontSize: "12px", marginTop: "-8px" }}>
          Minimum bet is ${minBet}
        </div>
      )}
      {currentBet > playerChips && (
        <div style={{ color: "#EF4444", fontSize: "12px", marginTop: "-8px" }}>
          Insufficient chips
        </div>
      )}
      {currentBet > maxBet && (
        <div style={{ color: "#EF4444", fontSize: "12px", marginTop: "-8px" }}>
          Maximum bet is ${maxBet}
        </div>
      )}
    </div>
  );
}
