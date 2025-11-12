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
  // Determine bubble placement and arrow direction:
  // - Dealer (isDealer=true): bubble BELOW dealer, arrow at TOP of bubble pointing UP toward dealer
  // - Players 0 & 7 (bottom corners): bubble BELOW them, arrow at TOP pointing UP (arrow tip touches bottom of avatar)
  // - Players 1-6 (sides): bubble ABOVE them, arrow at BOTTOM of bubble pointing DOWN toward player
  const isBottomCorner = playerPosition === 0 || playerPosition === 7;
  const bubbleBelow = isDealer || isBottomCorner;

  // Arrow position: if bubble is below character, arrow goes at TOP (pointing up to character)
  // if bubble is above character, arrow goes at BOTTOM (pointing down to character)
  const arrowAtTop = bubbleBelow; // Arrow at top of bubble when bubble is below character

  return (
    <div
      key={playerId}
      style={{
        position: "fixed",
        left: position.left,
        top: position.top,
        transform: isBottomCorner
          ? "translate(-50%, calc(150px + 14px))" // Full avatar (150px) + arrow (14px) = arrow tip touches avatar bottom
          : bubbleBelow
            ? "translate(-50%, -40px)" // Dealer bubble - move up 40px
            : "translate(-50%, -100%)", // Side players - above player
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
            ...(arrowAtTop
              ? {
                  // Arrow at TOP of bubble, pointing UP toward character
                  top: "-14px",
                  borderBottom: "14px solid rgba(255, 255, 255, 0.98)",
                }
              : {
                  // Arrow at BOTTOM of bubble, pointing DOWN toward character
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
            transform: ${isBottomCorner ? "translate(-50%, calc(150px + 14px)) scale(0.8)" : "translate(-50%, -40px) scale(0.8)"};
          }
          to {
            opacity: 1;
            transform: ${isBottomCorner ? "translate(-50%, calc(150px + 14px)) scale(1)" : "translate(-50%, -40px) scale(1)"};
          }
        }
      `}</style>
    </div>
  );
}
