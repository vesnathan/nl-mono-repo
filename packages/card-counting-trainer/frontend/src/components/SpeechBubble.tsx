import React from "react";

interface SpeechBubbleProps {
  message: string;
  position: { left: string; top: string };
  playerId: string;
  isDealer?: boolean;
  playerPosition?: number; // Seat position (0-7), undefined for dealer
}

export default function SpeechBubble({
  message,
  position,
  playerId,
  isDealer = false,
  playerPosition,
}: SpeechBubbleProps) {
  // Determine bubble placement:
  // - Dealer (isDealer=true): bubble ABOVE, arrow pointing DOWN
  // - Players 0 & 7 (corners): bubble BELOW, arrow pointing UP
  // - Players 1-6 (sides): bubble ABOVE, arrow pointing DOWN
  const isCornerPlayer = playerPosition === 0 || playerPosition === 7;
  const bubbleBelow = !isDealer && isCornerPlayer;
  const arrowPointsUp = bubbleBelow;

  return (
    <div
      key={playerId}
      style={{
        position: "fixed",
        left: position.left,
        top: position.top,
        transform: bubbleBelow ? "translate(-50%, 0%)" : "translate(-50%, -100%)",
        zIndex: 1000,
        animation: bubbleBelow
          ? "speechFadeInBelow 0.3s ease-out"
          : "speechFadeInAbove 0.3s ease-out",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          color: "#000",
          padding: "18px 24px",
          borderRadius: "24px",
          fontSize: "18px",
          fontWeight: "600",
          maxWidth: "320px",
          minWidth: "160px",
          textAlign: "center",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
          border: "3px solid rgba(0, 0, 0, 0.15)",
          position: "relative",
          wordWrap: "break-word",
          lineHeight: "1.4",
        }}
      >
        {message}
        {/* Speech bubble pointer */}
        <div
          style={{
            position: "absolute",
            ...(arrowPointsUp
              ? {
                  // Arrow pointing UP (at top of bubble)
                  top: "-14px",
                  borderBottom: "14px solid rgba(255, 255, 255, 0.98)",
                }
              : {
                  // Arrow pointing DOWN (at bottom of bubble)
                  bottom: "-14px",
                  borderTop: "14px solid rgba(255, 255, 255, 0.98)",
                }),
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "14px solid transparent",
            borderRight: "14px solid transparent",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes speechFadeInAbove {
          from {
            opacity: 0;
            transform: translate(-50%, -100%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%) scale(1);
          }
        }
        @keyframes speechFadeInBelow {
          from {
            opacity: 0;
            transform: translate(-50%, 0%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0%) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
