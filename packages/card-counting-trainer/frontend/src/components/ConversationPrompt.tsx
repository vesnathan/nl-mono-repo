"use client";

import { useState, useEffect } from "react";

export interface ConversationChoice {
  text: string;
  suspicionChange: number; // Positive = increase suspicion, negative = decrease
}

interface ConversationPromptProps {
  // Who's asking (AI character id or "dealer")
  speakerName: string;
  question: string;
  choices: ConversationChoice[];
  position: { left: string; top: string };
  timeLimit?: number; // Time in ms before auto-ignore (default 15000)
  isPatreon?: boolean; // Whether this conversation mentions Patreon
  onResponse: (choiceIndex: number) => void;
  onIgnore: () => void;
  registerTimeout: (callback: () => void, delay: number) => NodeJS.Timeout;
}

export default function ConversationPrompt({
  speakerName,
  speakerName,
  question,
  choices,
  position,
  timeLimit = 15000,
  isPatreon = false,
  onResponse,
  onIgnore,
  registerTimeout,
}: ConversationPromptProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Countdown timer
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          onIgnore();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onIgnore]);

  const handleChoice = (index: number) => {
    setSelectedIndex(index);
    registerTimeout(() => {
      onResponse(index);
    }, 300); // Brief pause to show selection
  };

  const progressPercent = (timeRemaining / timeLimit) * 100;

  return (
    <div
      style={{
        position: "absolute",
        left: position.left,
        top: position.top,
        transform: "translateX(-50%) translateY(-120%)", // Position above avatar
        zIndex: 2500,
        minWidth: "280px",
        maxWidth: "350px",
        pointerEvents: "auto",
      }}
    >
      {/* Speech bubble container */}
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          border: "3px solid #4A90E2",
          borderRadius: "16px",
          padding: "16px",
          boxShadow:
            "0 8px 24px rgba(0, 0, 0, 0.8), 0 0 0 2px rgba(74, 144, 226, 0.3)",
          animation: "fadeInScale 0.3s ease-out",
        }}
      >
        {/* Speaker name */}
        <div
          style={{
            fontSize: "11px",
            color: "#4A90E2",
            fontWeight: "bold",
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {speakerName}
        </div>

        {/* Question */}
        <div
          style={{
            color: "#FFF",
            fontSize: "14px",
            marginBottom: "12px",
            lineHeight: "1.4",
          }}
        >
          {question}
        </div>

        {/* Response choices */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {choices.map((choice, index) => (
            <button
              type="button"
              key={index}
              onClick={() => handleChoice(index)}
              disabled={selectedIndex !== null}
              style={{
                backgroundColor:
                  selectedIndex === index
                    ? "#4A90E2"
                    : selectedIndex !== null
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(255, 255, 255, 0.15)",
                color: selectedIndex === index ? "#FFF" : "#DDD",
                border: "2px solid",
                borderColor:
                  selectedIndex === index ? "#FFF" : "rgba(255, 255, 255, 0.3)",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "13px",
                fontWeight: selectedIndex === index ? "bold" : "normal",
                cursor: selectedIndex === null ? "pointer" : "default",
                transition: "all 0.2s ease",
                textAlign: "left",
                opacity:
                  selectedIndex !== null && selectedIndex !== index ? 0.4 : 1,
              }}
              onMouseEnter={(e) => {
                if (selectedIndex === null) {
                  e.currentTarget.style.backgroundColor =
                    "rgba(74, 144, 226, 0.3)";
                  e.currentTarget.style.borderColor = "#4A90E2";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedIndex === null) {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.15)";
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.3)";
                }
              }}
            >
              {choice.text}
            </button>
          ))}
        </div>

        {/* Timer bar */}
        <div
          style={{
            marginTop: "12px",
            height: "4px",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPercent}%`,
              backgroundColor:
                progressPercent > 50
                  ? "#4CAF50"
                  : progressPercent > 20
                    ? "#FFC107"
                    : "#F44336",
              transition: "width 0.1s linear, background-color 0.3s ease",
            }}
          />
        </div>

        {/* Patreon Button */}
        {isPatreon && (
          <a
            href="https://www.patreon.com/YourPatreonPage"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              marginTop: "12px",
              padding: "8px 12px",
              backgroundColor: "#FF424D",
              color: "#FFF",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "bold",
              textAlign: "center",
              transition: "all 0.2s ease",
              border: "2px solid rgba(255, 255, 255, 0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F96854";
              e.currentTarget.style.borderColor = "#FFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#FF424D";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
            }}
          >
            ♥ Support on Patreon
          </a>
        )}

        {/* Ignore hint */}
        <div
          style={{
            marginTop: "8px",
            fontSize: "10px",
            color: "#999",
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          {timeRemaining > 5000 ? "Take your time..." : "⚠ Time running out!"}
        </div>
      </div>

      {/* Pointer/tail */}
      <div
        style={{
          position: "absolute",
          bottom: "-12px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderTop: "12px solid #4A90E2",
        }}
      />

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-120%) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(-120%) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
