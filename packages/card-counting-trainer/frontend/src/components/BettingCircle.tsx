interface BettingCircleProps {
  bet: number;
  position: { left: string; top: string };
  isPlayer?: boolean;
}

export default function BettingCircle({
  bet,
  position,
  isPlayer = false,
}: BettingCircleProps) {
  if (bet === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: position.left,
        top: position.top,
        transform: "translate(-50%, -50%)",
        zIndex: 10,
      }}
    >
      {/* Betting Circle */}
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          border: isPlayer ? "3px dashed #FFD700" : "3px dashed #666",
          backgroundColor: "rgba(0, 100, 0, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Chip Stack */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
          }}
        >
          {/* Visual chip representation */}
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              backgroundColor: "#000",
              border: "3px solid white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.6)",
            }}
          >
            {/* Inner circle */}
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "#000",
                border: "2px solid white",
              }}
            />
          </div>

          {/* Bet amount */}
          <div
            style={{
              marginTop: "4px",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid #FFD700",
            }}
          >
            <span
              style={{
                color: "#FFD700",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              ${bet}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
