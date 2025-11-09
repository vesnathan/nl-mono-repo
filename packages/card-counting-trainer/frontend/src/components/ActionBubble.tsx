"use client";

import { useEffect, useState } from "react";

interface ActionBubbleProps {
  action: "HIT" | "STAND" | "DOUBLE" | "SPLIT";
  onComplete?: () => void;
}

export default function ActionBubble({ action, onComplete }: ActionBubbleProps) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Fade in quickly
    const fadeInTimer = setTimeout(() => setOpacity(1), 50);

    // Hold for a moment, then fade out
    const fadeOutTimer = setTimeout(() => {
      setOpacity(0);
    }, 1200);

    // Complete after fade out
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 1500);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

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
        opacity: opacity,
        transition: "opacity 0.3s ease",
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      {action}
    </div>
  );
}
