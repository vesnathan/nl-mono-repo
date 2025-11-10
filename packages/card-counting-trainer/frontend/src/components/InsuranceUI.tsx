"use client";

interface InsuranceUIProps {
  currentBet: number;
  playerChips: number;
  onTakeInsurance: () => void;
  onDeclineInsurance: () => void;
}

export default function InsuranceUI({
  currentBet,
  playerChips,
  onTakeInsurance,
  onDeclineInsurance,
}: InsuranceUIProps) {
  const insuranceCost = Math.floor(currentBet / 2);
  const canAffordInsurance = playerChips >= insuranceCost;

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
        minWidth: "400px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8)",
      }}
    >
      <h2
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          color: "#FFD700",
          marginBottom: "16px",
          textAlign: "center",
        }}
      >
        Insurance?
      </h2>

      <div
        style={{
          fontSize: "16px",
          color: "#FFF",
          marginBottom: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ marginBottom: "12px" }}>
          Dealer is showing an <span style={{ color: "#FFD700" }}>Ace</span>
        </p>
        <p style={{ marginBottom: "12px" }}>
          Insurance costs:{" "}
          <span style={{ color: "#4CAF50", fontWeight: "bold" }}>
            ${insuranceCost}
          </span>
        </p>
        <p style={{ fontSize: "14px", color: "#AAA" }}>
          Pays 2:1 if dealer has blackjack
        </p>
      </div>

      <div style={{ display: "flex", gap: "16px" }}>
        <button
          onClick={onDeclineInsurance}
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
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
            e.currentTarget.style.borderColor = "#FFF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
          }}
        >
          No Thanks
        </button>

        <button
          onClick={onTakeInsurance}
          disabled={!canAffordInsurance}
          style={{
            flex: 1,
            backgroundColor: canAffordInsurance ? "#4CAF50" : "#666",
            color: "#FFF",
            border: "none",
            borderRadius: "8px",
            padding: "12px 24px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: canAffordInsurance ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
            opacity: canAffordInsurance ? 1 : 0.5,
          }}
          onMouseEnter={(e) => {
            if (canAffordInsurance) {
              e.currentTarget.style.backgroundColor = "#45a049";
            }
          }}
          onMouseLeave={(e) => {
            if (canAffordInsurance) {
              e.currentTarget.style.backgroundColor = "#4CAF50";
            }
          }}
        >
          Take Insurance
        </button>
      </div>

      {!canAffordInsurance && (
        <p
          style={{
            marginTop: "16px",
            fontSize: "14px",
            color: "#FF6B6B",
            textAlign: "center",
          }}
        >
          Not enough chips for insurance
        </p>
      )}
    </div>
  );
}
