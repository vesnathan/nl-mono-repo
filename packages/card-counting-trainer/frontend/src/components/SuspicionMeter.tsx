"use client";

import { useEffect, useState } from "react";

interface SuspicionMeterProps {
  level: number; // 0-100 (alternate prop name)
  suspicionLevel?: number; // 0-100
  dealerName?: string;
  dealerDetectionSkill?: number; // 0-100
  onYourSide?: boolean;
}

export default function SuspicionMeter({
  level,
  suspicionLevel,
  dealerName,
  dealerDetectionSkill,
  onYourSide,
}: SuspicionMeterProps) {
  const [pulseAnimation, setPulseAnimation] = useState(false);

  const actualSuspicionLevel = level || suspicionLevel || 0;

  console.log("🔍 SuspicionMeter rendering:", {
    actualSuspicionLevel,
    dealerName,
    dealerDetectionSkill,
    onYourSide,
  });

  // Trigger pulse when suspicion increases significantly
  useEffect(() => {
    if (actualSuspicionLevel >= 60) {
      setPulseAnimation(true);
      const timer = setTimeout(() => setPulseAnimation(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [actualSuspicionLevel]);

  // Determine color and status based on suspicion level
  const getStatusInfo = () => {
    if (actualSuspicionLevel < 20) {
      return {
        color: "#4CAF50", // Green
        bgColor: "rgba(76, 175, 80, 0.2)",
        status: "CLEAR",
        message: "No heat",
      };
    } else if (actualSuspicionLevel < 40) {
      return {
        color: "#FFC107", // Yellow
        bgColor: "rgba(255, 193, 7, 0.2)",
        status: "WATCHED",
        message: "Dealer watching",
      };
    } else if (actualSuspicionLevel < 60) {
      return {
        color: "#FF9800", // Orange
        bgColor: "rgba(255, 152, 0, 0.2)",
        status: "NOTICED",
        message: "Pit boss aware",
      };
    } else {
      return {
        color: "#F44336", // Red
        bgColor: "rgba(244, 67, 54, 0.3)",
        status: "CRITICAL",
        message: "Risk of backoff!",
      };
    }
  };

  const { color, bgColor, status, message } = getStatusInfo();

  return (
    <div
      style={{
        position: "fixed",
        top: "100px",
        left: "20px",
        width: "220px",
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        border: `3px solid ${color}`,
        borderRadius: "12px",
        padding: "16px",
        zIndex: 50,
        boxShadow: pulseAnimation
          ? `0 0 30px ${color}`
          : `0 4px 12px rgba(0, 0, 0, 0.8)`,
        animation: pulseAnimation ? "pulse-warning 0.5s ease-in-out 2" : "none",
        pointerEvents: "none", // Don't block clicks
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            fontSize: "12px",
            color: "#AAA",
            fontWeight: "bold",
            marginBottom: "4px",
          }}
        >
          PIT BOSS ATTENTION
        </div>
        <div
          style={{
            fontSize: "16px",
            color: color,
            fontWeight: "bold",
          }}
        >
          {status}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#999",
            fontStyle: "italic",
          }}
        >
          {message}
        </div>
      </div>

      {/* Meter bar */}
      <div
        style={{
          height: "24px",
          backgroundColor: "#222",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #444",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${actualSuspicionLevel}%`,
            backgroundColor: color,
            transition: "width 0.5s ease-out, background-color 0.3s ease",
            boxShadow: `0 0 10px ${color}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "11px",
            fontWeight: "bold",
            color: "#FFF",
            textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
          }}
        >
          {actualSuspicionLevel}%
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-warning {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
