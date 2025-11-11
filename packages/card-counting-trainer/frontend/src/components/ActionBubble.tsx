"use client";

import { useEffect, useState } from "react";

interface ActionBubbleProps {
  action: "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "BUST" | "BLACKJACK";
  onComplete?: () => void;
  registerTimeout: (callback: () => void, delay: number) => NodeJS.Timeout;
}

export default function ActionBubble({
  action,
  onComplete,
  registerTimeout,
}: ActionBubbleProps) {
  const [opacity, setOpacity] = useState(0);
  const [transitionDuration, setTransitionDuration] = useState("0.15s"); // Quick fade in

  useEffect(() => {
    // Fade in quickly
    registerTimeout(() => {
      setTransitionDuration("0.1s"); // Very quick fade in
      setOpacity(0.85); // Slightly transparent
    }, 30);

    // Brief hold, then fade out
    registerTimeout(() => {
      setTransitionDuration("0.4s"); // Quick fade out
      setOpacity(0);
    }, 600); // Short display time - punchy!

    // Complete after fade out
    registerTimeout(() => {
      onComplete?.();
    }, 1100); // 600 + 500 (fade out duration + buffer)
  }, [onComplete, registerTimeout]);

  const getActionColor = () => {
    switch (action) {
      case "HIT":
        return "#4CAF50"; // Green
      case "STAND":
        return "#2196F3"; // Blue
      case "DOUBLE":
        return "#FF9800"; // Orange
      case "SPLIT":
        return "#9C27B0"; // Purple
      case "BUST":
        return "#F44336"; // Red
      case "BLACKJACK":
        return "#FFD700"; // Gold
      default:
        return "#4CAF50";
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        backgroundColor: getActionColor(),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: "16px",
        opacity,
        transition: `opacity ${transitionDuration} ease`,
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      {action}
    </div>
  );
}
