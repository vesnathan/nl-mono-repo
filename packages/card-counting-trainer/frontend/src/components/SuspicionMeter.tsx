/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable sonarjs/cognitive-complexity */

"use client";

import { useEffect, useState } from "react";
import { useGameState } from "@/contexts/GameStateContext";
import { useGameActions } from "@/contexts/GameActionsContext";

export default function SuspicionMeter() {
  const { suspicionLevel, dealerSuspicion, pitBossDistance, currentDealer } =
    useGameState();
  const { registerTimeout } = useGameActions();
  const [pulseAnimation, setPulseAnimation] = useState(false);

  const actualSuspicionLevel = suspicionLevel;

  // Trigger pulse when suspicion increases significantly
  useEffect(() => {
    if (actualSuspicionLevel >= 60) {
      setPulseAnimation(true);
      registerTimeout(() => setPulseAnimation(false), 1000);
    }
  }, [actualSuspicionLevel, registerTimeout]);

  // Determine color and status based on suspicion level
  const getStatusInfo = () => {
    if (actualSuspicionLevel < 20) {
      return {
        color: "#4CAF50", // Green
        bgColor: "rgba(76, 175, 80, 0.2)",
        status: "CLEAR",
        message: "No heat",
      };
    }
    if (actualSuspicionLevel < 40) {
      return {
        color: "#FFC107", // Yellow
        bgColor: "rgba(255, 193, 7, 0.2)",
        status: "WATCHED",
        message: "Dealer watching",
      };
    }
    if (actualSuspicionLevel < 60) {
      return {
        color: "#FF9800", // Orange
        bgColor: "rgba(255, 152, 0, 0.2)",
        status: "NOTICED",
        message: "Pit boss aware",
      };
    }
    return {
      color: "#F44336", // Red
      bgColor: "rgba(244, 67, 54, 0.3)",
      status: "CRITICAL",
      message: "Risk of backoff!",
    };
  };

  const { color, status, message } = getStatusInfo();

  return (
    <div
      style={{
        position: "fixed",
        top: "80px",
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
            color,
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

      {/* Dealer Suspicion */}
      {currentDealer && (
        <div style={{ marginTop: "12px" }}>
          <div
            style={{
              fontSize: "11px",
              color: "#AAA",
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          >
            DEALER SUSPICION
            {currentDealer.onYourSide && (
              <span
                style={{
                  color: "#4CAF50",
                  marginLeft: "6px",
                  fontSize: "10px",
                }}
              >
                (On Your Side)
              </span>
            )}
          </div>
          <div
            style={{
              height: "20px",
              backgroundColor: "#222",
              borderRadius: "10px",
              overflow: "hidden",
              border: "1px solid #444",
              position: "relative",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${dealerSuspicion}%`,
                backgroundColor: currentDealer.onYourSide
                  ? "#4CAF50"
                  : dealerSuspicion < 30
                    ? "#4CAF50"
                    : dealerSuspicion < 60
                      ? "#FFC107"
                      : "#F44336",
                transition: "width 0.5s ease-out, background-color 0.3s ease",
                boxShadow: currentDealer.onYourSide
                  ? "0 0 8px #4CAF50"
                  : `0 0 8px ${dealerSuspicion < 30 ? "#4CAF50" : dealerSuspicion < 60 ? "#FFC107" : "#F44336"}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "10px",
                fontWeight: "bold",
                color: "#FFF",
                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              {dealerSuspicion}%
            </div>
          </div>
        </div>
      )}

      {/* Pit Boss Distance */}
      {pitBossDistance !== undefined && (
        <div style={{ marginTop: "12px" }}>
          <div
            style={{
              fontSize: "11px",
              color: "#AAA",
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          >
            PIT BOSS DISTANCE
          </div>
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
                width: `${pitBossDistance}%`,
                backgroundColor:
                  pitBossDistance < 30
                    ? "#4CAF50"
                    : pitBossDistance < 60
                      ? "#FFC107"
                      : "#F44336",
                transition: "width 0.8s ease-out, background-color 0.3s ease",
                boxShadow: `0 0 10px ${pitBossDistance < 30 ? "#4CAF50" : pitBossDistance < 60 ? "#FFC107" : "#F44336"}`,
              }}
            />
          </div>
        </div>
      )}

      <style>{`
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
