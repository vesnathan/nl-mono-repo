interface PitBossDistanceProps {
  distance: number; // 0-100, higher = farther away (safer)
}

export default function PitBossDistance({ distance }: PitBossDistanceProps) {
  // Calculate color based on distance (closer = more red/dangerous)
  const getColor = () => {
    if (distance > 70) return "#4CAF50"; // Green - safe, far away
    if (distance > 40) return "#FFC107"; // Yellow - caution, moderate distance
    return "#F44336"; // Red - danger, very close
  };

  const getLabel = () => {
    if (distance > 80) return "Floor (Far)";
    if (distance > 60) return "Other Tables";
    if (distance > 40) return "Nearby";
    if (distance > 20) return "Watching";
    return "At Table!";
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#CCC",
          fontWeight: "500",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Pit Boss
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            color: getColor(),
            fontWeight: "bold",
            minWidth: "90px",
            textAlign: "center",
          }}
        >
          {getLabel()}
        </div>

        {/* Visual distance indicator */}
        <div
          style={{
            width: "100px",
            height: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "4px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              width: `${100 - distance}%`, // Inverted: less distance = fuller bar
              height: "100%",
              backgroundColor: getColor(),
              transition: "all 0.5s ease",
              borderRadius: "4px",
            }}
          />
        </div>
      </div>
    </div>
  );
}
