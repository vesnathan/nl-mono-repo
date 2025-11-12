"use client";

interface TurnIndicatorProps {
  isActive: boolean;
}

export default function TurnIndicator({ isActive }: TurnIndicatorProps) {
  if (!isActive) return null;

  return (
    <>
      {/* Pulsing glow effect */}
      <div
        style={{
          position: "absolute",
          inset: "-8px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%)",
          animation: "pulse-glow 2s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: -1,
        }}
      />

      {/* Rotating border */}
      <div
        style={{
          position: "absolute",
          inset: "-6px",
          borderRadius: "50%",
          border: "3px solid transparent",
          borderTopColor: "#FFD700",
          borderRightColor: "#FFD700",
          animation: "spin 2s linear infinite",
          pointerEvents: "none",
        }}
      />

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{`
        @keyframes pulse-glow {
          0%,
          100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
