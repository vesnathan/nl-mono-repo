"use client";

interface PlayerActionsModalProps {
  onHit: () => void;
  onStand: () => void;
}

export default function PlayerActionsModal({
  onHit,
  onStand,
}: PlayerActionsModalProps) {
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
          marginBottom: "24px",
          textAlign: "center",
        }}
      >
        Your Turn
      </h2>

      <div style={{ display: "flex", gap: "16px" }}>
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
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
            e.currentTarget.style.borderColor = "#FFF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
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
    </div>
  );
}
