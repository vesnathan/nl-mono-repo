"use client";

import { useEffect, useState } from "react";

interface ActionBubbleProps {
  action: "HIT" | "STAND" | "DOUBLE" | "SPLIT";
  onComplete?: () => void;
}

export default function ActionBubble({ action, onComplete }: ActionBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in
    const fadeInTimer = setTimeout(() => setIsVisible(true), 50);

    // Fade out and complete after 1.5 seconds
    const fadeOutTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete?.(), 300);
    }, 1500);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
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
        top: "-40px",
        left: "50%",
        transform: `translateX(-50%) scale(${isVisible ? 1 : 0.8})`,
        backgroundColor: getActionColor(),
        color: "white",
        padding: "8px 16px",
        borderRadius: "20px",
        fontWeight: "bold",
        fontSize: "14px",
        whiteSpace: "nowrap",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        opacity: isVisible ? 1 : 0,
        transition: "all 0.3s ease",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      {action}
    </div>
  );
}
