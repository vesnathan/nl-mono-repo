interface DeckPenetrationIndicatorProps {
  cardsDealt: number;
  totalCards: number;
  penetrationPercent: number;
  showShuffle?: boolean;
}

export default function DeckPenetrationIndicator({
  cardsDealt,
  totalCards,
  penetrationPercent,
  showShuffle = false,
}: DeckPenetrationIndicatorProps) {
  const cardsRemaining = totalCards - cardsDealt;
  const percentRemaining = ((cardsRemaining / totalCards) * 100).toFixed(1);

  // Color coding based on how deep into the shoe we are
  const getColor = () => {
    if (penetrationPercent < 50) return "#4CAF50"; // Green - early shoe
    if (penetrationPercent < 75) return "#FFC107"; // Yellow - mid shoe
    return "#FF5722"; // Red - deep penetration
  };

  const getBackgroundColor = () => {
    if (penetrationPercent < 50) return "rgba(76, 175, 80, 0.1)";
    if (penetrationPercent < 75) return "rgba(255, 193, 7, 0.1)";
    return "rgba(255, 87, 34, 0.1)";
  };

  return (
    <div
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        border: "2px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "8px",
        padding: "12px 16px",
        minWidth: "220px",
        position: "relative",
      }}
    >
      {/* Shuffle notification */}
      {showShuffle && (
        <div
          style={{
            position: "absolute",
            top: "-8px",
            right: "-8px",
            backgroundColor: "#FF5722",
            color: "#FFF",
            borderRadius: "12px",
            padding: "4px 12px",
            fontSize: "12px",
            fontWeight: "bold",
            animation: "pulse 1.5s ease-in-out infinite",
            boxShadow: "0 2px 8px rgba(255, 87, 34, 0.5)",
          }}
        >
          🔀 SHUFFLE
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <span
          style={{
            color: "#FFF",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          SHOE DEPTH
        </span>
        <span
          style={{
            color: getColor(),
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          {penetrationPercent.toFixed(0)}%
        </span>
      </div>

      {/* Progress bar container */}
      <div
        style={{
          width: "100%",
          height: "24px",
          backgroundColor: "#1a1a1a",
          borderRadius: "4px",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          position: "relative",
        }}
      >
        {/* Progress fill */}
        <div
          style={{
            width: `${penetrationPercent}%`,
            height: "100%",
            backgroundColor: getColor(),
            transition:
              "width 0.3s ease-in-out, background-color 0.3s ease-in-out",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Animated shine effect */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "-100%",
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              animation: "shine 2s ease-in-out infinite",
            }}
          />
        </div>

        {/* Cut card indicator line (at penetration setting, typically 75%) */}
        <div
          style={{
            position: "absolute",
            left: "75%",
            top: 0,
            bottom: 0,
            width: "2px",
            backgroundColor: "#FFD700",
            boxShadow: "0 0 4px #FFD700",
          }}
        />
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "8px",
          fontSize: "12px",
          color: "rgba(255, 255, 255, 0.7)",
        }}
      >
        <span>
          {cardsDealt} / {totalCards} dealt
        </span>
        <span>{cardsRemaining} left</span>
      </div>

      {/* Keyframes for animations */}
      <style>{`
        @keyframes shine {
          0% {
            left: -100%;
          }
          50%, 100% {
            left: 100%;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
