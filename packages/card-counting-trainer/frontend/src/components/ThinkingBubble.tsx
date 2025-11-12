"use client";

import { useEffect, useState } from "react";

interface ThinkingBubbleProps {
  position: { left: string; top: string };
  message?: string;
  type?: "thinking" | "action"; // "thinking" = bounce with tail, "action" = rise and fade
}

export default function ThinkingBubble({
  position,
  message = "...",
  type = "thinking",
}: ThinkingBubbleProps) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    // Animate dots: . -> .. -> ... -> . (only for thinking bubbles)
    if (type !== "thinking") {
      return undefined;
    }
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === ".") return "..";
        if (prev === "..") return "...";
        return ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [type]);

  const getColor = () => {
    if (message === "HIT") return "#4CAF50"; // Green
    if (message === "STAND") return "#2196F3"; // Blue
    if (message === "BUST") return "#F44336"; // Red
    return "#333"; // Default black
  };

  if (type === "action") {
    // Rising and fading action bubble (HIT/STAND)
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
            padding: "10px 20px",
            borderRadius: "20px",
            fontSize: "18px",
            fontWeight: "bold",
            border: `2px solid ${getColor()}`,
            boxShadow: `0 0 15px ${getColor()}`,
            whiteSpace: "nowrap",
          }}
        >
          {message}
        </div>
        <style jsx>{`
          @keyframes rise-fade {
            0% {
              opacity: 1;
              transform: translateY(0) translateX(-50%);
            }
            100% {
              opacity: 0;
              transform: translateY(-80px) translateX(-50%);
            }
          }
        `}</style>
      </div>
    );
  }

  // Thinking bubble with bounce and tail
  return (
    <div
      style={{
        position: "absolute",
        left: position.left,
        top: position.top,
        transform: "translateX(-50%) translateY(-100%)",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      {/* Thinking bubble */}
      <div
        style={{
          position: "relative",
          backgroundColor: "#FFFFFF",
          border: "2px solid #333",
          borderRadius: "20px",
          padding: "12px 20px",
          fontSize: "16px",
          fontWeight: "500",
          color: "#333",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          minWidth: "80px",
          textAlign: "center",
          animation: "bounce 1s ease-in-out infinite",
        }}
      >
        {message === "..." ? dots : message}

        {/* Bubble tail */}
        <div
          style={{
            position: "absolute",
            bottom: "-10px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "0",
            height: "0",
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "10px solid #333",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-7px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "0",
            height: "0",
            borderLeft: "9px solid transparent",
            borderRight: "9px solid transparent",
            borderTop: "9px solid #FFFFFF",
          }}
        />
      </div>

      {/* Small bubble dots */}
      <div
        style={{
          position: "absolute",
          bottom: "-20px",
          left: "40%",
          width: "8px",
          height: "8px",
          backgroundColor: "#FFFFFF",
          border: "2px solid #333",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-28px",
          left: "35%",
          width: "5px",
          height: "5px",
          backgroundColor: "#FFFFFF",
          border: "2px solid #333",
          borderRadius: "50%",
        }}
      />

      <style jsx>{`
        @keyframes bounce {
          0%,
          100% {
            transform: translateX(-50%) translateY(-100%);
          }
          50% {
            transform: translateX(-50%) translateY(-105%);
          }
        }
      `}</style>
    </div>
  );
}
