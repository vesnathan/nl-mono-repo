"use client";

import { useEffect, useState } from "react";

interface WinLossBubbleProps {
  result?: "win" | "lose" | "push" | "blackjack";
  message?: string;
  position: { left: string; top: string };
  onComplete?: () => void;
}

export default function WinLossBubble({
  result,
  message,
  position,
  onComplete,
}: WinLossBubbleProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Bubble rises and fades out after 2 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const getMessage = () => {
    if (message) return message;

    switch (result) {
      case "win":
        return "WIN!";
      case "lose":
        return "LOSE";
      case "push":
        return "PUSH";
      case "blackjack":
        return "BLACKJACK!";
      default:
        return "";
    }
  };

  const getColor = () => {
    if (message) return "#FFF";

    switch (result) {
      case "win":
      case "blackjack":
        return "#4CAF50"; // Green
      case "lose":
        return "#F44336"; // Red
      case "push":
        return "#FFC107"; // Yellow
      default:
        return "#FFF";
    }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: position.left,
        top: position.top,
        transform: "translateX(-50%)",
        zIndex: 2000,
        animation: "rise-fade 2s ease-out forwards",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          color: getColor(),
          padding: "8px 16px",
          borderRadius: "20px",
          fontSize: "14px",
          fontWeight: "bold",
          border: `2px solid ${getColor()}`,
          boxShadow: `0 0 10px ${getColor()}`,
          whiteSpace: "nowrap",
        }}
      >
        {getMessage()}
      </div>
      <style jsx>{`
        @keyframes rise-fade {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(-50%);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
