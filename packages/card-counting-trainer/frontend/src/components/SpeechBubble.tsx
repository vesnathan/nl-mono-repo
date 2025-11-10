import React from "react";

interface SpeechBubbleProps {
  message: string;
  position: { left: string; top: string };
  playerId: string;
}

export default function SpeechBubble({
  message,
  position,
  playerId,
}: SpeechBubbleProps) {
  return (
    <div
      key={playerId}
      style={{
        position: "fixed",
        left: position.left,
        top: position.top,
        transform: "translate(-50%, -100%)",
        zIndex: 1000,
        animation: "speechFadeIn 0.3s ease-out",
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
            bottom: "-14px",
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "14px solid transparent",
            borderRight: "14px solid transparent",
            borderTop: "14px solid rgba(255, 255, 255, 0.98)",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes speechFadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -100%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
